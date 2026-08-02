import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

// Resend is what would otherwise reach for network + node builtins; the
// endpoint only ever calls `.emails.send`. A class, not `vi.fn(() => …)` —
// the endpoint calls `new Resend(...)`, and an arrow function is not
// constructible.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const env: Record<string, string | undefined> = {};
vi.mock("$env/dynamic/private", () => ({ env }));

const verifyMock = vi.fn();
vi.mock("$lib/turnstile", () => ({ verifyTurnstile: verifyMock }));

const logMock = vi.fn();
vi.mock("$lib/observability", () => ({ logServerEvent: logMock }));

const { POST } = await import("./+server");

type Args = Parameters<typeof POST>[0];

function post(
  fields: Record<string, string>,
  headers: Record<string, string> = {},
  handler: typeof POST = POST,
) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const request = new Request("http://localhost/api/contact", {
    method: "POST",
    body,
    headers,
  });
  return handler({ request } as Args);
}

const VALID = { senderEmail: "visitor@example.com", message: "Hello there" };

beforeEach(() => {
  for (const key of Object.keys(env)) delete env[key];
  verifyMock.mockResolvedValue({ ok: true });
  sendMock.mockResolvedValue({ id: "sent" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/contact — honeypot", () => {
  it("reports fake success and sends nothing", async () => {
    // The bot must learn nothing. A 4xx here is a signal it can tune against.
    const res = await post({ ...VALID, contact_reason_hp: "http://spam.test" });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { id: "skipped" } });
    expect(sendMock).not.toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith("contact.honeypot_tripped", "warn");
  });

  it("is checked before Turnstile, so a trap costs no verify call", async () => {
    await post({ ...VALID, contact_reason_hp: "x" });
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("ignores a whitespace-only honeypot", async () => {
    // Some browsers and extensions will drop stray whitespace into a hidden
    // field; that must not silently discard a real person's message.
    env.E2E_TESTING = "1";
    const res = await post({ ...VALID, contact_reason_hp: "   " });
    await expect(res.json()).resolves.toEqual({ data: { id: "e2e-skipped" } });
  });
});

describe("POST /api/contact — validation", () => {
  it("rejects a malformed email", async () => {
    const res = await post({ ...VALID, senderEmail: "not-an-email" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid sender email",
    });
  });

  it("rejects an empty message", async () => {
    const res = await post({ ...VALID, message: "" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid message" });
  });

  it("rejects an over-long message", async () => {
    const res = await post({ ...VALID, message: "x".repeat(5001) });
    expect(res.status).toBe(400);
  });

  it("runs before Turnstile so bad input spends no verify call", async () => {
    await post({ ...VALID, senderEmail: "nope" });
    expect(verifyMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact — Turnstile", () => {
  it("turns away a failed verification without sending", async () => {
    verifyMock.mockResolvedValue({
      ok: false,
      reason: "invalid-input-response",
    });

    const res = await post(VALID);

    expect(res.status).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith("contact.turnstile_failed", "warn", {
      reason: "invalid-input-response",
    });
  });

  it("never leaks the failure reason to the client", async () => {
    verifyMock.mockResolvedValue({ ok: false, reason: "bad-secret-key" });
    const body = await (await post(VALID)).json();
    expect(JSON.stringify(body)).not.toContain("bad-secret-key");
  });

  it("passes the token and Cloudflare's client IP to verification", async () => {
    env.TURNSTILE_SECRET_KEY = "secret";
    await post(
      { ...VALID, "cf-turnstile-response": "tok" },
      { "cf-connecting-ip": "203.0.113.9" },
    );

    // cf-connecting-ip is set at the edge and is not client-spoofable, unlike
    // the left-hand side of x-forwarded-for.
    expect(verifyMock).toHaveBeenCalledWith("secret", "tok", "203.0.113.9");
  });

  it("is not consulted at all during an E2E run", async () => {
    // Managed mode always challenges an automation browser, so an E2E run can
    // never hold a token. Verification therefore has to be skipped rather than
    // satisfied, or the suite's result depends on whether a secret happens to
    // be configured locally.
    env.E2E_TESTING = "1";
    env.TURNSTILE_SECRET_KEY = "secret";

    const res = await post(VALID);

    expect(res.status).toBe(200);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("warns exactly once when no secret is configured", async () => {
    // Absent secret is a valid local/E2E posture but must be loud in prod —
    // once per isolate, not once per submission, or a busy form buries the
    // rest of the log.
    //
    // `warnedNoTurnstile` is module state, so this needs a module instance no
    // earlier test in this file has already tripped.
    //
    // Deliberately not an E2E run: that path returns before reaching the
    // warning, which is the point of it being there.
    vi.resetModules();
    const { POST: fresh } = await import("./+server");

    await post(VALID, {}, fresh);
    await post(VALID, {}, fresh);

    const warnings = logMock.mock.calls.filter(
      ([event]) => event === "contact.turnstile_unconfigured",
    );
    expect(warnings).toHaveLength(1);
  });
});

describe("POST /api/contact — sending", () => {
  it("short-circuits under E2E_TESTING without calling Resend", async () => {
    env.E2E_TESTING = "1";
    const res = await post(VALID);

    await expect(res.json()).resolves.toEqual({ data: { id: "e2e-skipped" } });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends both an HTML and a plaintext part, with a reply-to", async () => {
    const res = await post(VALID);
    expect(res.status).toBe(200);

    const payload = sendMock.mock.calls[0]![0];
    expect(payload.replyTo).toBe(VALID.senderEmail);
    expect(payload.html).toContain("Hello there");
    // Transactional mail without a real text/plain alternative scores worse
    // with spam filters.
    expect(payload.text).toContain("Hello there");
    expect(payload.text).not.toContain("<");
  });

  it("falls back to the Resend sandbox sender when RESEND_FROM is unset", async () => {
    await post(VALID);
    expect(sendMock.mock.calls[0]![0].from).toContain("onboarding@resend.dev");
  });

  it("uses RESEND_FROM when it is set", async () => {
    env.RESEND_FROM = "Contact Form <contact@rajpoot.dev>";
    await post(VALID);
    expect(sendMock.mock.calls[0]![0].from).toBe(
      "Contact Form <contact@rajpoot.dev>",
    );
  });

  it("returns a generic message and logs the real cause on failure", async () => {
    sendMock.mockRejectedValue(new Error("Resend 401: invalid api key"));

    const res = await post(VALID);
    const body = await res.json();

    expect(res.status).toBe(502);
    // Provider error text must never reach the client.
    expect(JSON.stringify(body)).not.toContain("401");
    expect(body.error).toBe(
      "Couldn't send your message. Please try again later.",
    );
    expect(logMock).toHaveBeenCalledWith("contact.send_failed", "error", {
      reason: "Resend 401: invalid api key",
    });
  });

  it("keeps the sender address and message body out of the log line", async () => {
    // These lines are safe to ship to a third-party log sink; that is the whole
    // point of the structured-event module.
    sendMock.mockRejectedValue(new Error("upstream exploded"));
    await post(VALID);

    const fields = JSON.stringify(logMock.mock.calls.at(-1));
    expect(fields).not.toContain(VALID.senderEmail);
    expect(fields).not.toContain(VALID.message);
  });
});
