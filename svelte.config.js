import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      // `wrangler dev` needs the real bindings (and .dev.vars) so the contact
      // endpoint behaves in development exactly as it does deployed.
      platformProxy: { persist: true },
    }),

    // Every page on this site is content that never varies per request, so the
    // whole thing is prerendered to static HTML at build time and served from
    // Cloudflare's edge. The one exception is /api/contact, which opts out via
    // `export const prerender = false`.
    prerender: {
      handleHttpError: "fail",
      handleMissingId: "fail",
    },

    // The vanity shortlinks (/github, /linkedin, …) are answered by
    // hooks.server.ts, not by routes, so the crawler must not be asked to
    // resolve them — it would see a redirect off-site and fail the build.
    // Everything else is reachable from `/`.
    alias: {
      "@/*": "./src/*",
    },

    // Inline the stylesheet into the HTML instead of linking it.
    //
    // The CSS would otherwise ship as a render-blocking <link>, so a first-time
    // visitor could not paint until a second round trip completed. Next's
    // `experimental.inlineCss` was doing this, measured there in Chromium at
    // 200ms RTT / 1.6Mbps over 7 cold loads: FCP 724ms blocking vs 436ms
    // inlined (-288ms), for +8.7KB brotli on the document.
    //
    // The cost is repeat visits: the linked file was immutable and cached for a
    // year, whereas inlined CSS is re-sent with every HTML response. This is a
    // portfolio whose traffic is overwhelmingly first-time (recruiters
    // following a CV link), so that is the right side of the trade. The
    // threshold is sized just above the current ~50KB bundle; if the CSS grows
    // past it the link comes back silently, so re-measure rather than just
    // raising the number.
    inlineStyleThreshold: 60_000,

    // CSP is set as a real response header in hooks.server.ts rather than
    // through kit.csp: kit's implementation injects per-render nonces/hashes,
    // and this site's entire performance argument rests on the HTML being
    // prerendered once and served from cache.
    csp: undefined,
  },
};

export default config;
