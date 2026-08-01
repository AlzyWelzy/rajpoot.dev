import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("motion/react", async () =>
  (await import("@/test-utils/mocks")).motionMock(),
);

const { setActiveSection } = vi.hoisted(() => ({
  setActiveSection: vi.fn(),
}));

// Drive the observer directly so both branches of the spy are exercised.
const state = { inView: true };
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: state.inView }),
}));

vi.mock("@/context/active-section-context", () => ({
  useActiveSectionContext: () => ({
    setActiveSection,
    isNavigating: () => false,
    activeSection: "Home",
  }),
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import SectionSpy from "./section-spy";

afterEach(() => {
  cleanup();
  setActiveSection.mockReset();
  state.inView = true;
});

describe("SectionSpy", () => {
  it("renders a plain section and reports itself active when in view", () => {
    render(
      <SectionSpy section="About" id="about" aria-label="About">
        <p>content</p>
      </SectionSpy>,
    );

    const section = screen.getByLabelText("About");
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveAttribute("id", "about");
    // Focusable programmatically (nav + skip link) but not in the tab order.
    expect(section).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(setActiveSection).toHaveBeenCalledWith("About");
  });

  it("does not claim the active section while out of view", () => {
    state.inView = false;
    render(
      <SectionSpy section="Skills" id="skills" aria-label="Skills">
        <p>content</p>
      </SectionSpy>,
    );
    expect(setActiveSection).not.toHaveBeenCalled();
  });

  it("still renders a section when the reveal animation is enabled", () => {
    render(
      <SectionSpy
        section="Projects"
        id="projects"
        aria-label="Projects"
        reveal
        className="custom"
      >
        <p>revealed</p>
      </SectionSpy>,
    );
    const section = screen.getByLabelText("Projects");
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("custom");
    expect(screen.getByText("revealed")).toBeInTheDocument();
  });
});
