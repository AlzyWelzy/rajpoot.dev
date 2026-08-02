import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initTracking, track } from "./analytics";

const ENDPOINT = "https://collector.example/e";

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubBeacon() {
  const sendBeacon = vi.fn();
  vi.stubGlobal("navigator", { sendBeacon });
  return sendBeacon;
}

describe("track", () => {
  it("does nothing with no endpoint configured", () => {
    // The current deployed state: Cloudflare Web Analytics has no custom-event
    // API, so these calls go nowhere until a collector is pointed at.
    const sendBeacon = stubBeacon();

    track("cta_click", { cta: "get_in_touch" });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("beacons the event, its props and the path", () => {
    const sendBeacon = stubBeacon();

    track("cv_download", { source: "hero" }, ENDPOINT);

    expect(sendBeacon).toHaveBeenCalledOnce();
    const [url, blob] = sendBeacon.mock.calls[0]! as [string, Blob];
    expect(url).toBe(ENDPOINT);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("prefers sendBeacon, which survives the page teardown", () => {
    // A CTA click or an outbound social link tears the page down immediately;
    // a plain fetch on that path is routinely cancelled before it leaves.
    const sendBeacon = stubBeacon();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    track("social_click", { network: "github" }, ENDPOINT);

    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to a keepalive fetch without sendBeacon", () => {
    vi.stubGlobal("navigator", {});
    // Typed with both parameters so `mock.calls[0][1]` is inspectable.
    const fetchSpy = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(new Response()),
    );
    vi.stubGlobal("fetch", fetchSpy);

    track("contact_submit", {}, ENDPOINT);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const init = fetchSpy.mock.calls[0]![1];
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
  });

  it("never lets a failure break the interaction it is measuring", () => {
    vi.stubGlobal("navigator", {
      sendBeacon: () => {
        throw new Error("blocked by extension");
      },
    });

    expect(() => track("cta_click", {}, ENDPOINT)).not.toThrow();
  });
});

describe("initTracking", () => {
  it("wires declarative data-track attributes to clicks", () => {
    const sendBeacon = stubBeacon();
    document.body.innerHTML = `<a href="/github" data-track="social_click"
      data-track-props='{"network":"github"}'>GitHub</a>`;

    initTracking();
    document.querySelector<HTMLElement>("a")!.click();

    // Endpoint is unset in tests, so the call reaching `track` is what is
    // observable here; the payload shape is covered above.
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("tolerates a malformed props attribute", () => {
    // A bad attribute must not break the link it is attached to.
    stubBeacon();
    document.body.innerHTML = `<a href="/x" data-track="e" data-track-props="{oops">x</a>`;

    initTracking();

    expect(() =>
      document.querySelector<HTMLElement>("a")!.click(),
    ).not.toThrow();
  });

  it("does nothing when nothing is marked up for tracking", () => {
    expect(() => initTracking()).not.toThrow();
  });
});
