import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture what resend.emails.send is called with, and control its outcome.
// `vi.hoisted` makes the mock available to the hoisted vi.mock factory below,
// which runs at module-load (when `new Resend()` constructs in the action).
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

// The email templates are dependency-free string builders, so they are left
// unmocked — the assertions below check the real rendered payload.

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { sendEmail } from "./sendEmail";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** A submission that clears validation and Turnstile, ready to send. */
const validForm = (overrides: Record<string, string> = {}) =>
  form({
    senderName: "Test User",
    senderEmail: "real@example.com",
    message: "hello there",
    "cf-turnstile-response": "test-token",
    ...overrides,
  });

describe("sendEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
    vi.stubEnv("TURNSTILE_SECRET", "test-secret");
    // Default: siteverify passes. "localhost" is always in the expected-
    // hostname set (see actions/sendEmail.ts) regardless of siteConfig.url,
    // so this doesn't depend on whatever the current default site domain is.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            action: "contact",
            hostname: "localhost",
          }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("silently drops honeypot-filled submissions without sending", async () => {
    const result = await sendEmail(
      form({
        senderName: "Test User",
        senderEmail: "real@example.com",
        message: "hello there",
        contact_reason_hp: "i am a bot",
      }),
    );

    expect(result).toEqual({ data: { id: "skipped" } });
    expect(sendMock).not.toHaveBeenCalled();
    // Never spends a siteverify round trip on a known bot.
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a malformed sender email before sending", async () => {
    const result = await sendEmail(
      form({
        senderName: "Test User",
        senderEmail: "not-an-email",
        message: "hello there",
      }),
    );

    expect(result).toEqual({ error: "Invalid sender email" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const result = await sendEmail(
      form({
        senderName: "Test User",
        senderEmail: "real@example.com",
        message: "",
      }),
    );

    expect(result).toEqual({ error: "Invalid message" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends notification and confirmation emails on a valid submission", async () => {
    const result = await sendEmail(validForm());

    // Two emails: notification to owner, confirmation to visitor.
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("sends the notification to manvendra@rajpoot.dev with Reply-To = visitor", async () => {
    await sendEmail(validForm());

    const notification = sendMock.mock.calls[0]?.[0] as Record<string, string>;
    expect(notification.to).toBe("manvendra@rajpoot.dev");
    expect(notification.replyTo).toBe("real@example.com");
    expect(notification.html).toContain("hello there");
    // Both parts are sent: a transactional message with no text/plain
    // alternative scores worse with spam filters.
    expect(notification.text).toContain("hello there");
  });

  it("sends the confirmation to visitor with Reply-To = manvendra@rajpoot.dev", async () => {
    await sendEmail(validForm());

    const confirmation = sendMock.mock.calls[1]?.[0] as Record<string, string>;
    expect(confirmation.to).toBe("real@example.com");
    expect(confirmation.replyTo).toBe("manvendra@rajpoot.dev");
    expect(confirmation.from).toContain("hello@rajpoot.dev");
    expect(confirmation.html).toContain("Thanks for reaching out");
    expect(confirmation.text).toContain("hello there");
  });

  it("escapes the visitor's input into the HTML part", async () => {
    await sendEmail(validForm({ message: "<img src=x onerror=alert(1)>" }));

    const payload = sendMock.mock.calls[0]?.[0] as {
      html: string;
      text: string;
    };
    // The template interpolates untrusted form input into an HTML string, so
    // the escaping is the only thing standing between a submitted payload and
    // markup running in whatever client opens the notification.
    expect(payload.html).not.toContain("<img");
    expect(payload.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    // The plaintext part is not markup and is deliberately left verbatim.
    expect(payload.text).toContain("<img src=x onerror=alert(1)>");
  });

  it("returns a generic error and logs a structured event when the notification throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error("Resend 401: bad api key"));

    const result = await sendEmail(validForm());

    expect(result).toEqual({
      error: "Couldn't send your message. Please try again later.",
    });
    // Raw provider text must not leak to the client...
    expect(JSON.stringify(result)).not.toContain("401");

    // ...but a log drain must be able to alert on it, which needs a stable
    // machine-readable event name rather than free text.
    expect(consoleError).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleError.mock.calls[0]?.[0] as string);
    expect(logged.event).toBe("contact.send_failed");
    expect(logged.level).toBe("error");
    expect(logged.reason).toContain("401");
    // Never ship the visitor's message or address to a third-party log sink.
    expect(consoleError.mock.calls[0]?.[0]).not.toContain("Test User");
    expect(consoleError.mock.calls[0]?.[0]).not.toContain("real@example.com");
    expect(consoleError.mock.calls[0]?.[0]).not.toContain("hello there");
    // Confirmation must not be attempted when the notification itself failed.
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it("still returns success when the confirmation email fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    // First call (notification) succeeds, second call (confirmation) throws.
    sendMock
      .mockResolvedValueOnce({ id: "email_123" })
      .mockRejectedValueOnce(new Error("Resend rate limit"));

    const result = await sendEmail(validForm());

    // The visitor's message was delivered to the owner — that's success.
    expect(result).toEqual({ data: { id: "email_123" } });
    expect(sendMock).toHaveBeenCalledTimes(2);

    // The confirmation failure is logged for alerting.
    expect(consoleError).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleError.mock.calls[0]?.[0] as string);
    expect(logged.event).toBe("contact.confirmation_failed");
    expect(logged.level).toBe("error");
    expect(logged.reason).toContain("rate limit");
  });

  it("returns an e2e marker without sending when E2E_TESTING=1", async () => {
    vi.stubEnv("E2E_TESTING", "1");

    await expect(sendEmail(validForm())).resolves.toEqual({
      data: { id: "e2e-skipped" },
    });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
