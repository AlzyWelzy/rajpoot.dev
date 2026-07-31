import { afterEach, describe, expect, it, vi } from "vitest";

import { sendEmail } from "./sendEmail";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendEmail — E2E short-circuit", () => {
  it("returns an e2e marker without sending when E2E_TESTING=1", async () => {
    vi.stubEnv("E2E_TESTING", "1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const form = new FormData();
    form.set("senderEmail", "sender@example.com");
    form.set("message", "A valid message body.");

    await expect(sendEmail(form)).resolves.toEqual({
      data: { id: "e2e-skipped" },
    });
  });
});
