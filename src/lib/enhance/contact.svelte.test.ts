import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initContact } from "./contact";
import { track } from "./analytics";
import { initTurnstile } from "./turnstile";

/**
 * The contact form's client half. The form is server-rendered and works
 * without any of this — these tests describe the upgrade: no page navigation,
 * a toast, an inline error, and a pending state.
 */

const FORM = `
  <div data-toaster></div>
  <form data-contact-form method="post" action="/api/contact">
    <input type="text" name="contact_reason_hp" />
    <input id="senderEmail" name="senderEmail" type="email" required />
    <textarea id="message" name="message" required></textarea>
    <button type="submit" aria-label="Send message" aria-busy="false">
      <span data-submit-spinner hidden></span>
      <span data-submit-label>Send</span>
      <span data-submit-icon></span>
    </button>
    <p id="contact-error" data-contact-error hidden></p>
  </form>`;

function fill(email = "visitor@example.com", message = "Hello there") {
  document.querySelector<HTMLInputElement>("#senderEmail")!.value = email;
  document.querySelector<HTMLTextAreaElement>("#message")!.value = message;
}

function submit() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]")!;
  // dispatch rather than requestSubmit: jsdom's requestSubmit enforces
  // constraint validation, and these tests are about the handler, not the
  // browser's native validation (which e2e covers against a real engine).
  form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function mockFetch(body: unknown, ok = true) {
  return vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) })),
  );
}

