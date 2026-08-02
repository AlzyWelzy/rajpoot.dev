import { browser } from "$app/environment";

/**
 * Custom event tracking.
 *
 * This used to be `track()` from `@vercel/analytics`. Cloudflare Web Analytics
 * — the like-for-like replacement for the pageview half — is **pageview only**;
 * it has no custom-event API, so the five events this site records (CTA click,
 * CV download, social click, project click, contact submit) have no direct
 * equivalent on the platform.
 *
 * Rather than silently drop the call sites, they keep calling `track()` and
 * this posts to `PUBLIC_ANALYTICS_ENDPOINT` when one is configured. Leave it
 * unset and every call is a no-op — which is the current deployed state.
 *
 * To restore the events, point the env var at any collector that accepts a
 * JSON POST (a Worker writing to Analytics Engine is the cheap native option).
 */
const endpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT as
  string | undefined;

export type EventProps = Record<string, string | number | boolean>;

export function track(event: string, props: EventProps = {}): void {
  if (!browser || !endpoint) return;

  const body = JSON.stringify({ event, props, path: location.pathname });

  try {
    // `sendBeacon` survives the page teardown that follows a CTA click or an
    // outbound social link — a plain fetch on those paths is routinely
    // cancelled before it leaves.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
      return;
    }
    void fetch(endpoint, { method: "POST", body, keepalive: true });
  } catch {
    /* Analytics must never break the interaction it is measuring. */
  }
}
