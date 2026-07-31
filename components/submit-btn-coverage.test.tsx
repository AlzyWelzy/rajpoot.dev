import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { useFormStatusMock } = vi.hoisted(() => ({
  useFormStatusMock: vi.fn(),
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, useFormStatus: useFormStatusMock };
});

import SubmitBtn from "./submit-btn";

afterEach(cleanup);

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
