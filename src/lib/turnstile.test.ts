import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockSiteverify(body: unknown, ok = true) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe("verifyTurnstile", () => {
  it("passes when no secret is configured", async () => {
    // Matches the posture the Upstash limiter took when its env vars were
    // absent: local development and E2E must not need a live account. The
    // `contact.turnstile_unconfigured` log line is what flags this in prod.
    const fetchSpy = mockSiteverify({ success: true });

    expect(await verifyTurnstile(undefined, "any", null)).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a missing or non-string token without calling out", async () => {
    const fetchSpy = mockSiteverify({ success: true });

    for (const token of [null, undefined, "", 42, {}]) {
      expect(await verifyTurnstile("secret", token, null)).toEqual({
        ok: false,
        reason: "missing-input-response",
      });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts a token Cloudflare confirms", async () => {
    mockSiteverify({ success: true });
    expect(await verifyTurnstile("secret", "token", "1.2.3.4")).toEqual({
      ok: true,
    });
  });

  it("forwards the secret, token and client IP to siteverify", async () => {
    const fetchSpy = mockSiteverify({ success: true });

    await verifyTurnstile("s3cret", "tok", "1.2.3.4");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("secret")).toBe("s3cret");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });

  it("omits remoteip when there is no client IP", async () => {
    const fetchSpy = mockSiteverify({ success: true });

    await verifyTurnstile("s3cret", "tok", null);

    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect((init.body as FormData).has("remoteip")).toBe(false);
  });

  it("surfaces Cloudflare's error codes on a rejection", async () => {
    mockSiteverify({
      success: false,
      "error-codes": ["invalid-input-response", "timeout-or-duplicate"],
    });

    expect(await verifyTurnstile("secret", "token", null)).toEqual({
      ok: false,
      reason: "invalid-input-response,timeout-or-duplicate",
    });
  });

  it("reports a rejection with no error codes as unknown", async () => {
    mockSiteverify({ success: false });

    expect(await verifyTurnstile("secret", "token", null)).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  it("fails closed when siteverify is unreachable", async () => {
    // An attacker who can black-hole siteverify must not thereby disable the
    // check — the whole point of the control is that it can't be routed around.
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    expect(await verifyTurnstile("secret", "token", null)).toEqual({
      ok: false,
      reason: "verify-unreachable",
    });
  });

  it("fails closed when siteverify returns unparseable JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);

    expect(await verifyTurnstile("secret", "token", null)).toEqual({
      ok: false,
      reason: "verify-unreachable",
    });
  });
});
