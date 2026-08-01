/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Deliberately empty: resend / react-email must be BUNDLED, not external.
  //
  // They used to be listed here because Turbopack couldn't resolve html-to-text's
  // ESM sub-deps (leac, peberminta) when bundling. Next 16.2 resolves them fine,
  // and keeping the entries actively broke `next start`: Next copies each
  // external into .next/node_modules/<name>-<hash>/ WITHOUT its transitive deps,
  // so at runtime the copy resolves its own imports by walking up to the
  // project's node_modules — which under pnpm's strict linker does not contain
  // them. The contact server action then died at module load with
  // ERR_MODULE_NOT_FOUND (postal-mime via resend, prismjs via react-email),
  // returning an opaque 500 for every submission.
  //
  // Bundling also means react-email's dev-only surface (the CLI, socket.io,
  // chokidar, the prismjs code-block) is tree-shaken out instead of being copied
  // and loaded. Do not re-add entries here without checking that every package
  // they reach at runtime resolves from the project root.
  serverExternalPackages: [],
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
      // The blog lives on its own subdomain; send /blog and any sub-path there.
      {
        source: "/blog",
        destination: "https://blog.rajpoot.dev",
        permanent: true,
      },
      {
        source: "/blog/:path*",
        destination: "https://blog.rajpoot.dev/:path*",
        permanent: true,
      },
      {
        source: "/linkedin",
        destination: "https://linkedin.com/in/AlzyWelzy",
        permanent: true,
      },
      {
        source: "/github",
        destination: "https://github.com/AlzyWelzy",
        permanent: true,
      },
      {
        source: "/twitter",
        destination: "https://x.com/AlzyWelzy",
        permanent: true,
      },
      {
        source: "/instagram",
        destination: "https://www.instagram.com/alzywelzyy/",
        permanent: true,
      },
      {
        source: "/facebook",
        destination: "https://www.facebook.com/AlzyWelzyy",
        permanent: true,
      },
      {
        source: "/esyconnect",
        destination: "https://esyconnect.com/candidate/alzywelzy/",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Static CSP (no nonce, so the app stays fully prerendered).
    //
    // script-src keeps 'unsafe-inline' on purpose. Next injects inline
    // hydration/flight scripts whose contents change every build, so removing
    // it needs either per-request nonces — which force dynamic rendering and
    // give up the fully-prerendered output this site's performance budget
    // depends on — or a two-pass build that hashes the emitted HTML after
    // `headers()` has already been evaluated. Neither trade is worth it here,
    // so the protection comes from restricting *sources* instead: no external
    // script origin beyond Vercel Analytics, and everything not actively used
    // pinned to 'none' rather than inheriting default-src.
    //
    // style-src needs 'unsafe-inline' for motion's inline style attributes.
    const csp = ({ upgradeInsecure }) =>
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        // Nothing on this site is meant to be framed, anywhere.
        "frame-ancestors 'none'",
        "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
        "manifest-src 'self'",
        // Unused sinks, explicitly closed: an injected payload can't reach for
        // a plugin, iframe, worker, or media element at all.
        "object-src 'none'",
        "frame-src 'none'",
        "child-src 'none'",
        "worker-src 'none'",
        "media-src 'none'",
        // WebKit (unlike Chromium) applies the upgrade to localhost too,
        // turning every asset request into https://localhost and breaking the
        // page under Playwright's plain-http server — so it is dropped for
        // localhost only, by host match rather than by build flag. That keeps
        // one build valid for E2E, Lighthouse and production alike.
        ...(upgradeInsecure ? ["upgrade-insecure-requests"] : []),
      ].join("; ");

    // CSP only in production. Next's dev server + React dev mode require
    // eval() (HMR, callstack reconstruction) which this policy intentionally
    // forbids; `next start` and Vercel run production React, which never evals.
    const isProd = process.env.NODE_ENV === "production";

    const securityHeaders = ({ upgradeInsecure }) => [
      ...(isProd
        ? [{ key: "Content-Security-Policy", value: csp({ upgradeInsecure }) }]
        : []),
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Matches frame-ancestors 'none' for pre-CSP3 user agents.
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
      },
      // Origin isolation, defense-in-depth alongside the CSP: no cross-origin
      // window handles to this page, and its resources can't be embedded
      // cross-origin (nothing here is meant for third-party embedding).
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ];

    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "localhost" }],
        headers: securityHeaders({ upgradeInsecure: false }),
      },
      {
        source: "/:path*",
        missing: [{ type: "host", value: "localhost" }],
        headers: securityHeaders({ upgradeInsecure: true }),
      },
    ];
  },
};

export default nextConfig;
