import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { createElement, type ReactNode } from "react";

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
    "variants",
    "custom",
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
}));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: false }),
}));

// Plain anchor so the click handler fires without an App Router context.
vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children: ReactNode;
  } & Record<string, unknown>) => createElement("a", props, children),
}));

import ThemeContextProvider from "@/context/theme-context";
import ActiveSectionContextProvider from "@/context/active-section-context";
import ThemeSwitch from "./theme-switch";
import ScrollToTop from "./scroll-to-top";
import MotionProvider from "./motion-provider";
import Header from "./header";
import Project from "./project";
import ContactFormEmail from "@/email/contact-form-email";

afterEach(cleanup);

describe("ThemeSwitch", () => {
  it("toggles label and pressed state between light and dark", () => {
    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>,
    );
    const btn = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(
      screen.getByRole("button", { name: /switch to light mode/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ScrollToTop", () => {
  it("appears past one viewport and scrolls to the top on click", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    render(<ScrollToTop />);
    expect(
      screen.queryByRole("button", { name: /scroll back to top/i }),
    ).not.toBeInTheDocument();

    Object.defineProperty(window, "scrollY", {
      value: 2000,
      configurable: true,
    });
    fireEvent.scroll(window);

    fireEvent.click(
      screen.getByRole("button", { name: /scroll back to top/i }),
    );
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("MotionProvider", () => {
  it("renders its children", () => {
    render(
      <MotionProvider>
        <span>child</span>
      </MotionProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});

describe("Header navigation", () => {
  it("marks a link active on click", () => {
    render(
      <ActiveSectionContextProvider>
        <Header />
      </ActiveSectionContextProvider>,
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    fireEvent.click(within(nav).getByRole("link", { name: "Projects" }));
    // Re-query: the motion mock remounts the subtree, detaching the old node.
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "Projects" },
      ),
    ).toHaveAttribute("aria-current", "page");
  });
});

describe("Project without any links", () => {
  it("renders the card body but no action buttons", () => {
    render(
      <Project title="Solo" description="No links here." tags={["Bash"]} />,
    );
    expect(screen.getByRole("heading", { name: "Solo" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("ContactFormEmail template", () => {
  it("builds an element tree from the message and sender", () => {
    expect(
      ContactFormEmail({ message: "Hello there", senderEmail: "a@b.com" }),
    ).toBeTruthy();
  });
});
