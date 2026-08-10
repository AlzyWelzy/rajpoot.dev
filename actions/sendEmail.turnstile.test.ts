import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Turnstile verification path of sendEmail: the module is re-imported
// per test (vi.resetModules) so expectedHostnames (computed once at module
// load from NEXT_PUBLIC_SITE_URL/TURNSTILE_HOSTNAMES) can vary between tests.

const { sendMock, getHeaders } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  // Reassigned per test to control what next/headers returns.
  getHeaders: { current: () => new Headers() },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => getHeaders.current()),
}));

async function freshSendEmail() {
  vi.resetModules();
  const mod = await import("./sendEmail");
  return mod.sendEmail;
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validForm = (overrides: Record<string, string> = {}) =>
  form({
    senderEmail: "real@example.com",
    message: "hello there",
    "cf-turnstile-response": "test-token",
    ...overrides,
  });

function mockSiteverify(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

describe("sendEmail Turnstile verification", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
    getHeaders.current = () => new Headers();
    vi.stubEnv("TURNSTILE_SECRET", "test-secret");
    // "localhost" is always in the default expected-hostname set (see
    // actions/sendEmail.ts), independent of NEXT_PUBLIC_SITE_URL.
    mockSiteverify({ success: true, action: "contact", hostname: "localhost" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends when siteverify approves the token", async () => {
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("posts the secret and token as form-encoded body", async () => {
    const sendEmail = await freshSendEmail();
    await sendEmail(validForm({ "cf-turnstile-response": "abc123" }));

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("abc123");
  });

  it("forwards cf-connecting-ip as remoteip", async () => {
    getHeaders.current = () =>
      new Headers({ "cf-connecting-ip": "203.0.113.7" });
    const sendEmail = await freshSendEmail();
    await sendEmail(validForm());

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("rejects with a friendly error when no token is submitted", async () => {
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(
      form({ senderEmail: "real@example.com", message: "hello there" }),
    );

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(sendMock).not.toHaveBeenCalled();
    // Never spends a siteverify round trip on a request with no token at all.
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects and warns when TURNSTILE_SECRET is not configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(fetch).not.toHaveBeenCalled();
    const logged = JSON.parse(warn.mock.calls[0]?.[0] as string);
    expect(logged.event).toBe("contact.turnstile_misconfigured");
  });

  it("rejects when siteverify reports success: false", async () => {
    mockSiteverify({
      success: false,
      "error-codes": ["invalid-input-response"],
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(sendMock).not.toHaveBeenCalled();
    const logged = JSON.parse(warn.mock.calls.at(-1)?.[0] as string);
    expect(logged.event).toBe("contact.turnstile_rejected");
    expect(logged.detail).toBe("invalid-input-response");
  });

  it("rejects when the action does not match", async () => {
    mockSiteverify({ success: true, action: "signup", hostname: "localhost" });
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects when the hostname is not in the expected set", async () => {
    mockSiteverify({
      success: true,
      action: "contact",
      hostname: "evil.example.com",
    });
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("skips the action/hostname check for a testing-key result", async () => {
    // Cloudflare's testing sitekey/secret pair (used by E2E, see
    // playwright.config.ts) always reports a fixed hostname ("example.com")
    // and no action — real widget/token responses never look like this, so
    // the metadata flag is what distinguishes "this is expected" from "this
    // is a real mismatch that should be rejected".
    mockSiteverify({
      success: true,
      hostname: "example.com",
      metadata: { result_with_testing_key: true },
    });
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("respects a TURNSTILE_HOSTNAMES override", async () => {
    vi.stubEnv("TURNSTILE_HOSTNAMES", "custom.example.com, other.example.com");
    mockSiteverify({
      success: true,
      action: "contact",
      hostname: "custom.example.com",
    });
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("fails closed on a siteverify network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(sendMock).not.toHaveBeenCalled();
    const logged = JSON.parse(error.mock.calls[0]?.[0] as string);
    expect(logged.event).toBe("contact.turnstile_error");
  });

  it("fails closed on a non-2xx siteverify response", async () => {
    mockSiteverify({}, 500);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({ error: "Verification failed. Please try again." });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("never checks Turnstile for a honeypot-tripped submission", async () => {
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(
      form({
        senderEmail: "real@example.com",
        message: "hello there",
        contact_reason_hp: "i am a bot",
      }),
    );

    expect(result).toEqual({ data: { id: "skipped" } });
    expect(fetch).not.toHaveBeenCalled();
  });
});
