import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── CSRF + Origin Validation Middleware ───────────────────────────────────────
//
// Protects all /api POST routes from:
//   1. Cross-site request forgery (CSRF) — requests from unexpected origins
//   2. Missing/spoofed content-type on mutation endpoints
//
// Next.js App Router does NOT add CSRF protection automatically.
// This middleware runs at the edge before any route handler is invoked.
//
// ─────────────────────────────────────────────────────────────────────────────

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Site URL(s) from env — comma-separated for multiple domains
 * (e.g. production + www, or preview + production during migration).
 */
function originsFromSiteUrlEnv(): string[] {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean);
}

/**
 * Vercel sets VERCEL_URL (no protocol) on every deployment, including previews.
 * Without this, POSTs from *.vercel.app get 403 when NEXT_PUBLIC_SITE_URL only
 * lists the production custom domain.
 */
function originsFromVercel(): string[] {
  const host = process.env.VERCEL_URL?.replace(/^https?:\/\//i, "").trim();
  if (!host) return [];
  return [`https://${host}`, `http://${host}`];
}

// Allowed origins — must match browser Origin / Referer for same-site POSTs.
function getAllowedOrigins(): string[] {
  const origins: string[] = [
    ...originsFromSiteUrlEnv(),
    ...originsFromVercel(),
    ...originsFromCsrfAllowlist(),
  ];

  // Local dev: common ports (any other localhost port is matched in isOriginAllowed)
  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    );
  }

  return [...new Set(origins)];
}

/** In dev, allow any localhost / 127.0.0.1 origin (any port). */
function isDevLocalhostOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const u = new URL(origin);
    return (
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      (u.protocol === "http:" || u.protocol === "https:")
    );
  } catch {
    return false;
  }
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  const n = normalizeOrigin(origin);
  if (allowedOrigins.includes(n)) return true;
  return isDevLocalhostOrigin(n);
}

/**
 * Optional comma-separated list of extra allowed origins (server env, not
 * NEXT_PUBLIC_*), e.g. `https://www.example.com,https://staging.example.com`.
 */
function originsFromCsrfAllowlist(): string[] {
  const raw = process.env.CSRF_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean);
}

/** Strip default ports so `origin:443` matches `host` without port. */
function stripDefaultPort(host: string): string {
  const h = host.toLowerCase();
  if (h.endsWith(":443")) return h.slice(0, -4);
  if (h.endsWith(":80")) return h.slice(0, -3);
  return h;
}

/**
 * Public host this request was made to (custom domain on Vercel, etc.).
 * Prefer x-forwarded-host, then Host, then the URL Next parsed (covers odd proxies).
 */
function getIncomingRequestHost(request: NextRequest): string | null {
  const xf = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hdr = request.headers.get("host")?.trim();
  const fromUrl = request.nextUrl.host;
  const raw = (xf || hdr || fromUrl || "").trim();
  if (!raw) return null;
  return stripDefaultPort(raw);
}

/**
 * Same-site browser POST: Origin host matches the request Host / forwarded host.
 * Fixes www vs apex, preview URLs, and :443 vs bare host mismatches.
 */
function isSameSiteOrigin(origin: string, request: NextRequest): boolean {
  try {
    const o = new URL(origin);
    const originHost = stripDefaultPort(o.host.toLowerCase());
    const reqHost = getIncomingRequestHost(request);
    return reqHost !== null && originHost === reqHost;
  } catch {
    return false;
  }
}

/** Treat missing Origin the same as absent (some stacks send the literal "null"). */
function originHeaderIsPresent(origin: string | null): boolean {
  if (origin === null) return false;
  const t = origin.trim();
  return t.length > 0 && t.toLowerCase() !== "null";
}

// API routes that mutate state — these get CSRF + content-type checks
const PROTECTED_API_ROUTES = [
  "/api/send-quote",
  "/api/generate-pdf",
  "/api/generate-docx",
  "/api/contact-sales",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { method } = request; // method lives on request, not nextUrl

  // ── Only intercept POST requests to our protected API routes ────────────
  const isProtectedRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtectedRoute || method !== "POST") {
    return NextResponse.next();
  }

  // ── 1. Content-Type check ────────────────────────────────────────────────
  // All our API routes expect JSON. Reject anything else early.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new NextResponse(
      JSON.stringify({ error: "Unsupported Media Type" }),
      {
        status: 415,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // ── 2. Origin / Referer CSRF check ──────────────────────────────────────
  // Browsers always send Origin on cross-origin POST requests.
  // Same-origin requests from our own frontend send Origin matching our domain.
  // Requests with no Origin at all AND no Referer are suspicious (curl/scripts
  // would typically not send either), but we allow them with an env flag so
  // server-to-server tools (Postman in dev, health checks) still work.
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowedOrigins = getAllowedOrigins();

  // If Origin is present and parseable, it must match allowlist or same-site host
  if (originHeaderIsPresent(origin)) {
    const normalizedOrigin = origin!.replace(/\/$/, "");
    const ok =
      isOriginAllowed(normalizedOrigin, allowedOrigins) ||
      isSameSiteOrigin(origin!, request);
    if (!ok) {
      const reqHost = getIncomingRequestHost(request);
      console.warn(
        `[middleware] CSRF: blocked origin "${origin}" → ${pathname} (request host: ${reqHost ?? "?"}; nextUrl: ${request.nextUrl.host}; allowlist: ${allowedOrigins.join(" | ") || "(empty)"})`,
      );
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (referer !== null) {
    // No Origin but Referer present — validate the Referer host
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      const okRef =
        isOriginAllowed(refererOrigin, allowedOrigins) ||
        isSameSiteOrigin(refererOrigin, request);
      if (!okRef) {
        console.warn(
          `[middleware] CSRF: blocked referer "${referer}" → ${pathname}`,
        );
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // Malformed Referer — reject
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  // If neither Origin nor Referer is present, we allow it.
  // This covers server-side calls and tools like Postman in development.
  // In production you can harden this to reject headerless requests:
  //
  // else if (process.env.NODE_ENV === "production") {
  //   return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
  //     status: 403,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }

  // Optional: block empty User-Agent (can false-positive privacy tools / WebViews).
  // Set REQUIRE_USER_AGENT=1 on Vercel to enable; off by default.
  if (process.env.REQUIRE_USER_AGENT === "1") {
    const userAgent = request.headers.get("user-agent");
    if (!userAgent?.trim()) {
      console.warn(`[middleware] Blocked headless request → ${pathname}`);
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}

// ── Route matcher — only run middleware on API routes ────────────────────────
export const config = {
  matcher: ["/api/:path*"],
};
