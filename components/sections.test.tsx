import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

// Every content section renders the data it is given. These are the tests that
// catch a broken import, a missing provider, or a data field that stopped
// reaching the page — not styling.

vi.mock("motion/react", async () =>
  (await import("@/test-utils/mocks")).motionMock(),
);
vi.mock("react-intersection-observer", async () =>
  (await import("@/test-utils/mocks")).intersectionObserverMock(),
);
vi.mock("next/image", async () =>
  (await import("@/test-utils/mocks")).nextImageMock(),
);
vi.mock("@/public/profile.jpg", async () =>
  (await import("@/test-utils/mocks")).profileImageMock(),
);

import ActiveSectionContextProvider from "@/context/active-section-context";
import ThemeContextProvider from "@/context/theme-context";
import Header from "./header";
import Intro from "./intro";
import About from "./about";
import Skills from "./skills";
import Projects from "./projects";
import Experience from "./experience";
import Testimonials from "./testimonials";
import Footer from "./footer";
import SectionHeading from "./section-heading";
import SectionDivider from "./section-divider";
import {
  experiencesData,
  links,
  projectsData,
  skillsData,
  testimonialsData,
} from "@/lib/data";

function withProviders(node: ReactNode) {
  return render(
    <ThemeContextProvider>
      <ActiveSectionContextProvider>{node}</ActiveSectionContextProvider>
    </ThemeContextProvider>,
  );
}

afterEach(cleanup);

describe("Header", () => {
  it("renders a link for every configured nav entry", () => {
    withProviders(<Header />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const link of links) {
      expect(
        within(nav).getByRole("link", { name: link.name }),
      ).toBeInTheDocument();
    }
  });
});

describe("Intro", () => {
  it("renders the hero heading and the primary actions", () => {
    withProviders(<Intro />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Manvendra/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Download.*resume/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /get in touch/i }),
    ).toBeInTheDocument();
  });
});

describe("About", () => {
  it("renders its heading and links onward to the contact section", () => {
    withProviders(<About />);
    expect(screen.getByRole("heading", { name: /about/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /backend and full-stack roles/i }),
    ).toHaveAttribute("href", "#contact");
  });
});

describe("Skills", () => {
  it("lists every configured skill", () => {
    withProviders(<Skills />);
    for (const skill of skillsData) {
      expect(screen.getByText(skill)).toBeInTheDocument();
    }
  });
});

describe("Projects", () => {
  it("renders one card per project, with its tags", () => {
    withProviders(<Projects />);
    for (const project of projectsData) {
      expect(
        screen.getByRole("heading", { name: project.title }),
      ).toBeInTheDocument();
      const tags = screen.getByRole("list", {
        name: `Technologies used in ${project.title}`,
      });
      for (const tag of project.tags) {
        expect(within(tags).getByText(tag)).toBeInTheDocument();
      }
    }
  });
});

describe("Experience", () => {
  it("renders every timeline entry with its dates", () => {
    withProviders(<Experience />);
    for (const entry of experiencesData) {
      expect(
        screen.getByRole("heading", { name: entry.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(entry.date)).toBeInTheDocument();
    }
  });
});

describe("Testimonials", () => {
  it("renders each configured endorsement with its author", () => {
    withProviders(<Testimonials />);
    expect(
      screen.getByRole("heading", { name: /what people say/i }),
    ).toBeInTheDocument();
    for (const testimonial of testimonialsData) {
      expect(screen.getByText(testimonial.author)).toBeInTheDocument();
    }
  });
});

describe("Footer", () => {
  it("renders the social links and the current year", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", { name: "Social links" });
    for (const label of ["GitHub", "LinkedIn", "Blog", "Email"]) {
      expect(
        within(nav).getByRole("link", { name: label }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText(new RegExp(String(new Date().getFullYear()))),
    ).toBeInTheDocument();
  });
});

describe("shared section chrome", () => {
  it("SectionHeading and SectionDivider render", () => {
    render(
      <>
        <SectionHeading>Test heading</SectionHeading>
        <SectionDivider />
      </>,
    );
    expect(
      screen.getByRole("heading", { name: "Test heading" }),
    ).toBeInTheDocument();
  });
});
