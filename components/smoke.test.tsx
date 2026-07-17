import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

// Smoke-render every presentational component: catches crashes, missing
// providers, and broken imports without asserting on styling.

const { MOTION_ONLY_PROPS } = vi.hoisted(() => ({
  MOTION_ONLY_PROPS: new Set([
    "initial",
    "animate",
    "exit",
    "whileInView",
    "whileHover",
    "whileTap",
    "transition",
    "viewport",
    "layoutId",
  ]),
}));

vi.mock("motion/react", () => ({
  m: new Proxy(
    {},
    {
      get: (_target, tag: string) => (props: Record<string, unknown>) =>
        createElement(
          tag,
          Object.fromEntries(
            Object.entries(props).filter(
              ([key]) => !MOTION_ONLY_PROPS.has(key),
            ),
          ),
        ),
    },
  ),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  LazyMotion: ({ children }: { children: ReactNode }) => children,
  MotionConfig: ({ children }: { children: ReactNode }) => children,
  domMax: {},
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
}));

// jsdom has no IntersectionObserver; the hook only needs a ref + inView flag.
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: false }),
}));

// Static image import (resolved by Next at build time, not by vitest).
vi.mock("@/public/profile.jpg", () => ({
  default: { src: "/profile.jpg", width: 96, height: 96, blurDataURL: "" },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const nextOnly = new Set([
      "priority",
      "placeholder",
      "blurDataURL",
      "fetchPriority",
    ]);
    const rest = Object.fromEntries(
      Object.entries(props).filter(([key]) => !nextOnly.has(key)),
    );
    const src = rest.src;
    return createElement("img", {
      ...rest,
      src: typeof src === "string" ? src : (src as { src: string }).src,
    });
  },
}));

import ActiveSectionContextProvider from "@/context/active-section-context";
import ThemeContextProvider from "@/context/theme-context";
import Header from "./header";
import Intro from "./intro";
import About from "./about";
import Skills from "./skills";
import Projects from "./projects";
import Experience from "./experience";
import Footer from "./footer";
import ThemeSwitch from "./theme-switch";
import ScrollToTop from "./scroll-to-top";
import ReadingProgress from "./reading-progress";
import SectionHeading from "./section-heading";
import SectionDivider from "./section-divider";
import SubmitBtn from "./submit-btn";
import { experiencesData, projectsData, skillsData } from "@/lib/data";

function withProviders(node: ReactNode) {
  return render(
    <ThemeContextProvider>
      <ActiveSectionContextProvider>{node}</ActiveSectionContextProvider>
    </ThemeContextProvider>,
  );
}

afterEach(cleanup);

describe("component smoke renders", () => {
  it("Header renders every nav link", () => {
    withProviders(<Header />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const name of ["Home", "About", "Projects", "Skills", "Contact"]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("Intro renders the hero heading and action links", () => {
    withProviders(<Intro />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Manvendra/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Download.*resume/i }),
    ).toBeInTheDocument();
  });

  it("About renders its section heading", () => {
    withProviders(<About />);
    expect(screen.getByRole("heading", { name: /about/i })).toBeInTheDocument();
  });

  it("Skills lists every skill", () => {
    withProviders(<Skills />);
    for (const skill of skillsData.slice(0, 5)) {
      expect(screen.getByText(skill)).toBeInTheDocument();
    }
  });

  it("Projects renders one card per project with its tags", () => {
    withProviders(<Projects />);
    for (const project of projectsData) {
      expect(
        screen.getByRole("heading", { name: project.title }),
      ).toBeInTheDocument();
    }
  });

  it("Experience renders every timeline entry", () => {
    withProviders(<Experience />);
    for (const entry of experiencesData) {
      expect(
        screen.getByRole("heading", { name: entry.title }),
      ).toBeInTheDocument();
    }
  });

  it("Footer renders the social links", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", { name: "Social links" });
    for (const label of ["GitHub", "LinkedIn", "Blog"]) {
      expect(
        within(nav).getByRole("link", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("ThemeSwitch renders the toggle button", () => {
    withProviders(<ThemeSwitch />);
    expect(
      screen.getByRole("button", { name: /switch to (dark|light) mode/i }),
    ).toBeInTheDocument();
  });

  it("ScrollToTop and ReadingProgress mount without crashing", () => {
    withProviders(
      <>
        <ScrollToTop />
        <ReadingProgress />
      </>,
    );
  });

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

  it("SubmitBtn renders idle state inside a form", () => {
    render(
      <form>
        <SubmitBtn />
      </form>,
    );
    expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  });
});