beforeEach(() => {
  document.body.innerHTML = FORM;
  // The Turnstile loader appends to <head>, which resetting <body> misses —
  // without this a script from an earlier test leaks into the next one.
  for (const script of document.head.querySelectorAll("script"))
    script.remove();
  mockFetch({ data: { id: "sent" } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("contact form", () => {
  it("posts to the form's own action instead of navigating", async () => {
    initContact();
    fill();
    submit();
    await flush();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    // form.action resolves against the document, so this is absolute.
    expect(new URL(call[0] as string).pathname).toBe("/api/contact");
    expect((call[1] as RequestInit).method).toBe("POST");
  });

  it("sends the fields as FormData", async () => {
    initContact();
    fill("a@b.co", "hi there");
    submit();
    await flush();

    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0]![1] as RequestInit;
    const body = init.body as FormData;
    expect(body.get("senderEmail")).toBe("a@b.co");
    expect(body.get("message")).toBe("hi there");
  });

  it("cancels the native submit so the page doesn't navigate", () => {
    initContact();
    fill();
    const form = document.querySelector<HTMLFormElement>(
      "[data-contact-form]",
    )!;
    const event = new Event("submit", { cancelable: true, bubbles: true });

    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("toasts and clears the form on success", async () => {
    const form = document.querySelector<HTMLFormElement>(
      "[data-contact-form]",
    )!;
    // jsdom does not implement HTMLFormElement.reset(), so the clearing itself
    // is asserted by e2e against a real engine ("submitting a valid message
    // shows success and clears the form"). What matters here is that the
    // success path is the only one that reaches it — see the failure case
    // below, which asserts the input survives.
    const reset = vi.fn();
    form.reset = reset;

    initContact();
    fill();
    submit();
    await flush();

    expect(document.querySelector("[data-toaster]")!.textContent).toContain(
      "Email sent successfully!",
    );
    expect(reset).toHaveBeenCalledOnce();
  });

  it("keeps what was typed when the send fails", async () => {
    // Retyping a long message because the server was briefly unhappy is the
    // fastest way to lose the enquiry.
    mockFetch({ error: "Too many messages." });
    initContact();
    fill("a@b.co", "a long and considered message");
    submit();
    await flush();

    expect(
      document.querySelector<HTMLInputElement>("#senderEmail")!.value,
    ).toBe("a@b.co");
    expect(document.querySelector<HTMLTextAreaElement>("#message")!.value).toBe(
      "a long and considered message",
    );
  });

  it("shows the server's error inline and wires it to the fields", async () => {
    mockFetch({ error: "Invalid sender email" });
    initContact();
    fill();
    submit();
    await flush();

    const error = document.querySelector<HTMLElement>("[data-contact-error]")!;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("Invalid sender email");
    // aria-describedby is what actually reads the message out on the field.
    expect(
      document.querySelector("#senderEmail")!.getAttribute("aria-describedby"),
    ).toBe("contact-error");
    expect(
      document.querySelector("#message")!.getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("clears a previous error on the next attempt", async () => {
    mockFetch({ error: "Invalid sender email" });
    initContact();
    fill();
    submit();
    await flush();

    mockFetch({ data: { id: "sent" } });
    document.querySelector<HTMLFormElement>("[data-contact-form]")!.reset =
      vi.fn();
    fill();
    submit();
    await flush();

    const error = document.querySelector<HTMLElement>("[data-contact-error]")!;
    expect(error.hidden).toBe(true);
    expect(
      document.querySelector("#senderEmail")!.hasAttribute("aria-invalid"),
    ).toBe(false);
  });

  it("falls back to a generic message when the request itself throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    initContact();
    fill();
    submit();
    await flush();

    const error = document.querySelector<HTMLElement>("[data-contact-error]")!;
    expect(error.textContent).toContain("Couldn't send your message");
    // Never the raw network error.
    expect(error.textContent).not.toContain("offline");
  });

  it("shows a pending state and restores it afterwards", async () => {
    let resolve!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((r) => (resolve = r))),
    );
    initContact();
    fill();
    submit();

    const button = document.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Sending message…");
    expect(
      document.querySelector<HTMLElement>("[data-submit-spinner]")!.hidden,
    ).toBe(false);
    expect(
      document.querySelector<HTMLElement>("[data-submit-label]")!.textContent,
    ).toBe("Sending");

    resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    await flush();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(
      document.querySelector<HTMLElement>("[data-submit-label]")!.textContent,
    ).toBe("Send");
  });

  it("ignores a second submit while one is in flight", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    initContact();
    fill();

    submit();
    submit();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("submits on Cmd/Ctrl+Enter from the message field", async () => {
    initContact();
    fill();
    const message = document.querySelector<HTMLTextAreaElement>("#message")!;
    const form = document.querySelector<HTMLFormElement>(
      "[data-contact-form]",
    )!;
    // jsdom does not implement requestSubmit.
    form.requestSubmit = vi.fn(() => submit());

    message.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await flush();

    expect(form.requestSubmit).toHaveBeenCalled();
  });

  it("leaves a plain Enter as a newline", () => {
    initContact();
    const form = document.querySelector<HTMLFormElement>(
      "[data-contact-form]",
    )!;
    form.requestSubmit = vi.fn();

    document
      .querySelector<HTMLTextAreaElement>("#message")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );

    expect(form.requestSubmit).not.toHaveBeenCalled();
  });

  it("does nothing when there is no form on the page", () => {
    document.body.innerHTML = "";
    expect(() => initContact()).not.toThrow();
  });
});

describe("turnstile", () => {
  it("stays inert when no site key was configured at build time", () => {
    // What lets local development and the E2E suite run without a live
    // Cloudflare account.
    document.body.innerHTML = "";
    const challenge = initTurnstile();

    challenge.start();

    expect(challenge.token()).toBeNull();
    expect(document.querySelector('script[src*="challenges"]')).toBeNull();
  });

  it("loads the script only on the first start()", () => {
    document.body.innerHTML = `<div data-turnstile="site-key"></div>`;
    const challenge = initTurnstile();

    challenge.start();
    challenge.start();

    expect(
      document.querySelectorAll('script[src*="challenges.cloudflare.com"]'),
    ).toHaveLength(1);
  });

  it("does not load the script before it is started", () => {
    // The form is at the bottom of a long page; booting Turnstile on load
    // would put a cross-origin request on every visitor's critical path.
    document.body.innerHTML = `<div data-turnstile="site-key"></div>`;
    initTurnstile();

    expect(document.querySelector('script[src*="challenges"]')).toBeNull();
  });
});

describe("analytics", () => {
  it("is a no-op with no endpoint configured", () => {
    // The current deployed state: Cloudflare Web Analytics has no custom-event
    // API, so these calls go nowhere until a collector is pointed at.
    const beacon = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon: beacon });

    track("cta_click", { cta: "get_in_touch" });

    expect(beacon).not.toHaveBeenCalled();
  });
});
