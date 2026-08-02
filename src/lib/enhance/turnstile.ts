const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};

/**
 * Cloudflare Turnstile, loaded lazily.
 *
 * The container is server-rendered only when a site key was configured at build
 * time, so with no key there is nothing to find here and every method is inert
 * — which is what lets local development and the E2E suite run without a live
 * Cloudflare account.
 */
export function initTurnstile() {
  const container = document.querySelector<HTMLElement>("[data-turnstile]");
  const siteKey = container?.dataset.turnstile;

  let token: string | null = null;
  let widgetId: string | undefined;
  let started = false;

  const api = () => (window as { turnstile?: TurnstileApi }).turnstile;

  function render() {
    const turnstile = api();
    if (!turnstile || !container || !siteKey) return;
    widgetId = turnstile.render(container, {
      sitekey: siteKey,
      // Only surfaces a visible challenge when Cloudflare actually wants one;
      // a legitimate visitor normally sees nothing at all.
      appearance: "interaction-only",
      size: "flexible",
      callback: (value: string) => {
        token = value;
      },
      "expired-callback": () => {
        token = null;
      },
      "error-callback": () => {
        token = null;
      },
    });
  }

  return {
    start() {
      if (started || !siteKey) return;
      started = true;

      if (api()) {
        render();
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.append(script);
    },

    token: () => token,

    /** After a successful send, so a second message gets a fresh token. */
    reset() {
      token = null;
      if (widgetId !== undefined) api()?.reset(widgetId);
    },
  };
}
