<script lang="ts">
  import { env } from "$env/dynamic/public";

  let { onToken }: { onToken?: (token: string | null) => void } = $props();

  const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY;

  const SCRIPT_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  let container = $state<HTMLDivElement | null>(null);
  let started = false;

  /**
   * Loads the Turnstile script and renders the widget.
   *
   * Deliberately *not* called on mount. Turnstile is the only third-party
   * script on the site, and the contact form sits at the very bottom of a long
   * single page — pulling it in on load would put a cross-origin request on the
   * critical path of every visitor, the overwhelming majority of whom never
   * reach the form. `start()` is called on first interaction with the form
   * instead, which is many seconds of human time before a token is needed.
   */
  export function start() {
    if (started || !siteKey || typeof document === "undefined") return;
    started = true;

    const render = () => {
      const turnstile = (
        window as unknown as {
          turnstile?: {
            render: (el: HTMLElement, opts: Record<string, unknown>) => void;
          };
        }
      ).turnstile;
      if (!turnstile || !container) return;
      turnstile.render(container, {
        sitekey: siteKey,
        // Only surfaces a visible challenge when Cloudflare actually wants one;
        // a legitimate visitor normally sees nothing at all.
        appearance: "interaction-only",
        size: "flexible",
        callback: (token: string) => onToken?.(token),
        "expired-callback": () => onToken?.(null),
        "error-callback": () => onToken?.(null),
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }
</script>

{#if siteKey}
  <div bind:this={container} class="mt-3 flex justify-center"></div>
{/if}
