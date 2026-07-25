import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

// Verifies the client-side analytics events fire with the right names/payloads
// when a visitor interacts — the data a job search actually cares about (CV
// downloads, project opens, outbound social clicks).
const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@vercel/analytics", () => ({ track: trackMock }));

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
}));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: false }),
}));

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
import Intro from "./intro";
import Project from "./project";

function withProviders(node: ReactNode) {
  return render(
    <ThemeContextProvider>
      <ActiveSectionContextProvider>{node}</ActiveSectionContextProvider>
    </ThemeContextProvider>,
  );
}

afterEach(() => {
  cleanup();
  trackMock.mockReset();
});

describe("analytics events", () => {
  it("tracks a CV download and the contact CTA from the hero", () => {
    withProviders(<Intro />);

    fireEvent.click(screen.getByRole("link", { name: /download.*resume/i }));
    expect(trackMock).toHaveBeenCalledWith("cv_download");

    fireEvent.click(screen.getByRole("link", { name: /get in touch/i }));
    expect(trackMock).toHaveBeenCalledWith("cta_click", {
      cta: "get_in_touch",
    });
  });

  it("tracks hero social clicks tagged by network", () => {
    withProviders(<Intro />);

    fireEvent.click(screen.getByRole("link", { name: /linkedin/i }));
    expect(trackMock).toHaveBeenCalledWith("social_click", {
      network: "linkedin",
    });

    fireEvent.click(screen.getByRole("link", { name: /github/i }));
    expect(trackMock).toHaveBeenCalledWith("social_click", {
      network: "github",
    });
  });

  it("tracks project link clicks with project name and target", () => {
    render(
      <Project
        title="Demo Project"
        description="A demo."
        tags={["Python"]}
        liveUrl="https://example.dev"
        githubUrl="https://github.com/x/demo"
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: /open demo project/i }));
    expect(trackMock).toHaveBeenCalledWith("project_click", {
      project: "Demo Project",
      target: "live",
    });

    fireEvent.click(
      screen.getByRole("link", { name: /demo project source code/i }),
    );
    expect(trackMock).toHaveBeenCalledWith("project_click", {
      project: "Demo Project",
      target: "github",
    });
  });
});
