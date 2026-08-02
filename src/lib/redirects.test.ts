import { describe, expect, it } from "vitest";

import { SHORTLINKS, resolveShortlink } from "./redirects";
import { siteConfig } from "./seo";

describe("resolveShortlink", () => {
  it("resolves every declared shortlink", () => {
    for (const [path, destination] of Object.entries(SHORTLINKS)) {
      expect(resolveShortlink(path)).toBe(destination);
    }
  });

  it("tolerates a trailing slash", () => {
    expect(resolveShortlink("/github/")).toBe(siteConfig.github);
  });

  it("keeps the sub-path when forwarding to the blog", () => {
    expect(resolveShortlink("/blog/hello-world")).toBe(
      `${siteConfig.blog}/hello-world`,
    );
    expect(resolveShortlink("/blog/2026/01/a-post")).toBe(
      `${siteConfig.blog}/2026/01/a-post`,
    );
  });

  it("returns null for anything that isn't a shortlink", () => {
    expect(resolveShortlink("/")).toBeNull();
    expect(resolveShortlink("/resume")).toBeNull();
    expect(resolveShortlink("/api/contact")).toBeNull();
    expect(resolveShortlink("/definitely-not-a-real-page")).toBeNull();
  });

  it("does not hijack a path that merely starts with a shortlink name", () => {
    // /github-actions is not /github. Without the exact match this would
    // silently redirect a real future page off-site.
    expect(resolveShortlink("/github-actions")).toBeNull();
    expect(resolveShortlink("/blogroll")).toBeNull();
  });

  it("points every destination at an absolute https URL", () => {
    for (const destination of Object.values(SHORTLINKS)) {
      expect(new URL(destination).protocol).toBe("https:");
    }
  });

  it("takes the social destinations from siteConfig, not a second copy", () => {
    // These URLs are also rendered in the footer and in the JSON-LD `sameAs`
    // list. A shortlink that drifts from siteConfig sends visitors somewhere
    // the structured data doesn't claim as the same person.
    expect(SHORTLINKS["/linkedin"]).toBe(siteConfig.linkedin);
    expect(SHORTLINKS["/github"]).toBe(siteConfig.github);
    expect(SHORTLINKS["/twitter"]).toBe(siteConfig.twitterUrl);
    expect(SHORTLINKS["/blog"]).toBe(siteConfig.blog);
  });
});
