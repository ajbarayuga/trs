import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ─── Security Headers ──────────────────────────────────────────────────────────
//
// CSP is environment-aware:
//   Development — includes 'unsafe-eval' because React's dev tools, Turbopack
//                 HMR, and error overlays all use eval() for source map
//                 reconstruction and hot reloading. Without it the app breaks.
//   Production  — 'unsafe-eval' is removed. React never uses eval() in prod.
//
// ─────────────────────────────────────────────────────────────────────────────

const cspDirectives = [
  "default-src 'self'",

  // 'unsafe-inline' — required for Next.js hydration chunks in App Router.
  // 'unsafe-eval'   — required in development only (React devtools / Turbopack).
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",

  // Tailwind injects inline styles; Google Fonts stylesheet is external.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Local images (/public) + base64 data URIs + blob URLs (PDF preview)
  "img-src 'self' data: blob:",

  // Google Fonts font files
  "font-src 'self' https://fonts.gstatic.com",

  // All fetch() calls go to same-origin /api routes only
  "connect-src 'self'",

  // Belt-and-suspenders alongside X-Frame-Options: DENY
  "frame-ancestors 'none'",

  // No Flash, no plugins
  "object-src 'none'",

  // Prevent <base> tag injection attacks
  "base-uri 'self'",
];

const securityHeaders = [
  // Prevent clickjacking
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Stop MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Only send origin (not full path) as referrer to external sites
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable browser features this app doesn't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Force HTTPS for 1 year — only meaningful in production but harmless in dev
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

const nextConfig: NextConfig = {
  // ── Packages that must not be bundled by webpack ───────────────────────────
  // @react-pdf/renderer uses native Node.js internals and dynamic requires
  // that break when webpack tries to bundle them. Marking it external tells
  // Next.js to load it directly from node_modules at runtime instead.
  serverExternalPackages: ["@react-pdf/renderer"],

  // ── Security headers on all routes ────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // ── next/image remote patterns ─────────────────────────────────────────────
  // Your mic images are in /public — they're local and need no entry here.
  // Add a remotePatterns entry only if you ever load images from an external URL.
  images: {
    remotePatterns: [],
  },

  // ── React Strict Mode ──────────────────────────────────────────────────────
  // Double-invokes effects in dev to surface side-effect bugs early.
  reactStrictMode: true,

  // ── Remove the X-Powered-By: Next.js fingerprinting header ────────────────
  poweredByHeader: false,
};

export default nextConfig;
