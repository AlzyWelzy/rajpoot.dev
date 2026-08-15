import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toastState, toast, dismissToast, subscribeToasts } from "./toast";

beforeEach(() => {
  toastState.items.splice(0, toastState.items.length);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("toast store", () => {
  it("pushes a success toast with an incrementing id", () => {
    toast.success("Email sent");

    expect(toastState.items).toHaveLength(1);
    expect(toastState.items[0]).toMatchObject({
      type: "success",
      message: "Email sent",
    });
  });

  it("pushes an error toast", () => {
    toast.error("Something broke");

    expect(toastState.items[0]).toMatchObject({
      type: "error",
      message: "Something broke",
    });
  });

  it("dismisses a toast by id", () => {
    toast.success("First");
    toast.success("Second");
    const firstId = toastState.items[0]?.id as number;

    dismissToast(firstId);

    expect(toastState.items).toHaveLength(1);
    expect(toastState.items[0]?.message).toBe("Second");
  });

  it("dismissing an id that isn't present is a no-op", () => {
    toast.success("Only one");

    dismissToast(9999);

    expect(toastState.items).toHaveLength(1);
  });

  it("auto-dismisses after 4 seconds", () => {
    toast.success("Will fade");
    expect(toastState.items).toHaveLength(1);

    vi.advanceTimersByTime(4000);

    expect(toastState.items).toHaveLength(0);
  });

  it("notifies subscribers on push and dismiss, and stops after unsubscribe", () => {
    let calls = 0;
    const unsubscribe = subscribeToasts(() => calls++);

    toast.success("One");
    expect(calls).toBe(1);

    dismissToast(toastState.items[0]!.id);
    expect(calls).toBe(2);

    // Dismissing an absent id changes nothing, so it must not notify.
    dismissToast(9999);
    expect(calls).toBe(2);

    unsubscribe();
    toast.error("Two");
    expect(calls).toBe(2);
  });
});
