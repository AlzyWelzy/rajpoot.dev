// Every page is content that never varies per request, so the whole site is
// prerendered to static HTML at build time and served straight off Cloudflare's
// edge. /api/contact opts out individually.
export const prerender = true;

// SSR on, CSR off: SvelteKit renders the complete document at build time and
// then ships **no JavaScript at all** — no framework runtime, no client
// router, no hydration of prose that will never change.
//
// That router was the specific thing this buys back. It is ~12KB brotli of
// navigation, preloading and scroll-restoration machinery, and this is a
// single page whose every link is a hash anchor or an external URL: none of it
// could ever run. Hydration cost another ~19KB of Svelte runtime to re-derive
// markup identical to what was already served.
//
// The site's interactivity instead lives in src/lib/enhance/ — one ~2KB
// progressive-enhancement bundle that finds its own markup by data attribute.
// The rule that falls out of this, and the one to remember when editing
// components: **markup must be complete and usable in the server-rendered
// HTML.** Nothing in that bundle renders UI.
export const ssr = true;
export const csr = false;
