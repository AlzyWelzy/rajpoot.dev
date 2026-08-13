export type ToastItem = {
  id: number;
  type: "success" | "error";
  message: string;
};

export const toastState = $state<{ items: ToastItem[] }>({ items: [] });

let nextId = 0;

function push(type: ToastItem["type"], message: string) {
  const id = nextId++;
  toastState.items.push({ id, type, message });
  setTimeout(() => dismissToast(id), 4000);
}

export function dismissToast(id: number) {
  const index = toastState.items.findIndex((t) => t.id === id);
  if (index !== -1) toastState.items.splice(index, 1);
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};
