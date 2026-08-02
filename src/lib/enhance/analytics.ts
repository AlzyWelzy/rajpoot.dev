/**
 * Custom event tracking.
 *
 * This was `track()` from `@vercel/analytics`. Cloudflare Web Analytics — the
 * like-for-like replacement for the pageview half — is **pageview only**; it
 * has no custom-event API, so the five events this site records have no direct
 * platform equivalent.
 *
 * Rather than silently drop the call sites, they keep calling `track()` and
 * this posts to the endpoint baked in at build time. With none configured every
 * call is a no-op, which is the current deployed state. See AGENTS.md.
 */

// Injected by esbuild's `define` in scripts/gen-enhance.mjs. This bundle is
// built outside SvelteKit, so `$env/static/public` isn't available to it —
// baking the value in at build time keeps the call sites clean and lets dead
// code elimination drop this module's body entirely when it's empty.
declare const __ANALYTICS_ENDPOINT__: string;

/**
 * Still a compile-time constant, so esbuild folds the `!url` branch below and
 * drops the whole body when nothing is configured — which is the current
 * deployed state, and why this module costs ~0 bytes today.
 */
const ENDPOINT = __ANALYTICS_ENDPOINT__;

export type EventProps = Record<string, string | number | boolean>;

/**
 * `endpoint` is a parameter purely so the configured path is reachable from a
 * test: a `define` is substituted textually at build time, so there is no
 * binding a test could stub. Callers never pass it.
 */
export function track(
  event: string,
  props: EventProps = {},
  endpoint: string = ENDPOINT,
): void {
  const url = endpoint;
  if (!url) return;

  const body = JSON.stringify({ event, props, path: location.pathname });

  try {
    // `sendBeacon` survives the page teardown that follows a CTA click or an
    // outbound social link — a plain fetch on those paths is routinely
    // cancelled before it leaves.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
      return;
    }
    void fetch(url, { method: "POST", body, keepalive: true });
  } catch {
    /* Analytics must never break the interaction it is measuring. */
  }
}

/** Wires the declarative `data-track` / `data-track-props` attributes. */
export function initTracking() {
  for (const node of document.querySelectorAll<HTMLElement>("[data-track]")) {
    node.addEventListener("click", () => {
      let props: EventProps = {};
      const raw = node.dataset.trackProps;
      if (raw) {
        try {
          props = JSON.parse(raw) as EventProps;
        } catch {
          /* A malformed attribute must not break the link it is on. */
        }
      }
      track(node.dataset.track!, props);
    });
  }
}
