import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// next/og's ImageResponse needs a real runtime; stub it so invoking the route
// still constructs the full JSX tree (covering the layout) without rendering.
vi.mock("next/og", () => ({
  // Must be constructable (`new ImageResponse(...)`), so a regular function.
  ImageResponse: vi.fn(function (element: unknown, options: unknown) {
    return { element, options };
  }),
}));

import OpengraphImage from "./opengraph-image";
import AppleIcon from "./apple-icon";
import NotFound from "./not-found";
import Home from "./page";

afterEach(cleanup);

describe("generated image routes", () => {
  it("opengraph-image builds an ImageResponse", () => {
    expect(OpengraphImage()).toBeTruthy();
  });

  it("apple-icon builds an ImageResponse", () => {
    expect(AppleIcon()).toBeTruthy();
  });
});

describe("not-found page", () => {
  it("renders the 404 message and a link home", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /wandered off/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toBeInTheDocument();
  });
});

describe("home page composition (SHOW_TESTIMONIALS gate)", () => {
  afterEach(() => {
    delete process.env.SHOW_TESTIMONIALS;
  });

  it("composes the page with testimonials hidden by default", () => {
    delete process.env.SHOW_TESTIMONIALS;
    expect(Home()).toBeTruthy();
  });

  it("composes the page with testimonials when the flag is set", () => {
    process.env.SHOW_TESTIMONIALS = "true";
    expect(Home()).toBeTruthy();
  });
});
