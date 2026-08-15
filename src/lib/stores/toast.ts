export type ToastItem = {
  id: number;
  type: "success" | "error";
  message: string;
};

// `items` stays a plain mutable array (pushed/spliced in place) so callers and
// tests can read it directly; subscribers are notified explicitly after each
// mutation rather than relying on proxy interception.
export const toastState: { items: ToastItem[] } = { items: [] };

const subscribers = new Set<(items: ToastItem[]) => void>();

/** Fires after every push/dismiss. Returns an unsubscribe function. */
export function subscribeToasts(fn: (items: ToastItem[]) => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function emit() {
  for (const fn of subscribers) fn(toastState.items);
}

let nextId = 0;

function push(type: ToastItem["type"], message: string) {
  const id = nextId++;
  toastState.items.push({ id, type, message });
  emit();
  setTimeout(() => dismissToast(id), 4000);
}

export function dismissToast(id: number) {
  const index = toastState.items.findIndex((t) => t.id === id);
  if (index !== -1) {
    toastState.items.splice(index, 1);
    emit();
  }
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};
