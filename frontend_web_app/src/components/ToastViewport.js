import React from "react";
import { useUI } from "../context/UIContext";

/**
 * PUBLIC_INTERFACE
 * ToastViewport renders app toasts.
 */
export default function ToastViewport() {
  /** This is a public function. */
  const { toasts, removeToast } = useUI();

  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          role={t.type === "error" ? "alert" : "status"}
        >
          <div className="inline" style={{ justifyContent: "space-between" }}>
            <p className="toast__title">{t.title}</p>
            <button className="btn btn-ghost" onClick={() => removeToast(t.id)} aria-label="Dismiss">
              ✕
            </button>
          </div>
          {t.description ? <p className="toast__desc">{t.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
