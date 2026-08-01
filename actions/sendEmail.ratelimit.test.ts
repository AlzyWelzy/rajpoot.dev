import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The rate-limit paths of sendEmail: Upstash-backed when configured, and the
// per-instance in-memory fallback in production. Each test re-imports the
// module (vi.resetModules) because the limiter and fallback state are cached
// at module scope.

const { sendMock, limitMock, getHeaders } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  limitMock: vi.fn(),
  // Reassigned per test to control what next/headers returns.
  getHeaders: { current: () => new Headers() },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

vi.mock("@/email/contact-form-email", () => ({
  default: () => null,
}));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = vi.fn(() => "sliding-window");
    limit = limitMock;
  }
  return { Ratelimit };
});

vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: vi.fn(() => ({})) } }));

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

const validForm = () =>
  form({ senderEmail: "real@example.com", message: "hello there" });

describe("sendEmail rate limiting (Upstash configured)", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
    limitMock.mockReset();
    getHeaders.current = () => new Headers();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects with a friendly error when the limit is exhausted", async () => {
    limitMock.mockResolvedValue({ success: false });
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(result).toEqual({
      error: "Too many messages. Please try again in a few minutes.",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends when the limit allows the request", async () => {
    limitMock.mockResolvedValue({ success: true });
    const sendEmail = await freshSendEmail();

    const result = await sendEmail(validForm());

    expect(limitMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ data: { id: "email_123" } });
  });

  it("keys the limit on x-real-ip when present", async () => {
    limitMock.mockResolvedValue({ success: true });
    getHeaders.current = () =>
      new Headers({
        "x-real-ip": "203.0.113.7",
        "x-forwarded-for": "6.6.6.6, 203.0.113.7",
      });
    const sendEmail = await freshSendEmail();

    await sendEmail(validForm());

    expect(limitMock).toHaveBeenCalledWith("203.0.113.7");
  });

  it("never trusts the spoofable first x-forwarded-for hop", async () => {
    limitMock.mockResolvedValue({ success: true });
    getHeaders.current = () =>
      new Headers({ "x-forwarded-for": "6.6.6.6, 198.51.100.9" });
    const sendEmail = await freshSendEmail();

    await sendEmail(validForm());

    // The LAST entry is the one the trusted proxy appended.
    expect(limitMock).toHaveBeenCalledWith("198.51.100.9");
  });

  it("buckets header-less requests under 'anonymous'", async () => {
    limitMock.mockResolvedValue({ success: true });
    const sendEmail = await freshSendEmail();

    await sendEmail(validForm());

    expect(limitMock).toHaveBeenCalledWith("anonymous");
  });

  it("gives the shared anonymous bucket its own, wider window", async () => {
    limitMock.mockResolvedValue({ success: true });
    const { Ratelimit } = await import("@upstash/ratelimit");
    const slidingWindow = Ratelimit.slidingWindow as unknown as ReturnType<
      typeof vi.fn
    >;
    slidingWindow.mockClear();

    const sendEmail = await freshSendEmail();
    await sendEmail(validForm());

    // Everyone without a usable IP header shares one key, so applying the
    // per-IP budget to it would let one script lock out every other
    // header-less visitor. The two budgets must differ, and the anonymous one
    // must be the larger.
    const limits = slidingWindow.mock.calls.map((call) => call[0] as number);
    expect(limits).toHaveLength(2);
    const [identified, anonymous] = limits;
    expect(anonymous).toBeGreaterThan(identified!);
  });

  it("logs a structured rate_limited event when it turns someone away", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    limitMock.mockResolvedValue({ success: false });
    const sendEmail = await freshSendEmail();

    await sendEmail(validForm());

    const line = warn.mock.calls.at(-1)?.[0] as string;
    expect(JSON.parse(line)).toMatchObject({
      event: "contact.rate_limited",
      identified: false,
    });
    warn.mockRestore();
  });
});

describe("sendEmail rate limiting (production fallback, Upstash unset)", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email_123" });
    limitMock.mockReset();
    getHeaders.current = () => new Headers({ "x-real-ip": "203.0.113.7" });
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("warns once and throttles after the in-memory window fills", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sendEmail = await freshSendEmail();

    for (let i = 0; i < 5; i++) {
      expect(await sendEmail(validForm())).toEqual({
        data: { id: "email_123" },
      });
    }
    const sixth = await sendEmail(validForm());

    expect(sixth).toEqual({
      error: "Too many messages. Please try again in a few minutes.",
    });
    expect(sendMock).toHaveBeenCalledTimes(5);
    // One misconfiguration warning, then one warning for the rejected request.
    const events = warn.mock.calls.map(
      (call) => JSON.parse(call[0] as string).event,
    );
    expect(events).toEqual([
      "contact.ratelimit_misconfigured",
      "contact.rate_limited",
    ]);
    // The Upstash client must not have been constructed at all.
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("does not let one header-less caller lock out the rest", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    getHeaders.current = () => new Headers();
    const sendEmail = await freshSendEmail();

    // Five requests would exhaust an identified IP's budget outright. The
    // shared anonymous bucket has to keep serving well past that point.
    for (let i = 0; i < 6; i++) {
      expect(await sendEmail(validForm())).toEqual({
        data: { id: "email_123" },
      });
    }
  });

  it("limits per IP, not globally", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const sendEmail = await freshSendEmail();

    getHeaders.current = () => new Headers({ "x-real-ip": "203.0.113.1" });
    for (let i = 0; i < 5; i++) await sendEmail(validForm());
    expect(await sendEmail(validForm())).toHaveProperty("error");

    // A different IP still gets through.
    getHeaders.current = () => new Headers({ "x-real-ip": "203.0.113.2" });
    expect(await sendEmail(validForm())).toEqual({
      data: { id: "email_123" },
    });
  });
});
