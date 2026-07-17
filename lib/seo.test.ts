import { describe, expect, it } from "vitest";

import { siteConfig } from "./seo";
import { emailId } from "./data";

// siteConfig drives metadata, sitemap and JSON-LD; these invariants keep it
// from silently drifting apart from the visible site content.
describe("siteConfig consistency", () => {
  it("uses the same contact email as the visible site", () => {
    expect(siteConfig.email).toBe(emailId);
  });

  it("has an absolute https canonical url", () => {
    expect(new URL(siteConfig.url).protocol).toBe("https:");
  });

  it("has a parseable YYYY-MM-DD lastUpdated date", () => {
    expect(siteConfig.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(siteConfig.lastUpdated))).toBe(false);
  });

  it("keeps the employer entry complete for JSON-LD", () => {
    expect(siteConfig.employer.name.length).toBeGreaterThan(0);
    expect(new URL(siteConfig.employer.url).protocol).toBe("https:");
    expect(siteConfig.education.length).toBeGreaterThan(0);
  });
});
