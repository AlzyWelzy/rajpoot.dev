import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import JsonLd from "./json-ld";
import { projectsData } from "@/lib/data";
import { siteConfig } from "@/lib/seo";

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.doUnmock("@/lib/data");
});

type Node = Record<string, unknown> & { "@type"?: string; name?: string };

function renderScript() {
  const { container } = render(<JsonLd />);
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script?.textContent) throw new Error("JSON-LD script not rendered");
  return script as HTMLScriptElement;
}

function renderGraph() {
  return JSON.parse(renderScript().textContent!) as {
    "@context": string;
    "@graph": Node[];
  };
}

describe("JsonLd structured data", () => {
  it("emits a schema.org @graph with Person, WebSite and ProfilePage", () => {
    const graph = renderGraph();
    expect(graph["@context"]).toBe("https://schema.org");
    const types = graph["@graph"].map((n) => n["@type"]);
    expect(types).toContain("Person");
    expect(types).toContain("WebSite");
    expect(types).toContain("ProfilePage");
  });

  it("carries the Person identity and freshness date from siteConfig", () => {
    const graph = renderGraph();
    const person = graph["@graph"].find((n) => n["@type"] === "Person");
    const profile = graph["@graph"].find((n) => n["@type"] === "ProfilePage");
    expect(person?.name).toBe(siteConfig.name);
    expect(person?.email).toBe(`mailto:${siteConfig.email}`);
    expect(profile?.dateModified).toBe(siteConfig.lastUpdated);
  });

  it("emits one node per project, each matching a project title", () => {
    const graph = renderGraph();
    const projectNodes = graph["@graph"].filter(
      (n) =>
        n["@type"] === "SoftwareSourceCode" || n["@type"] === "CreativeWork",
    );
    expect(projectNodes).toHaveLength(projectsData.length);
    for (const p of projectsData) {
      expect(projectNodes.some((n) => n.name === p.title)).toBe(true);
    }
  });

  it("escapes angle brackets so a value can't close the script early", () => {
    // The serialized content must contain no raw "<" (each is written as <).
    expect(renderScript().innerHTML).not.toContain("<");
  });

  it("omits url for a project that has no live link, keeping codeRepository", async () => {
    vi.doMock("@/lib/data", () => ({
      skillsData: ["Python", "Docker"],
      projectsData: [
        {
          title: "OSS Lib",
          description: "d",
          tags: ["Python"],
          githubUrl: "https://github.com/x/oss",
        },
      ],
    }));
    const { default: FreshJsonLd } = await import("./json-ld");
    const { container } = render(<FreshJsonLd />);
    const graph = JSON.parse(container.querySelector("script")!.textContent!);
    const project = graph["@graph"].find(
      (n: { name?: string }) => n.name === "OSS Lib",
    );
    expect(project.url).toBeUndefined();
    expect(project.codeRepository).toBe("https://github.com/x/oss");
    expect(project["@type"]).toBe("SoftwareSourceCode");
  });
});
