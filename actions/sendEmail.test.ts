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

// The email template renders React; stub it so the action doesn't pull in the
// full @react-email runtime during a unit test.
vi.mock("@/email/contact-form-email", () => ({
  default: () => null,
}));

// No Upstash env vars are set in the test environment, so `ratelimit` is null
// and this path is skipped — but mock the modules so importing them is cheap.
vi.mock("@upstash/ratelimit", () => ({ Ratelimit: vi.fn() }));
vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: vi.fn() } }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { sendEmail } from "./sendEmail";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("sendEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("silently drops honeypot-filled submissions without sending", async () => {
    const result = await sendEmail(
      form({
        senderEmail: "real@example.com",
        message: "hello there",
        contact_reason_hp: "i am a bot",
      }),
    );

    expect(result).toEqual({ data: { id: "skipped" } });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed sender email before sending", async () => {
    const result = await sendEmail(
      form({ senderEmail: "not-an-email", message: "hello there" }),
    );

    expect(result).toEqual({ error: "Invalid sender email" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const result = await sendEmail(
      form({ senderEmail: "real@example.com", message: "" }),
    );

    expect(result).toEqual({ error: "Invalid message" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends a valid message and returns the provider data", async () => {
    const result = await sendEmail(
      form({ senderEmail: "real@example.com", message: "hello there" }),
    );

    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0]?.[0]).toMatchObject({
      replyTo: "real@example.com",
      to: expect.any(String),
    });
    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("returns a generic error and logs a structured event when the provider throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error("Resend 401: bad api key"));

    const result = await sendEmail(
      form({ senderEmail: "real@example.com", message: "hello there" }),
    );

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
    expect(consoleError.mock.calls[0]?.[0]).not.toContain("real@example.com");
    expect(consoleError.mock.calls[0]?.[0]).not.toContain("hello there");
  });

  it("returns an e2e marker without sending when E2E_TESTING=1", async () => {
    vi.stubEnv("E2E_TESTING", "1");

    await expect(
      sendEmail(form({ senderEmail: "real@example.com", message: "hello" })),
    ).resolves.toEqual({ data: { id: "e2e-skipped" } });
    expect(sendMock).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });
});
