import { describe, expect, it } from "vitest";

import { GET as manifest } from "./manifest.webmanifest/+server";
import { GET as robots } from "./robots.txt/+server";
import { GET as sitemap } from "./sitemap.xml/+server";
import { siteConfig } from "$lib/seo";

// The handlers take no meaningful input; these routes are pure functions of
// siteConfig. Casting away the RequestEvent keeps that honest.
const invoke = (handler: (event: never) => Response | Promise<Response>) =>
  Promise.resolve(handler(undefined as never));

describe("sitemap.xml", () => {
  it("lists the homepage as the only URL", async () => {
    const body = await (await invoke(sitemap)).text();

    // Single-page site: the in-page sections are fragments of this same
    // document, and the blog is on its own domain with its own sitemap.
    expect(body.match(/<url>/g)).toHaveLength(1);
    expect(body).toContain(`<loc>${siteConfig.url}</loc>`);
  });

  it("uses the content-derived lastmod, not build time", async () => {
    // A `new Date()` here would churn the freshness signal on every redeploy.
    const body = await (await invoke(sitemap)).text();
    expect(body).toContain(`<lastmod>${siteConfig.lastUpdated}</lastmod>`);
  });

  it("is served as XML and declares the sitemap namespace", async () => {
    const res = await invoke(sitemap);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(await res.text()).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    );
  });
});

describe("robots.txt", () => {
  it("allows everything and points at the sitemap", async () => {
    const body = await (await invoke(robots)).text();

    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain(`Sitemap: ${siteConfig.url}/sitemap.xml`);
  });

  it("gives Host a bare hostname, not a URL", async () => {
    const body = await (await invoke(robots)).text();
    expect(body).toContain(`Host: ${new URL(siteConfig.url).host}`);
    expect(body).not.toMatch(/^Host: https?:/m);
  });

  it("does not Disallow the PDFs", async () => {
    // Deliberate: a blocked URL is never fetched, so the crawler never sees the
    // X-Robots-Tag noindex and can still list the URL. The header is the
    // control; a Disallow here would defeat it.
    const body = await (await invoke(robots)).text();
    expect(body).not.toContain("Disallow");
  });
});

describe("manifest.webmanifest", () => {
  it("is valid JSON served with the manifest content type", async () => {
    const res = await invoke(manifest);
    expect(res.headers.get("content-type")).toContain(
      "application/manifest+json",
    );
    expect(() => JSON.parse("")).toThrow();
    await expect(res.json()).resolves.toBeTypeOf("object");
  });

  it("takes its identity from siteConfig", async () => {
    const body = await (await invoke(manifest)).json();
    expect(body.name).toContain(siteConfig.name);
    expect(body.short_name).toBe(siteConfig.shortName);
    expect(body.description).toBe(siteConfig.description);
  });

  it("declares both an any and a maskable icon", async () => {
    // Android crops a non-maskable icon into its shape; without the maskable
    // entry the installed icon gets its corners cut off.
    const body = await (await invoke(manifest)).json();
    const purposes = body.icons.map((i: { purpose?: string }) => i.purpose);
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");
  });
});
