/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Keep these server-only packages external instead of bundling them. resend
  // pulls in @react-email/render -> html-to-text, whose ESM sub-deps (leac,
  // peberminta) Turbopack fails to resolve when bundled, breaking the build.
  serverExternalPackages: ["resend", "@react-email/render", "html-to-text"],
  // Tree-shake large barrel packages so only the icons/animations actually
  // used ship to the client, shrinking the JS bundle.
  experimental: {
    optimizePackageImports: ["react-icons", "motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/linkedin", destination: "https://linkedin.com/in/AlzyWelzy", permanent: true },
      { source: "/github", destination: "https://github.com/AlzyWelzy", permanent: true },
      { source: "/twitter", destination: "https://x.com/AlzyWelzy", permanent: true },
      { source: "/instagram", destination: "https://www.instagram.com/alzywelzyy/", permanent: true },
      { source: "/facebook", destination: "https://www.facebook.com/AlzyWelzyy", permanent: true },
      { source: "/esyconnect", destination: "https://esyconnect.com/candidate/alzywelzy/", permanent: true },
    ];
  },
  async headers() {
    // Static CSP (no nonce, so the app stays fully prerendered). 'unsafe-inline'
    // is required because Next injects inline hydration/theme scripts and motion
    // sets inline styles; the value still comes from restricting *sources*
    // (no external scripts beyond self + Vercel Analytics) plus object/base/frame
    // hardening. The Vercel hosts cover Analytics + Speed Insights.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "frame-src 'self'",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    // CSP only in production. Next's dev server + React dev mode require
    // eval() (HMR, callstack reconstruction) which this policy intentionally
    // forbids; `next start` and Vercel run production React, which never evals.
    const isProd = process.env.NODE_ENV === "production";

    const securityHeaders = [
      ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
