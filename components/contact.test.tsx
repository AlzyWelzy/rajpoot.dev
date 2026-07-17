import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement } from "react";

const { sendEmailMock, toastMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/actions/sendEmail", () => ({ sendEmail: sendEmailMock }));
vi.mock("react-hot-toast", () => ({ default: toastMock }));

// Render m.* as plain elements: animation props stripped, no LazyMotion needed.
// vi.hoisted because the mock factory runs before this file's statements.
const { MOTION_ONLY_PROPS } = vi.hoisted(() => ({
  MOTION_ONLY_PROPS: new Set([
    "initial",
    "animate",
    "whileInView",
    "whileHover",
    "transition",
    "viewport",
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

// The scroll-spy hook needs the ActiveSectionContext; stub it out.
vi.mock("@/lib/hooks", () => ({
  useSectionInView: () => ({ ref: () => {} }),
}));

import Contact from "./contact";

describe("Contact form", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  function fillAndSubmit() {
    fireEvent.change(screen.getByLabelText("Your email"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Your message"), {
      target: { value: "Hi there!" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /send message/i }).closest("form")!,
    );
  }

  it("clears the fields and toasts success when sending works", async () => {
    sendEmailMock.mockResolvedValue({ data: { id: "email_1" } });
    render(<Contact />);

    fillAndSubmit();

    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(screen.getByLabelText("Your email")).toHaveValue("");
    expect(screen.getByLabelText("Your message")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves input, toasts and shows the error when sending fails", async () => {
    sendEmailMock.mockResolvedValue({ error: "Invalid sender email" });
    render(<Contact />);

    fillAndSubmit();

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Invalid sender email"),
    );
    // A failed submit must not wipe what the user typed.
    expect(screen.getByLabelText("Your email")).toHaveValue(
      "someone@example.com",
    );
    expect(screen.getByLabelText("Your message")).toHaveValue("Hi there!");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid sender email");
  });
});
