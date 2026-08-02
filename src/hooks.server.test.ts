import { describe, expect, it, vi } from "vitest";

import { handle } from "./hooks.server";
import { siteConfig } from "$lib/seo";

type HandleArgs = Parameters<typeof handle>[0];

function call(pathname: string, opts: { host?: string; body?: Response } = {}) {
  const url = new URL(`http://${opts.host ?? "localhost"}${pathname}`);
  const resolve = vi.fn(async () => opts.body ?? new Response("ok"));
  return {
    resolve,
    response: handle({
      event: { url } as unknown as HandleArgs["event"],
      resolve,
    } as HandleArgs),
  };
}

const REQUIRED = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
];

describe("handle — security headers", () => {
  it("adds the whole set to an ordinary response", async () => {
    const { response } = call("/api/contact");
    const res = await response;

    for (const header of REQUIRED) {
      expect(res.headers.get(header), header).toBeTruthy();
    }
  });

  it("keeps the headers the route itself set", async () => {
    // serve-pdf.ts sets Content-Disposition and its own X-Robots-Tag; the hook
    // must add to that response, not replace its headers.
    const body = new Response("pdf", {
      headers: { "Content-Disposition": 'attachment; filename="x.pdf"' },
    });
    const res = await call("/resume", { body }).response;

    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="x.pdf"',
    );
    expect(res.headers.get("content-security-policy")).toBeTruthy();
  });

  it("omits upgrade-insecure-requests on localhost", async () => {
    // WebKit applies the directive to localhost too, which rewrites every asset
    // URL to https and breaks the page under Playwright's plain-http server.
    const res = await call("/api/contact", { host: "localhost" }).response;
    expect(res.headers.get("content-security-policy")).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("includes upgrade-insecure-requests for a real host", async () => {
    const res = await call("/api/contact", { host: "www.rajpoot.dev" })
      .response;
    expect(res.headers.get("content-security-policy")).toContain(
      "upgrade-insecure-requests",
    );
  });
});

describe("handle — shortlinks", () => {
  it("answers a shortlink with a 308 and never reaches the router", async () => {
    const { resolve, response } = call("/github");
    const res = await response;

    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(siteConfig.github);
    // 308 rather than 301 preserves the request method, and matches what Next's
    // `permanent: true` emitted — the URLs are printed on a CV.
    expect(resolve).not.toHaveBeenCalled();
  });

  it("puts the security headers on the redirect itself", async () => {
    // The exact regression this exists to prevent: on Vercel, Next applied
    // neither headers() nor the CSP to a redirect response, so every shortlink
    // hop shipped bare and the bare HSTS blocked hstspreload.org submission.
    const res = await call("/linkedin").response;

    for (const header of REQUIRED) {
      expect(res.headers.get(header), header).toBeTruthy();
    }
    expect(res.headers.get("strict-transport-security")).toContain("preload");
  });

  it("forwards blog sub-paths", async () => {
    const res = await call("/blog/some-post").response;
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(`${siteConfig.blog}/some-post`);
  });

  it("leaves real routes alone", async () => {
    const { resolve, response } = call("/resume");
    const res = await response;

    expect(res.status).toBe(200);
    expect(resolve).toHaveBeenCalledOnce();
  });
});

describe("handle — PDF noindex", () => {
  it("noindexes a raw PDF filename", async () => {
    // static/ serves the documents at their bare filenames too, a path that
    // bypasses the /resume route handler and the X-Robots-Tag it sets.
    const res = await call("/Manvendra_Rajpoot_Resume.pdf").response;
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("matches case-insensitively", async () => {
    const res = await call("/Some_Document.PDF").response;
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("does not noindex the page itself", async () => {
    const res = await call("/").response;
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });
});
