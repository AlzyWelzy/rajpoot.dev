import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";
import manifest from "./manifest";
import { GET as getLlmsTxt } from "./llms.txt/route";
import { siteConfig } from "@/lib/seo";
import { llmsTxt } from "@/lib/llms-txt";

describe("robots.txt", () => {
  it("allows everything and points at the sitemap", () => {
    const result = robots();
    expect(result.rules).toEqual([{ userAgent: "*", allow: "/" }]);
    expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    // host must be a bare hostname, not a URL.
    expect(result.host).toBe(new URL(siteConfig.url).host);
    expect(String(result.host)).not.toContain("https://");
  });
});

describe("sitemap.xml", () => {
  it("lists exactly the canonical homepage with content-derived lastmod", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      url: siteConfig.url,
      lastModified: siteConfig.lastUpdated,
      priority: 1,
    });
  });
});

describe("web app manifest", () => {
  it("carries the site identity and at least one maskable icon", () => {
    const result = manifest();
    expect(result.name).toContain(siteConfig.name);
    expect(result.short_name).toBe(siteConfig.shortName);
    expect(result.start_url).toBe("/");
    expect(
      result.icons?.some((i) => String(i.purpose).includes("maskable")),
    ).toBe(true);
  });
});

describe("llms.txt route", () => {
  it("serves the rendered file as noindexed UTF-8 text", async () => {
    const res = getLlmsTxt();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(await res.text()).toBe(llmsTxt());
  });
});
