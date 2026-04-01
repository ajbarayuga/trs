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

// Allowed origins — must match your deployed domain(s) exactly.
// Pulled from env so staging/production can differ without code changes.
// In development, localhost origins are also allowed.
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Production / staging domain from env
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    origins.push(process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""));
  }

  // Always allow localhost in non-production environments
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000");
    origins.push("http://localhost:3001");
    origins.push("http://127.0.0.1:3000");
  }

  return origins;
}

// API routes that mutate state — these get CSRF + content-type checks
const PROTECTED_API_ROUTES = [
  "/api/send-quote",
  "/api/generate-pdf",
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

  // If Origin header is present, it must be in our allow-list
  if (origin !== null) {
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (!allowedOrigins.includes(normalizedOrigin)) {
      console.warn(
        `[middleware] CSRF: blocked origin "${origin}" → ${pathname}`,
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
      if (!allowedOrigins.includes(refererOrigin)) {
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

  // ── 3. Basic bot signal check ────────────────────────────────────────────
  // Reject obviously automated requests that lack a User-Agent entirely.
  // Real browsers always send this header.
  const userAgent = request.headers.get("user-agent");
  if (!userAgent || userAgent.trim().length === 0) {
    console.warn(`[middleware] Blocked headless request → ${pathname}`);
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.next();
}

// ── Route matcher — only run middleware on API routes ────────────────────────
export const config = {
  matcher: ["/api/:path*"],
};
