/**
 * The two toasts this site shows: contact-form success and contact-form
 * failure. react-hot-toast was ~5KB for exactly that.
 *
 * The live region itself is server-rendered (see Toaster.svelte) rather than
 * created here — a screen reader only announces changes to a region that was
 * already in the accessibility tree when the change happened, so injecting the
 * container and its first message together can go unannounced.
 */

const DISMISS_AFTER_MS = 4000;

export type ToastKind = "success" | "error";

const ICON: Record<ToastKind, { glyph: string; classes: string }> = {
  success: { glyph: "✓", classes: "bg-green-500" },
  error: { glyph: "!", classes: "bg-red-500" },
};

export function toast(kind: ToastKind, message: string) {
  const region = document.querySelector<HTMLElement>("[data-toaster]");
  if (!region) return;

  const item = document.createElement("div");
  item.className =
    "toast-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-white px-4 py-3 text-sm text-gray-900 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:text-white dark:ring-white/10";

  const badge = document.createElement("span");
  badge.setAttribute("aria-hidden", "true");
  badge.className = `flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${ICON[kind].classes}`;
  badge.textContent = ICON[kind].glyph;

  const text = document.createElement("span");
  // textContent, never innerHTML: the error strings come from the server.
  text.textContent = message;

  item.append(badge, text);
  region.append(item);

  setTimeout(() => item.remove(), DISMISS_AFTER_MS);
}
