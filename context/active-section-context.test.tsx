import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import ActiveSectionContextProvider, {
  useActiveSectionContext,
} from "./active-section-context";

// isNavigating is a ref read (not reactive state), so the probe samples it on
// demand into rendered output.
function Probe() {
  const { activeSection, beginNavigation, isNavigating } =
    useActiveSectionContext();
  const [sampled, setSampled] = useState("");
  return (
    <div>
      <output data-testid="active">{activeSection}</output>
      <output data-testid="navigating">{sampled}</output>
      <button onClick={beginNavigation}>begin</button>
      <button onClick={() => setSampled(String(isNavigating()))}>sample</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <ActiveSectionContextProvider>
      <Probe />
    </ActiveSectionContextProvider>,
  );
}

function sampleNavigating(): string {
  fireEvent.click(screen.getByRole("button", { name: "sample" }));
  return screen.getByTestId("navigating").textContent ?? "";
}

describe("ActiveSectionContextProvider", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts on Home and not navigating", () => {
    renderProbe();
    expect(screen.getByTestId("active")).toHaveTextContent("Home");
    expect(sampleNavigating()).toBe("false");
  });

  it("suppresses the scroll-spy after a nav click until scrollend", () => {
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "begin" }));
    expect(sampleNavigating()).toBe("true");

    // The browser signals the smooth scroll settled.
    fireEvent(window, new Event("scrollend"));
    expect(sampleNavigating()).toBe("false");
  });

  it("falls back to a 1s cap for browsers without scrollend (Safari)", () => {
    vi.useFakeTimers();
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "begin" }));
    expect(sampleNavigating()).toBe("true");

    vi.advanceTimersByTime(999);
    expect(sampleNavigating()).toBe("true");

    vi.advanceTimersByTime(1);
    expect(sampleNavigating()).toBe("false");
  });

  it("throws a clear error when the hook is used outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      /must be used within an ActiveSectionContextProvider/,
    );
  });
});
