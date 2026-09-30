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

import { renderToString } from "react-dom/server";

import Contact from "./contact";
import SubmitBtn from "./submit-btn";
import { contactTool } from "@/lib/data";
import { siteConfig } from "@/lib/seo";

beforeEach(() => {
  sendEmailMock.mockReset();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  useFormStatusMock.mockReturnValue({ pending: false });
});

afterEach(cleanup);

function fillFields() {
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Test User" },
  });
  fireEvent.change(screen.getByLabelText("Your email"), {
    target: { value: "someone@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Your message"), {
    target: { value: "Hi there!" },
  });
}

function fillAndSubmit() {
  fillFields();
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
    expect(screen.getByLabelText("Your name")).toHaveValue("");
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
    expect(screen.getByLabelText("Your name")).toHaveValue("Test User");
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
    for (const label of ["Your name", "Your email", "Your message"]) {
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
    // Read-only keeps it out of the WebMCP tool schema, so an agent is never
    // offered the trap — while it is still submitted with the form.
    expect(honeypot.readOnly).toBe(true);
    expect(honeypot.disabled).toBe(false);
  });
});

/**
 * Dispatches a submit shaped like Chrome's WebMCP agent submission, including
 * its precondition that respondWith() is only accepted once default has been
 * prevented. Returns a getter for the promise the page responded with.
 */
function agentSubmit(form: HTMLFormElement) {
  const event = new Event("submit", { bubbles: true, cancelable: true });
  let response: Promise<unknown> | undefined;
  Object.defineProperties(event, {
    agentInvoked: { value: true },
    respondWith: {
      value: (promise: Promise<unknown>) => {
        if (!event.defaultPrevented) {
          throw new DOMException(
            "To call respondWith, you must first call preventDefault.",
            "InvalidStateError",
          );
        }
        response = promise;
      },
    },
  });
  fireEvent(form, event);
  return () => response;
}

describe("Contact form as a WebMCP tool", () => {
  function form() {
    return screen
      .getByRole("button", { name: /send message/i })
      .closest("form")!;
  }

  it("is annotated as a described tool, with every agent-fillable field described", () => {
    render(<Contact />);
    const el = form();

    expect(el).toHaveAttribute("toolname", contactTool.name);
    expect(el.getAttribute("tooldescription")).toContain(siteConfig.name);
    // Human confirmation is deliberate: this sends a message to a person.
    expect(el).not.toHaveAttribute("toolautosubmit");

    // Mirrors the schema Chrome builds: named, editable, non-hidden controls.
    const params = Array.from(
      el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[name]:not([type=hidden]), textarea[name]",
      ),
    ).filter((c) => !c.readOnly && !c.disabled);

    expect(params.map((c) => c.name)).toEqual([
      "senderName",
      "senderEmail",
      "message",
    ]);
    for (const control of params) {
      expect(control.getAttribute("toolparamdescription")).toBe(
        contactTool.params[control.name as keyof typeof contactTool.params],
      );
    }
  });

  it("ships its annotations in the server HTML, so the parser applies them together", () => {
    // Added client-side one at a time, each intermediate state (a name with
    // no description) is reported by Chrome as a schema issue.
    const html = renderToString(<Contact />);
    expect(html).toContain(`toolname="${contactTool.name}"`);
    expect(html).toContain("tooldescription=");
  });

  it("answers an agent submission with the result, sending exactly once", async () => {
    sendEmailMock.mockResolvedValue({ data: { id: "email_1" } });
    render(<Contact />);
    fillFields();

    const response = agentSubmit(form());

    await expect(response()).resolves.toEqual({ sent: true });
    // React's own form-action path must not fire a second send.
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const sent = sendEmailMock.mock.calls[0]![0] as FormData;
    expect(sent.get("senderEmail")).toBe("someone@example.com");
    // The visitor sees the same outcome as a manual submit.
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });

  it("reports a failed send to the agent instead of claiming success", async () => {
    sendEmailMock.mockResolvedValue({
      error: "Verification failed. Please try again.",
    });
    render(<Contact />);
    fillFields();

    const response = agentSubmit(form());

    await expect(response()).resolves.toEqual({
      sent: false,
      error: "Verification failed. Please try again.",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Verification failed",
    );
  });

  it("leaves human submissions on React's normal action path", async () => {
    sendEmailMock.mockResolvedValue({ data: { id: "email_1" } });
    render(<Contact />);
    fillFields();

    const event = new Event("submit", { bubbles: true, cancelable: true });
    fireEvent(form(), event);

    await waitFor(() => expect(sendEmailMock).toHaveBeenCalledTimes(1));
    expect(event.defaultPrevented).toBe(true);
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
