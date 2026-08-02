// Every page is content that never varies per request, so the whole site is
// prerendered to static HTML at build time and served straight off Cloudflare's
// edge. /api/contact opts out individually.
export const prerender = true;

// No client-side router work to do on a single-page site, but keeping SSR
// semantics on means the prerendered HTML is the complete document.
export const ssr = true;
