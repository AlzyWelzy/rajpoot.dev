import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// The testimonials section changes shape with the data it is given: nothing at
// all when empty, one featured quote for a single endorsement, a card grid for
// two or more. Each of those is a real editorial decision, so each is tested.

vi.mock("motion/react", async () =>
  (await import("@/test-utils/mocks")).motionMock(),
);

import Testimonial from "./testimonial";

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.doUnmock("@/lib/data");
});

/** Import Testimonials fresh against a mocked testimonialsData. */
async function renderWithData(testimonialsData: unknown[]) {
  vi.doMock("@/lib/data", () => ({ testimonialsData }));
  const { default: Testimonials } = await import("./testimonials");
  return render(<Testimonials />);
}

describe("Testimonials — by number of endorsements", () => {
  it("renders nothing at all when there are none", async () => {
    const { container } = await renderWithData([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("features a single endorsement as one centered quote", async () => {
    await renderWithData([
      {
        quote: "Great work.",
        author: "Ref",
        title: "Lead · Co",
        source: "LinkedIn",
        sourceUrl: "https://linkedin.com/in/ref",
      },
    ]);
    expect(screen.getByRole("figure")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /LinkedIn/i })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/ref",
    );
  });

  it("switches to a card grid at two or more", async () => {
    await renderWithData([
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
    ]);
    expect(
      screen.getByRole("heading", { name: /what people say/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
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
