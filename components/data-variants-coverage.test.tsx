import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";

vi.mock("motion/react", () => ({
  m: new Proxy(
    {},
    {
      get: (_target, tag: string) => (props: Record<string, unknown>) => {
        const STRIP = new Set([
          "initial",
          "animate",
          "exit",
          "whileInView",
          "whileHover",
          "whileTap",
          "transition",
          "viewport",
          "layoutId",
        ]);
        return createElement(
          tag,
          Object.fromEntries(
            Object.entries(props).filter(([key]) => !STRIP.has(key)),
          ),
        );
      },
    },
  ),
}));

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.doUnmock("@/lib/data");
});

describe("JsonLd — project without a live URL", () => {
  it("omits the url field for that project", async () => {
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
    const { default: JsonLd } = await import("./json-ld");
    const { container } = render(<JsonLd />);
    const graph = JSON.parse(container.querySelector("script")!.textContent!);
    const project = graph["@graph"].find(
      (n: { name?: string }) => n.name === "OSS Lib",
    );
    expect(project).toBeTruthy();
    expect(project.url).toBeUndefined();
    expect(project.codeRepository).toBe("https://github.com/x/oss");
  });
});

describe("Testimonials — data variants", () => {
  it("renders nothing when there are no testimonials", async () => {
    vi.doMock("@/lib/data", () => ({ testimonialsData: [] }));
    const { default: Testimonials } = await import("./testimonials");
    const { container } = render(<Testimonials />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links the source in the featured single-quote layout", async () => {
    vi.doMock("@/lib/data", () => ({
      testimonialsData: [
        {
          quote: "Great work.",
          author: "Ref",
          title: "Lead · Co",
          source: "LinkedIn",
          sourceUrl: "https://linkedin.com/in/ref",
        },
      ],
    }));
    const { default: Testimonials } = await import("./testimonials");
    render(<Testimonials />);
    expect(screen.getByRole("link", { name: /LinkedIn/i })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/ref",
    );
  });
});
