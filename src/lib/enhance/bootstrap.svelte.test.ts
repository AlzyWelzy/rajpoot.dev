import { afterEach, describe, expect, it, vi } from "vitest";

import { initTurnstile } from "./turnstile";

const initTheme = vi.fn();
const initNav = vi.fn();
const initReveal = vi.fn();
const initScrollToTop = vi.fn();
const initTracking = vi.fn();
const initContact = vi.fn();

vi.mock("./theme", () => ({ initTheme, paint: vi.fn() }));
vi.mock("./nav", () => ({ initNav }));
vi.mock("./reveal", () => ({ initReveal, initScrollToTop }));
vi.mock("./analytics", () => ({ initTracking, track: vi.fn() }));
vi.mock("./contact", () => ({ initContact }));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("bootstrap", () => {
  it("runs every initialiser", async () => {
    await import("./index");

    for (const init of [
      initTheme,
      initNav,
      initReveal,
      initScrollToTop,
      initTracking,
      initContact,
    ]) {
      expect(init).toHaveBeenCalledOnce();
    }
  });

  it("keeps going when one initialiser throws", async () => {
    // These are independent behaviours on a page that must stay usable. A
    // thrown error in the scroll-spy taking the contact form down with it is
    // exactly the failure mode the try/catch exists to prevent.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    initNav.mockImplementation(() => {
      throw new Error("boom");
    });

    await import("./index");

    expect(initContact).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalled();
  });
});

describe("turnstile rendering", () => {
  type RenderOpts = {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  };

  function stubApi() {
    const render = vi.fn((_el: HTMLElement, _opts: RenderOpts) => "widget-1");
    const reset = vi.fn();
    vi.stubGlobal("turnstile", { render, reset });
    return { render, reset };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("renders into the container with the site key from the markup", () => {
    document.body.innerHTML = `<div data-turnstile="site-key"></div>`;
    const { render } = stubApi();

    initTurnstile().start();

    expect(render).toHaveBeenCalledOnce();
    const opts = render.mock.calls[0]![1];
    expect(opts.sitekey).toBe("site-key");
    // "always", not "interaction-only": an invisible control is impossible to
    // verify, for a visitor mid-submission or for whoever is checking a deploy.
    expect(opts).toMatchObject({ appearance: "always" });
  });

  it("captures the token from the success callback", () => {
    document.body.innerHTML = `<div data-turnstile="site-key"></div>`;
    const { render } = stubApi();
    const challenge = initTurnstile();

    challenge.start();
    render.mock.calls[0]![1].callback("tok-123");

    expect(challenge.token()).toBe("tok-123");
  });

  it("drops the token when it expires or errors", () => {
    for (const hook of ["expired-callback", "error-callback"] as const) {
      document.body.innerHTML = `<div data-turnstile="site-key"></div>`;
      const { render } = stubApi();
      const challenge = initTurnstile();

      challenge.start();
      const opts = render.mock.calls[0]![1];
      opts.callback("tok");
      opts[hook]();

      expect(challenge.token(), hook).toBeNull();
    }
  });

  it("resets the widget after a successful send", () => {
    // A Turnstile token is single-use; without this a second message from the
    // same visit would be rejected.
    document.body.innerHTML = `<div data-turnstile="site-key"></div>`;
    const { render, reset } = stubApi();
    const challenge = initTurnstile();

    challenge.start();
    render.mock.calls[0]![1].callback("tok");
    challenge.reset();

    expect(challenge.token()).toBeNull();
    expect(reset).toHaveBeenCalledWith("widget-1");
  });
});
