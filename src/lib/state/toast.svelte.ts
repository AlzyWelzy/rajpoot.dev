/**
 * Minimal replacement for react-hot-toast. The site shows exactly two toasts —
 * contact-form success and contact-form failure — which never needed a
 * general-purpose notification library, its promise/custom/JSX surface, or the
 * ~5KB it cost in the bundle.
 */

export type ToastKind = "success" | "error";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

const DISMISS_AFTER_MS = 4000;

class ToastState {
  items = $state<Toast[]>([]);
  #nextId = 0;

  #push(kind: ToastKind, message: string) {
    const id = this.#nextId++;
    this.items.push({ id, kind, message });
    setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS);
    return id;
  }

  success(message: string) {
    return this.#push("success", message);
  }

  error(message: string) {
    return this.#push("error", message);
  }

  dismiss(id: number) {
    const index = this.items.findIndex((t) => t.id === id);
    if (index !== -1) this.items.splice(index, 1);
  }
}

export const toast = new ToastState();
