"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastType = "info" | "success" | "error";
type Toast = { id: string; message: string; type: ToastType };

const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((s) => [...s, { id, message, type }]);
    // auto remove
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 10000, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              minWidth: 200,
              padding: "10px 14px",
              borderRadius: 8,
              color: "white",
              background: t.type === "success" ? "#16a34a" : t.type === "error" ? "#dc2626" : "#374151",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              fontSize: 14,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;
