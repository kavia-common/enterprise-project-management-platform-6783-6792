import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute gates child routes by authentication.
 */
export default function ProtectedRoute() {
  /** This is a public function. */
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="auth-wrap">
        <div className="card card--padded auth-card">
          <p className="muted">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
