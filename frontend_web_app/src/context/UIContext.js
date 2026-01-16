import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const UIContext = createContext(null);

let toastId = 0;

/**
 * PUBLIC_INTERFACE
 * UIProvider provides app-wide toast notifications and a global loading indicator.
 */
export function UIProvider({ children }) {
  /** This is a public function. */
  const [toasts, setToasts] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Avoid flicker: if many quick requests happen, keep the bar for a minimum time slice.
  const loadingTimer = useRef(null);

  const setLoading = useCallback((isLoading) => {
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }

    if (isLoading) {
      setGlobalLoading(true);
      return;
    }

    loadingTimer.current = setTimeout(() => setGlobalLoading(false), 150);
  }, []);

  const pushToast = useCallback((t) => {
    const id = ++toastId;
    const toast = {
      id,
      type: t.type || "info", // info | success | error
      title: t.title || (t.type === "error" ? "Error" : "Notice"),
      description: t.description || "",
      timeoutMs: t.timeoutMs ?? 4500
    };
    setToasts((prev) => [toast, ...prev]);

    if (toast.timeoutMs) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, toast.timeoutMs);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      removeToast,
      globalLoading,
      setLoading
    }),
    [toasts, pushToast, removeToast, globalLoading, setLoading]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * useUI returns UI helpers (toasts + global loading controls).
 */
export function useUI() {
  /** This is a public function. */
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}
