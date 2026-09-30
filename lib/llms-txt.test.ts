import { describe, expect, it } from "vitest";

import { llmsTxt } from "./llms-txt";
import { siteConfig } from "./seo";
import { contactTool, experiencesData, projectsData } from "./data";

const body = llmsTxt();
const links = [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({
  text: m[1]!,
  href: m[2]!,
}));

describe("llms.txt", () => {
  it("passes Lighthouse's llms.txt audit checks", () => {
    // The audit's own three tests, verbatim (core/audits/agentic/llms-txt.js).
    expect(body).toMatch(/^\s*#\s+.+/m);
    expect(body).toMatch(/\[.+\]\(.+\)/);
    expect(body.length).toBeGreaterThanOrEqual(50);
  });

  it("follows the llmstxt.org layout: one H1, then a blockquote summary", () => {
    const lines = body.split("\n").filter(Boolean);
    expect(lines[0]).toBe(`# ${siteConfig.name}`);
    expect(lines[1]).toBe(`> ${siteConfig.description}`);
    expect(body.match(/^# /gm)).toHaveLength(1);
    // "Optional" is the spec's name for skippable links, and it goes last.
    const h2s = body.match(/^## .+$/gm);
    expect(h2s?.at(-1)).toBe("## Optional");
  });

  it("links only to absolute URLs, since it is read detached from the site", () => {
    expect(links.length).toBeGreaterThan(0);
    for (const { href } of links) {
      expect(href).toMatch(/^(https:\/\/|mailto:)/);
    }
  });

  it("covers every experience entry and project the page renders", () => {
    const texts = links.map((l) => l.text);
    for (const { title } of [...experiencesData, ...projectsData]) {
      expect(texts).toContain(title);
    }
  });

  it("takes identity from the site config rather than restating it", () => {
    expect(links).toContainEqual({
      text: "Email",
      href: `mailto:${siteConfig.email}`,
    });
    expect(links).toContainEqual({
      text: "Résumé (PDF)",
      href: `${siteConfig.url}/resume`,
    });
    expect(body).toContain(`\`${contactTool.name}\``);
  });

  it("renders cleanly, with no stray blank lines or unset values", () => {
    expect(body.endsWith("\n")).toBe(true);
    expect(body).not.toMatch(/\n{3,}/);
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
  });
});
