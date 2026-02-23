type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

type ToastListener = (toast: Toast) => void;

let listeners: ToastListener[] = [];
let nextId = 0;

export function showToast(type: ToastType, message: string) {
  const toast: Toast = { id: String(++nextId), type, message };
  listeners.forEach((fn) => fn(toast));
}

export function subscribeToast(fn: ToastListener) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export type { Toast, ToastType };
