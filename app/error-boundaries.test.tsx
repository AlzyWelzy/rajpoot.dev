import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import ErrorBoundary from "./error";
import GlobalError from "./global-error";

afterEach(cleanup);

describe("error boundaries", () => {
  it("renders the route error UI and recovers via reset", () => {
    const reset = vi.fn();
    // The boundary logs the cause in an effect; keep test output clean.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: /hit an error/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it("renders the global fallback and recovers via reset", () => {
    const reset = vi.fn();
    // Also swallows React's <html>-in-<div> nesting warning for this render.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<GlobalError error={new Error("boom")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
