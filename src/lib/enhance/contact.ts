import { track } from "./analytics";
import { toast } from "./toast";
import { initTurnstile } from "./turnstile";

type SendEmailResult = { error?: string; data?: unknown };

const GENERIC_FAILURE = "Couldn't send your message. Please try again later.";

/**
 * The contact form.
 *
 * The form is server-rendered and has a real `action`/`method`, so it is a
 * working form before this runs; this upgrades it to a fetch so the page
 * doesn't navigate, and adds the toast, the inline error and the pending
 * state.
 */
export function initContact() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const errorBox = form.querySelector<HTMLElement>("[data-contact-error]");
  const message = form.querySelector<HTMLTextAreaElement>("#message");
  const email = form.querySelector<HTMLInputElement>("#senderEmail");
  const submitLabel = submit?.querySelector<HTMLElement>("[data-submit-label]");
  const spinner = submit?.querySelector<HTMLElement>("[data-submit-spinner]");
  const planeIcon = submit?.querySelector<HTMLElement>("[data-submit-icon]");

  const challenge = initTurnstile();

  // Turnstile is the only third-party script on the site and the form sits at
  // the bottom of a long page. Booting it on first interaction rather than on
  // load keeps a cross-origin request off the critical path of every visitor,
  // almost none of whom reach the form.
  form.addEventListener("focusin", () => challenge.start(), { once: true });

  let pending = false;

  function setPending(next: boolean) {
    pending = next;
    if (!submit) return;
    submit.disabled = next;
    submit.setAttribute("aria-busy", String(next));
    submit.setAttribute(
      "aria-label",
      next ? "Sending message…" : "Send message",
    );
    if (submitLabel) submitLabel.textContent = next ? "Sending" : "Send";
    if (spinner) spinner.hidden = !next;
    if (planeIcon) planeIcon.hidden = next;
  }

  function setError(text: string | null) {
    if (errorBox) {
      errorBox.textContent = text ?? "";
      errorBox.hidden = text === null;
    }
    for (const field of [email, message]) {
      if (!field) continue;
      if (text) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", "contact-error");
      } else {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      }
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const body = new FormData(form);
      const token = challenge.token();
      if (token) body.set("cf-turnstile-response", token);

      const response = await fetch(form.action, { method: "POST", body });
      const result = (await response.json()) as SendEmailResult;

      if (result.error) {
        setError(result.error);
        toast("error", result.error);
        return;
      }

      toast("success", "Email sent successfully!");
      track("contact_submit");
      // Cleared only on success, so a failed submit keeps what was typed.
      form.reset();
      challenge.reset();
    } catch {
      setError(GENERIC_FAILURE);
      toast("error", GENERIC_FAILURE);
    } finally {
      setPending(false);
    }
  });

  message?.addEventListener("keydown", (event) => {
    // Cmd/Ctrl+Enter submits; plain Enter stays a newline.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      // requestSubmit runs constraint validation and fires `submit`, which
      // form.submit() would skip.
      form.requestSubmit();
    }
  });
}
