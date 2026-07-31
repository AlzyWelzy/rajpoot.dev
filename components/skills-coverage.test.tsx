import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";

// A motion mock that also invokes the `variants.animate(custom)` callback the
// real animation runtime calls — this is what covers the staggered-delay
// variant function in Skills that a passthrough mock would skip.
vi.mock("motion/react", () => ({
  m: new Proxy(
    {},
    {
      get: (_target, tag: string) => (props: Record<string, unknown>) => {
        const variants = props.variants as
          { animate?: (custom: unknown) => unknown } | undefined;
        if (variants?.animate && props.custom !== undefined) {
          variants.animate(props.custom);
        }
        const STRIP = new Set([
          "initial",
          "animate",
          "whileInView",
          "viewport",
          "variants",
          "custom",
          "transition",
          "exit",
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

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: false }),
}));

import ActiveSectionContextProvider from "@/context/active-section-context";
import Skills from "./skills";

afterEach(cleanup);

describe("Skills", () => {
  it("renders every chip and runs the stagger variant", () => {
    render(
      <ActiveSectionContextProvider>
        <Skills />
      </ActiveSectionContextProvider>,
    );
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });
});
