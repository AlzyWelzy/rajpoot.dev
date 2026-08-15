import {
  toastState,
  dismissToast,
  subscribeToasts,
  type ToastItem,
} from "@/lib/stores/toast";

const region = document.getElementById("toast-region");

if (region) {
  const STYLES: Record<ToastItem["type"], string> = {
    success:
      "border-green-600/20 bg-green-50/95 text-green-800 dark:border-green-400/25 dark:bg-green-950/90 dark:text-green-300",
    error:
      "border-red-600/20 bg-red-50/95 text-red-800 dark:border-red-400/25 dark:bg-red-950/90 dark:text-red-300",
  };

  function build(item: ToastItem) {
    const el = document.createElement("div");
    el.dataset.toastId = String(item.id);
    el.setAttribute("role", "status");
    el.className = `pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${STYLES[item.type]}`;

    const text = document.createElement("span");
    text.className = "flex-1";
    text.textContent = item.message;

    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.className = "shrink-0 opacity-60 hover:opacity-100";
    close.textContent = "✕";
    close.addEventListener("click", () => dismissToast(item.id));

    el.appendChild(text);
    el.appendChild(close);
    return el;
  }

  // Reconcile keyed by id, so existing toasts aren't torn down and
  // re-animated whenever a sibling is added or removed.
  subscribeToasts((items) => {
    const live = new Set(items.map((i) => String(i.id)));

    for (const el of Array.from(region!.children) as HTMLElement[]) {
      const id = el.dataset.toastId;
      if (id && !live.has(id) && !el.dataset.leaving) {
        el.dataset.leaving = "true";
        el.addEventListener("animationend", () => el.remove(), {
          once: true,
        });
      }
    }

    for (const item of items) {
      const existing = region!.querySelector(
        `[data-toast-id="${item.id}"]`,
      ) as HTMLElement | null;
      if (!existing) region!.appendChild(build(item));
    }
  });

  // Render anything queued before this script ran.
  if (toastState.items.length > 0) {
    for (const item of toastState.items) region.appendChild(build(item));
  }
}
