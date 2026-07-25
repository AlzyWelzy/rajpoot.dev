import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";

// Render m.* as plain elements (animation props stripped).
vi.mock("motion/react", () => ({
  m: new Proxy(
    {},
    {
      get: (_target, tag: string) => (props: Record<string, unknown>) => {
        const MOTION_ONLY = new Set([
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
            Object.entries(props).filter(([key]) => !MOTION_ONLY.has(key)),
          ),
        );
      },
    },
  ),
}));

// Two endorsements → exercises the card-grid path (>1 renders <Testimonial>
// cards instead of the single featured quote). The first has a verifiable
// link, the second a plain (source-less) footer.
vi.mock("@/lib/data", () => ({
  testimonialsData: [
    {
      quote: "First endorsement.",
      author: "Reviewer One",
      title: "Manager · Acme",
      source: "LinkedIn",
      sourceUrl: "https://linkedin.com/in/x",
    },
    {
      quote: "Second endorsement.",
      author: "Reviewer Two",
      title: "Lead · Beta",
    },
  ],
}));

import Testimonials from "./testimonials";
import Testimonial from "./testimonial";

afterEach(cleanup);

describe("Testimonials — multiple (card grid)", () => {
  it("renders one card per endorsement", () => {
    render(<Testimonials />);
    expect(
      screen.getByRole("heading", { name: /what people say/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reviewer One")).toBeInTheDocument();
    expect(screen.getByText("Reviewer Two")).toBeInTheDocument();
  });
});

describe("Testimonial card variants", () => {
  it("links the source when a sourceUrl is provided", () => {
    render(
      <Testimonial
        quote="Q."
        author="A"
        title="T"
        source="LinkedIn"
        sourceUrl="https://example.dev"
        index={2}
      />,
    );
    expect(screen.getByRole("link", { name: /LinkedIn/i })).toHaveAttribute(
      "href",
      "https://example.dev",
    );
  });

  it("shows a plain source tag when there is no sourceUrl", () => {
    render(
      <Testimonial quote="Q." author="B" title="T" source="Relieving letter" />,
    );
    expect(screen.getByText("Relieving letter")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders with no source tag and the default index", () => {
    render(<Testimonial quote="Q." author="C" title="T" />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });
});
