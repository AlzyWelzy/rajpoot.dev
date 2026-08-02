import { describe, expect, it } from "vitest";

import { projectsData, skillsData } from "./data";
import { buildJsonLd } from "./json-ld";
import { siteConfig } from "./seo";

type Node = Record<string, unknown> & { "@type": string; "@id"?: string };

const graph = JSON.parse(buildJsonLd())["@graph"] as Node[];
const byType = (type: string) => graph.filter((n) => n["@type"] === type);
const one = (type: string) => {
  const [node] = byType(type);
  expect(node, type).toBeDefined();
  return node!;
};

describe("buildJsonLd", () => {
  it("emits parseable JSON-LD with a schema.org context", () => {
    const parsed = JSON.parse(buildJsonLd());
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(Array.isArray(parsed["@graph"])).toBe(true);
  });

  it("escapes < so a value can never close the script tag early", () => {
    // The graph is injected through {@html} in the root layout.
    expect(buildJsonLd()).not.toContain("<");
  });
});

describe("the Person node", () => {
  const person = one("Person");

  it("takes its identity from siteConfig", () => {
    expect(person.name).toBe(siteConfig.name);
    expect(person.jobTitle).toBe(siteConfig.jobTitle);
    expect(person.email).toBe(`mailto:${siteConfig.email}`);
  });

  it("lists every social profile in sameAs", () => {
    // sameAs is how a search engine reconciles these profiles with this person;
    // a missing entry quietly breaks that association.
    expect(person.sameAs).toEqual(
      expect.arrayContaining([
        siteConfig.github,
        siteConfig.linkedin,
        siteConfig.twitterUrl,
        siteConfig.blog,
      ]),
    );
  });

  it("publishes the full skill list", () => {
    expect(person.knowsAbout).toEqual([...skillsData]);
  });
});

describe("node references", () => {
  it("resolves every @id reference to a node in the graph", () => {
    // The whole point of the single @graph is that ProfilePage.mainEntity,
    // WebSite.about and each project's author resolve to the one canonical
    // Person. A dangling @id makes the graph silently meaningless.
    const declared = new Set(graph.map((n) => n["@id"]).filter(Boolean));
    const referenced = [
      ...JSON.stringify(graph).matchAll(/\{"@id":"([^"]+)"\}/g),
    ].map((m) => m[1]);

    expect(referenced.length).toBeGreaterThan(0);
    for (const id of referenced) {
      expect(declared, `dangling @id: ${id}`).toContain(id);
    }
  });

  it("points ProfilePage at the Person and the WebSite", () => {
    const profile = one("ProfilePage");
    expect(profile.mainEntity).toEqual({ "@id": one("Person")["@id"] });
    expect(profile.isPartOf).toEqual({ "@id": one("WebSite")["@id"] });
  });

  it("dates the ProfilePage from content, not from the build", () => {
    expect(one("ProfilePage").dateModified).toBe(siteConfig.lastUpdated);
  });
});

describe("project nodes", () => {
  it("emits one node per project", () => {
    const projects = [
      ...byType("SoftwareSourceCode"),
      ...byType("CreativeWork"),
    ];
    expect(projects).toHaveLength(projectsData.length);
  });

  it("types a project with a repo as SoftwareSourceCode", () => {
    // The distinction is what earns the code-specific fields; a CreativeWork
    // with a codeRepository is not what search engines look for.
    const withRepo = projectsData.filter((p) => p.githubUrl);
    expect(byType("SoftwareSourceCode")).toHaveLength(withRepo.length);
    for (const node of byType("SoftwareSourceCode")) {
      expect(node.codeRepository).toBeTruthy();
      expect(node.programmingLanguage).toBeTruthy();
    }
  });

  it("attributes every project to the Person", () => {
    const personId = one("Person")["@id"];
    for (const node of [
      ...byType("SoftwareSourceCode"),
      ...byType("CreativeWork"),
    ]) {
      expect(node.author).toEqual({ "@id": personId });
    }
  });

  it("lists every project as a part of the ProfilePage", () => {
    const hasPart = one("ProfilePage").hasPart as { "@id": string }[];
    expect(hasPart).toHaveLength(projectsData.length);
  });
});
