"use client";

import { useState, useEffect } from "react";
import { subscribeToast, type Toast } from "@/lib/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === "success"
              ? "bg-green-600 text-white"
              : t.type === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
