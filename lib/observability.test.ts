import { afterEach, describe, expect, it, vi } from "vitest";

import { logServerEvent } from "./observability";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logServerEvent", () => {
  it("writes one parseable JSON line per event", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    logServerEvent("contact.send_failed", "error", { reason: "boom" });

    expect(error).toHaveBeenCalledOnce();
    const line = error.mock.calls[0]?.[0] as string;
    expect(line.split("\n")).toHaveLength(1);
    expect(JSON.parse(line)).toEqual({
      event: "contact.send_failed",
      level: "error",
      reason: "boom",
    });
  });

  it("routes warn-level events to console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    logServerEvent("contact.turnstile_rejected", "warn", {
      detail: "invalid-input-response",
    });

    expect(error).not.toHaveBeenCalled();
    expect(JSON.parse(warn.mock.calls[0]?.[0] as string)).toMatchObject({
      event: "contact.turnstile_rejected",
      detail: "invalid-input-response",
    });
  });

  it("works with no extra fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    logServerEvent("contact.honeypot_tripped", "warn");

    expect(JSON.parse(warn.mock.calls[0]?.[0] as string)).toEqual({
      event: "contact.honeypot_tripped",
      level: "warn",
    });
  });
});
