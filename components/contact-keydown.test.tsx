import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

vi.mock("@/actions/sendEmail", () => ({ sendEmail: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/hooks", () => ({ useSectionInView: () => ({ ref: () => {} }) }));
vi.mock("motion/react", () => ({
  m: new Proxy(
    {},
    {
      get: (_target, tag: string) => (props: Record<string, unknown>) => {
        const STRIP = new Set([
          "initial",
          "animate",
          "whileInView",
          "transition",
          "viewport",
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

import Contact from "./contact";

afterEach(cleanup);

describe("Contact — keyboard submit", () => {
  it("clicks submit on Ctrl/Cmd+Enter but not on a plain key", () => {
    render(<Contact />);
    const message = screen.getByLabelText("Your message");
    const submit = screen.getByRole("button", { name: /send message/i });
    const clickSpy = vi.spyOn(submit, "click");

    fireEvent.keyDown(message, { key: "a" });
    expect(clickSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(message, { key: "Enter", ctrlKey: true });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
