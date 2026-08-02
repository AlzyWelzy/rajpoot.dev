/**
 * The site's security header set, in one place.
 *
 * Plain JS (JSDoc-typed, `checkJs` is on) rather than TypeScript on purpose:
 * `scripts/gen-headers.mjs` imports this at build time to emit `static/_headers`,
 * and a build script cannot import a `.ts` module without a compile step. One
 * module, two emitters, no chance of the two drifting.
 *
 * Why two emitters at all — Cloudflare serves this site from two places:
 *
 *   • the **asset server**, which answers the prerendered HTML, the static
 *     files and the shortlink redirects straight from edge cache without ever
 *     waking the Worker. That is the whole TTFB win of the move, so it must not
 *     be given up; those responses get their headers from `_headers`.
 *
 *   • the **Worker**, which answers /api/contact and the three PDF routes.
 *     Those get their headers from `hooks.server.ts`.
 *
 * On Vercel this lived in `next.config.mjs`'s `headers()`, which Next did not
 * apply to redirect responses — so the vanity shortlinks and the apex → www hop
 * answered without it, and the bare `Strict-Transport-Security` on that hop is
 * why the domain could not be submitted to hstspreload.org. `_headers` covers
 * redirect responses, so that blocker is gone.
 */

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
const CF_INSIGHTS_ORIGIN = "https://static.cloudflareinsights.com";

/**
 * @param {{ upgradeInsecure: boolean }} options
 * @returns {string}
 */
export function contentSecurityPolicy({ upgradeInsecure }) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // Nothing on this site is meant to be framed, anywhere.
    "frame-ancestors 'none'",
    //
    // script-src keeps 'unsafe-inline' on purpose.
    //
    // Two inline scripts exist: the pre-paint theme setter in app.html, and
    // SvelteKit's hydration bootstrap, whose contents change every build.
    // Removing 'unsafe-inline' therefore needs either per-request nonces —
    // which force dynamic rendering and give up the fully-prerendered output
    // this site's performance budget depends on — or a build that hashes the
    // emitted HTML after the headers have already been decided.
    //
    // The protection comes from restricting *sources* instead: only Turnstile
    // and Cloudflare's own beacon may load script at all, and every sink the
    // site does not use is pinned to 'none' rather than inheriting default-src.
    `script-src 'self' 'unsafe-inline' ${TURNSTILE_ORIGIN} ${CF_INSIGHTS_ORIGIN}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ${CF_INSIGHTS_ORIGIN}`,
    "manifest-src 'self'",
    // Turnstile renders its challenge in an iframe on its own origin. This was
    // `frame-src 'none'` when the contact form relied on an Upstash IP rate
    // limit; it is the one directive Turnstile costs, and it is scoped to
    // exactly that origin rather than reopened.
    `frame-src ${TURNSTILE_ORIGIN}`,
    `child-src ${TURNSTILE_ORIGIN}`,
    // Unused sinks, explicitly closed: an injected payload can't reach for a
    // plugin, worker, or media element at all.
    "object-src 'none'",
    "worker-src 'none'",
    "media-src 'none'",
    //
    // `upgrade-insecure-requests` is omitted for localhost.
    //
    // WebKit (unlike Chromium) applies the upgrade to localhost too, turning
    // every asset request into https://localhost and breaking the page under
    // Playwright's plain-http server. hooks.server.ts decides this per request
    // by host; `_headers` is static, so gen-headers.mjs decides it once, from
    // whether the build is an E2E build.
    ...(upgradeInsecure ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/**
 * @param {{ upgradeInsecure: boolean }} options
 * @returns {Record<string, string>}
 */
export function securityHeaders({ upgradeInsecure }) {
  return {
    "Content-Security-Policy": contentSecurityPolicy({ upgradeInsecure }),
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    // Matches frame-ancestors 'none' for pre-CSP3 user agents.
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    // Origin isolation, defense-in-depth alongside the CSP: no cross-origin
    // window handles to this page, and its resources can't be embedded
    // cross-origin (nothing here is meant for third-party embedding).
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

/**
 * True for the hosts where `upgrade-insecure-requests` must be suppressed.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Renders the set as a Cloudflare `_headers` rule block covering every path.
 *
 * The PDF rule is not decoration. The documents live in static/, so they are
 * reachable at their raw filenames as well as through the /resume route — a
 * path that bypasses the route handler completely, and with it the
 * `X-Robots-Tag` it sets. Without this the standalone PDFs can be indexed and
 * compete with the homepage. Deliberately a header and not a robots.txt
 * `Disallow`: a blocked URL is never fetched, so the crawler never sees the
 * noindex and can still list it.
 *
 * @param {{ upgradeInsecure: boolean }} options
 * @returns {string}
 */
export function renderHeadersFile({ upgradeInsecure }) {
  const rules = Object.entries(securityHeaders({ upgradeInsecure }))
    .map(([key, value]) => `  ${key}: ${value}`)
    .join("\n");

  return `# Generated by scripts/gen-headers.mjs — do not edit by hand.
# Source of truth: src/lib/security-headers.js
#
# Applies to everything the Cloudflare asset server answers directly: the
# prerendered HTML, the static files, and the shortlink redirects. Worker
# responses (/api/contact, the PDF routes) get the same set from
# hooks.server.ts.

/*
${rules}

/*.pdf
  X-Robots-Tag: noindex
`;
}
