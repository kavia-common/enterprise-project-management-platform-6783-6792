import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

/**
 * PUBLIC_INTERFACE
 * LoginPage renders the login form.
 */
export default function LoginPage() {
  /** This is a public function. */
  const { login } = useAuth();
  const { pushToast } = useUI();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!emailValid) return setFormError("Please enter a valid email address.");
    if (!password || password.length < 6) return setFormError("Password must be at least 6 characters.");

    setSubmitting(true);
    try {
      await login({ email, password });
      pushToast({ type: "success", title: "Welcome back", description: "Signed in successfully." });
      navigate("/projects");
    } catch (err) {
      pushToast({ type: "error", title: "Login failed", description: err.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card card--padded auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Access your projects, users, and permissions.</p>
        </div>

        <form onSubmit={onSubmit} className="stack">
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <div className="helper">Use your enterprise credentials.</div>
          </div>

          {formError ? <div className="error">{formError}</div> : null}

          <div className="inline" style={{ justifyContent: "space-between" }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <Link className="muted" to="/register">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
