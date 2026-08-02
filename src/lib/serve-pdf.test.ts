import { describe, expect, it, vi } from "vitest";

import { servePdf } from "./serve-pdf";

type Event = Parameters<typeof servePdf>[0];

function makeEvent({
  assets,
  ok = true,
}: {
  assets?: boolean;
  ok?: boolean;
} = {}) {
  const upstream = () =>
    Promise.resolve(
      new Response(ok ? "%PDF-1.7" : "nope", { status: ok ? 200 : 404 }),
    );

  // Typed with the Request parameter so `mock.calls[0][0]` is inspectable —
  // the ASSETS-binding test asserts on the URL that gets requested.
  const assetsFetch = vi.fn((_request: Request) => upstream());
  const eventFetch = vi.fn((_url: URL) => upstream());

  return {
    assetsFetch,
    eventFetch,
    event: {
      url: new URL("http://localhost:3100/resume"),
      fetch: eventFetch,
      platform: assets
        ? { env: { ASSETS: { fetch: assetsFetch } } }
        : undefined,
    } as unknown as Event,
  };
}

describe("servePdf", () => {
  it("serves the file as a download with the right filename", async () => {
    const { event } = makeEvent({ assets: true });
    const res = await servePdf(event, "Resume.pdf", "Resume not found");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="Resume.pdf"',
    );
  });

  it("noindexes the response", async () => {
    // Keeps the standalone document from competing with the homepage in search
    // results. robots.txt can't cover a direct fetch.
    const { event } = makeEvent({ assets: true });
    const res = await servePdf(event, "Resume.pdf", "nope");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("marks the file immutable", async () => {
    const { event } = makeEvent({ assets: true });
    const res = await servePdf(event, "Resume.pdf", "nope");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(res.headers.get("cache-control")).toContain("max-age=31536000");
  });

  it("reads through the ASSETS binding when the platform provides one", async () => {
    // Production. There is no filesystem on a Worker, so the bytes have to come
    // from the deployment's static assets.
    const { event, assetsFetch, eventFetch } = makeEvent({ assets: true });
    await servePdf(event, "Resume.pdf", "nope");

    expect(assetsFetch).toHaveBeenCalledOnce();
    expect(eventFetch).not.toHaveBeenCalled();
    const request = assetsFetch.mock.calls[0]![0];
    expect(new URL(request.url).pathname).toBe("/Resume.pdf");
  });

  it("falls back to event.fetch where there is no binding", async () => {
    // `vite dev` and `vite preview`, which have no Cloudflare platform object.
    const { event, assetsFetch, eventFetch } = makeEvent({ assets: false });
    await servePdf(event, "Resume.pdf", "nope");

    expect(eventFetch).toHaveBeenCalledOnce();
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it("404s with the supplied message when the file is missing", async () => {
    const { event } = makeEvent({ assets: true, ok: false });
    await expect(
      servePdf(event, "Missing.pdf", "Resume not found"),
    ).rejects.toMatchObject({ status: 404 });
  });
});
