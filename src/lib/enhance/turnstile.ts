const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  getResponse: (id?: string) => string | undefined;
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
      // "always", not "interaction-only": the widget is the only visible
      // evidence that bot protection is wired up at all, and an invisible
      // control is impossible to verify — for a visitor mid-submission or for
      // whoever is checking the deploy. Managed mode still resolves silently
      // for a legitimate visitor; they just see it resolve.
      appearance: "always",
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

    /**
     * The current token, or null.
     *
     * `getResponse()` is asked first and the callback-captured value is only a
     * fallback. The callback fires once, at the moment a challenge resolves;
     * anything that happens afterwards — a silent refresh, a re-render, a token
     * that resolved before this module attached its handler — is invisible to
     * it. `getResponse()` always reflects the widget's actual current state.
     *
     * Turnstile also writes its own `cf-turnstile-response` hidden input into
     * the container, which sits inside the form, so `new FormData(form)` picks
     * the token up even if both of these return null.
     */
    token: () => {
      if (widgetId !== undefined) {
        try {
          const current = api()?.getResponse(widgetId);
          if (current) return current;
        } catch {
          /* Widget not ready; fall through to the captured value. */
        }
      }
      return token;
    },

    /** After a successful send, so a second message gets a fresh token. */
    reset() {
      token = null;
      if (widgetId !== undefined) api()?.reset(widgetId);
    },
  };
}
