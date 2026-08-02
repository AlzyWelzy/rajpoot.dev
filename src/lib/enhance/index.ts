/**
 * The site's entire client-side runtime.
 *
 * Every page is prerendered and `csr` is off, so SvelteKit ships no JavaScript
 * at all — no framework runtime, no client router, no hydration of prose that
 * will never change. This module is the only script the browser executes, and
 * it is pure progressive enhancement: each behaviour finds its own markup by
 * data attribute and does nothing if that markup isn't there.
 *
 * The consequence to keep in mind when editing components: **markup must be
 * complete and usable in the server-rendered HTML**. Nothing here renders UI.
 * The scroll-to-top button ships `hidden`, the toast region ships empty, the
 * contact form ships with a real `action` and `method`. If this file fails to
 * load, the site is a working static page rather than a broken one.
 *
 * Built by scripts/gen-enhance.mjs (esbuild) rather than by Vite, because
 * SvelteKit owns the Vite client build and there isn't one to attach to here.
 */
import { initTracking } from "./analytics";
import { initContact } from "./contact";
import { initNav } from "./nav";
import { initReveal, initScrollToTop } from "./reveal";
import { initTheme } from "./theme";

function start() {
  // Each is independent; one throwing must not take the rest down with it.
  for (const init of [
    initTheme,
    initNav,
    initReveal,
    initScrollToTop,
    initTracking,
    initContact,
  ]) {
    try {
      init();
    } catch (error) {
      console.error(`[enhance] ${init.name} failed`, error);
    }
  }
}

// The script is `type="module"`, so it is deferred and the DOM is parsed by the
// time it runs. The readyState check is belt-and-braces for a future move to a
// non-deferred tag.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
