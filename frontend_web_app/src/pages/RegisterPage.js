import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

/**
 * PUBLIC_INTERFACE
 * RegisterPage renders the registration form.
 */
export default function RegisterPage() {
  /** This is a public function. */
  const { register } = useAuth();
  const { pushToast } = useUI();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!name || name.trim().length < 2) return setFormError("Please enter your name.");
    if (!emailValid) return setFormError("Please enter a valid email address.");
    if (!password || password.length < 8) return setFormError("Password must be at least 8 characters.");

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email, password });
      pushToast({ type: "success", title: "Account created", description: "You can now sign in." });
      navigate("/login");
    } catch (err) {
      pushToast({ type: "error", title: "Registration failed", description: err.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card card--padded auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started with enterprise project management.</p>
        </div>

        <form onSubmit={onSubmit} className="stack">
          <div className="field">
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          {formError ? <div className="error">{formError}</div> : null}

          <div className="inline" style={{ justifyContent: "space-between" }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </button>
            <Link className="muted" to="/login">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
