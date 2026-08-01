import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

// The whole contact-form surface: submit outcomes, the keyboard shortcut, and
// the submit button's pending state.

const { sendEmailMock, toastMock, useFormStatusMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
  useFormStatusMock: vi.fn(),
}));

vi.mock("@/actions/sendEmail", () => ({ sendEmail: sendEmailMock }));
vi.mock("react-hot-toast", () => ({ default: toastMock }));
vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/hooks", () => ({ useSectionInView: () => ({ ref: () => {} }) }));
vi.mock("motion/react", async () =>
  (await import("@/test-utils/mocks")).motionMock(),
);

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, useFormStatus: useFormStatusMock };
});

import Contact from "./contact";
import SubmitBtn from "./submit-btn";

beforeEach(() => {
  sendEmailMock.mockReset();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  useFormStatusMock.mockReturnValue({ pending: false });
});

afterEach(cleanup);

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

describe("Contact form submission", () => {
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

  it("marks both fields invalid and described-by the error", async () => {
    sendEmailMock.mockResolvedValue({ error: "Invalid message" });
    render(<Contact />);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    for (const label of ["Your email", "Your message"]) {
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-describedby",
        "contact-error",
      );
    }
  });

  it("keeps a honeypot field that is hidden from assistive tech", () => {
    render(<Contact />);
    const honeypot = document.querySelector(
      'input[name="contact_reason_hp"]',
    ) as HTMLInputElement;
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
  });
});

describe("Contact form keyboard submit", () => {
  it("clicks submit on Ctrl/Cmd+Enter but not on a plain key", () => {
    render(<Contact />);
    const message = screen.getByLabelText("Your message");
    const submit = screen.getByRole("button", { name: /send message/i });
    const clickSpy = vi.spyOn(submit, "click");

    fireEvent.keyDown(message, { key: "a" });
    expect(clickSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(message, { key: "Enter", ctrlKey: true });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(message, { key: "Enter", metaKey: true });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});

describe("SubmitBtn", () => {
  it("shows the pending state while the form is submitting", () => {
    useFormStatusMock.mockReturnValue({ pending: true });
    render(
      <form>
        <SubmitBtn />
      </form>,
    );
    const btn = screen.getByRole("button", { name: /sending message/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("shows the idle state when not submitting", () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    render(
      <form>
        <SubmitBtn />
      </form>,
    );
    expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  });
});
