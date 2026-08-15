import { toast } from "@/lib/stores/toast";
import { TURNSTILE_SITE_KEY } from "@/lib/data";

// Posted to directly rather than through `astro:actions`' client helper.
// That helper bundles `devalue` to decode the success payload — which this
// form never reads, since it only branches on whether an error came back.
// Importing it cost 5.1 KB gzip (69% of the site's total JS) to deserialize
// a value we discard. Errors come back as plain JSON, so a bare fetch is
// enough. The endpoint is Astro's documented progressive-enhancement URL
// for an action (the same one `action={actions.submitContact}` emits).
// e2e/contact.spec.ts covers success, validation-error and honeypot paths,
// so a change to this contract fails CI rather than silently breaking.
const ACTION_URL = "/_actions/submitContact";
const FALLBACK_ERROR = "Couldn't send your message. Please try again later.";

declare global {
  interface Window {
    // Only the one call this component needs; the full Turnstile API
    // surface is much larger.
    turnstile?: { reset: (widgetIdOrContainer?: string) => void };
  }
}

const form = document.getElementById("contact-form") as HTMLFormElement | null;

if (form) {
  // Turnstile is third-party and by far the most expensive thing this page
  // loads: fetching it eagerly cost ~1.1s of the window `load` event for a
  // widget most visitors never reach. It is deferred until the form is
  // within ~800px of the viewport, which on a page this length still gives
  // it several seconds of scrolling and typing to produce a token before
  // anyone can submit.
  let turnstileRequested = false;
  function loadTurnstile() {
    if (turnstileRequested) return;
    turnstileRequested = true;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  if (TURNSTILE_SITE_KEY) {
    if (typeof IntersectionObserver === "undefined") {
      loadTurnstile();
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          loadTurnstile();
        },
        { rootMargin: "800px" },
      );
      observer.observe(form);
    }
    // Belt and braces: anyone who reaches a field — deep link, tab
    // navigation, autofill — starts the load even if the observer hasn't.
    form.addEventListener("focusin", loadTurnstile, { once: true });
  }

  const email = form.querySelector<HTMLInputElement>("#senderEmail")!;
  const message = form.querySelector<HTMLTextAreaElement>("#message")!;
  const button = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  )!;
  const idle = form.querySelector<HTMLElement>("[data-submit-idle]")!;
  const busy = form.querySelector<HTMLElement>("[data-submit-pending]")!;
  const errorEl = form.querySelector<HTMLElement>("#contact-error")!;

  function setPending(pending: boolean) {
    button.disabled = pending;
    button.setAttribute("aria-busy", String(pending));
    button.setAttribute(
      "aria-label",
      pending ? "Sending message…" : "Send message",
    );
    idle.hidden = pending;
    busy.hidden = !pending;
  }

  function setError(text: string | null) {
    if (text) {
      errorEl.textContent = text;
      errorEl.hidden = false;
      for (const field of [email, message]) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", "contact-error");
      }
    } else {
      errorEl.textContent = "";
      errorEl.hidden = true;
      for (const field of [email, message]) {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      }
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    // Any non-2xx is a failure; the success body is deliberately not read.
    // Defensive parse: if the error shape ever changes, show the fallback
    // rather than throwing inside the submit handler.
    let errorMessage: string | null = null;
    try {
      const response = await fetch(ACTION_URL, {
        method: "POST",
        body: new FormData(form),
      });
      if (!response.ok) {
        errorMessage = FALLBACK_ERROR;
        try {
          const body = (await response.json()) as { message?: unknown };
          if (typeof body.message === "string" && body.message) {
            errorMessage = body.message;
          }
        } catch {
          /* keep the fallback */
        }
      }
    } catch {
      // Network failure / offline.
      errorMessage = FALLBACK_ERROR;
    }

    // Turnstile tokens are single-use — reset so the next attempt (retry
    // after an error, or another message later) gets a fresh one. The
    // section stays mounted after both outcomes, unlike a page navigation
    // that would render a new widget for free.
    window.turnstile?.reset();
    setPending(false);

    if (errorMessage) {
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    toast.success("Email sent successfully!");
    // Controlled-input parity: clear only on success, so a failed submit
    // keeps what the user typed.
    form.reset();
  });

  // Cmd/Ctrl+Enter submits; plain Enter stays a newline.
  message.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      button.click();
    }
  });
}
