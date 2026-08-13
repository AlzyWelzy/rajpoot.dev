import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture what resend.emails.send is called with, and control its outcome.
// `vi.hoisted` makes these available to the hoisted vi.mock factories below.
const { sendMock, mockEnv } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  mockEnv: {} as Record<string, string | undefined>,
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

// Stands in for the real Workers ASSETS/secrets binding. A single mutable
// object rather than per-test module resets: getExpectedHostnames() and
// getFromAddress() in src/lib/contact.ts read `env` fresh on every call, so
// mutating properties here between tests is enough — no vi.resetModules()
// import dance needed.
vi.mock("cloudflare:workers", () => ({ env: mockEnv }));

// The email template is a dependency-free string builder, so it is left
// unmocked — the assertions below check the real rendered payload.

import { submitContactForm } from "./contact";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** A submission that clears validation and Turnstile, ready to send. */
const validForm = (overrides: Record<string, string> = {}) =>
  form({
    senderEmail: "real@example.com",
    message: "hello there",
    "cf-turnstile-response": "test-token",
    ...overrides,
  });

function submit(formData: FormData, headers: Record<string, string> = {}) {
  return submitContactForm(
    formData,
    new Request("https://rajpoot.me/", { headers }),
  );
}

function mockSiteverify(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

describe("submitContactForm", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockEnv)) delete mockEnv[key];
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
    mockEnv.TURNSTILE_SECRET = "test-secret";
    // Default: siteverify passes. "localhost" is always in the expected-
    // hostname set (see getExpectedHostnames in src/lib/contact.ts)
    // regardless of PUBLIC_SITE_URL, so this doesn't depend on whatever the
    // current default site domain is.
    mockSiteverify({ success: true, action: "contact", hostname: "localhost" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("silently drops honeypot-filled submissions without sending", async () => {
    const result = await submit(
      form({
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
    const result = await submit(
      form({ senderEmail: "not-an-email", message: "hello there" }),
    );

    expect(result).toEqual({
      error: "Invalid sender email",
      code: "BAD_REQUEST",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const result = await submit(
      form({ senderEmail: "real@example.com", message: "" }),
    );

    expect(result).toEqual({ error: "Invalid message", code: "BAD_REQUEST" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends a valid message and returns the provider data", async () => {
    const result = await submit(validForm());

    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0]?.[0]).toMatchObject({
      replyTo: "real@example.com",
      to: expect.any(String),
      html: expect.stringContaining("hello there"),
      // Both parts are sent: a transactional message with no text/plain
      // alternative scores worse with spam filters.
      text: expect.stringContaining("hello there"),
    });
    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("escapes the visitor's input into the HTML part", async () => {
    await submit(validForm({ message: "<img src=x onerror=alert(1)>" }));

    const payload = sendMock.mock.calls[0]?.[0] as {
      html: string;
      text: string;
    };
    expect(payload.html).not.toContain("<img");
    expect(payload.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(payload.text).toContain("<img src=x onerror=alert(1)>");
  });

  it("returns a generic error and logs a structured event when the provider throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error("Resend 401: bad api key"));

    const result = await submit(validForm());

    expect(result).toEqual({
      error: "Couldn't send your message. Please try again later.",
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(JSON.stringify(result)).not.toContain("401");

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
    mockEnv.E2E_TESTING = "1";

    await expect(submit(validForm())).resolves.toEqual({
      data: { id: "e2e-skipped" },
    });
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("submitContactForm Turnstile verification", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockEnv)) delete mockEnv[key];
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
    mockEnv.TURNSTILE_SECRET = "test-secret";
    mockSiteverify({ success: true, action: "contact", hostname: "localhost" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends when siteverify approves the token", async () => {
    const result = await submit(validForm());

    expect(fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("posts the secret and token as form-encoded body", async () => {
    await submit(validForm({ "cf-turnstile-response": "abc123" }));

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("abc123");
  });

  it("forwards cf-connecting-ip as remoteip", async () => {
    await submit(validForm(), { "cf-connecting-ip": "203.0.113.7" });

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("rejects with a friendly error when no token is submitted", async () => {
    const result = await submit(
      form({ senderEmail: "real@example.com", message: "hello there" }),
    );

    expect(result).toEqual({
      error: "Verification failed. Please try again.",
      code: "FORBIDDEN",
    });
    expect(sendMock).not.toHaveBeenCalled();
    // Never spends a siteverify round trip on a request with no token at all.
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects and warns when TURNSTILE_SECRET is not configured", async () => {
    mockEnv.TURNSTILE_SECRET = "";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await submit(validForm());

    expect(result.code).toBe("FORBIDDEN");
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

    const result = await submit(validForm());

    expect(result.code).toBe("FORBIDDEN");
    expect(sendMock).not.toHaveBeenCalled();
    const logged = JSON.parse(warn.mock.calls.at(-1)?.[0] as string);
    expect(logged.event).toBe("contact.turnstile_rejected");
    expect(logged.detail).toBe("invalid-input-response");
  });

  it("rejects when the action does not match", async () => {
    mockSiteverify({ success: true, action: "signup", hostname: "localhost" });

    const result = await submit(validForm());

    expect(result.code).toBe("FORBIDDEN");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects when the hostname is not in the expected set", async () => {
    mockSiteverify({
      success: true,
      action: "contact",
      hostname: "evil.example.com",
    });

    const result = await submit(validForm());

    expect(result.code).toBe("FORBIDDEN");
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

    const result = await submit(validForm());

    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("respects a TURNSTILE_HOSTNAMES override", async () => {
    mockEnv.TURNSTILE_HOSTNAMES = "custom.example.com, other.example.com";
    mockSiteverify({
      success: true,
      action: "contact",
      hostname: "custom.example.com",
    });

    const result = await submit(validForm());

    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("fails closed on a siteverify network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await submit(validForm());

    expect(result.code).toBe("FORBIDDEN");
    expect(sendMock).not.toHaveBeenCalled();
    const logged = JSON.parse(error.mock.calls[0]?.[0] as string);
    expect(logged.event).toBe("contact.turnstile_error");
  });

  it("fails closed on a non-2xx siteverify response", async () => {
    mockSiteverify({}, 500);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await submit(validForm());

    expect(result.code).toBe("FORBIDDEN");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("never checks Turnstile for a honeypot-tripped submission", async () => {
    const result = await submit(
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
