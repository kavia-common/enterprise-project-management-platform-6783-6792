import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

/**
 * PUBLIC_INTERFACE
 * DashboardLayout provides the authenticated shell layout (sidebar + header).
 */
export default function DashboardLayout() {
  /** This is a public function. */
  const { user, logout } = useAuth();
  const { pushToast } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/projects")) return "Projects";
    if (location.pathname.startsWith("/users")) return "Users";
    if (location.pathname.startsWith("/roles")) return "Roles & Permissions";
    return "Dashboard";
  }, [location.pathname]);

  const displayName = user?.name || user?.email || "Account";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo" aria-hidden="true" />
          <div>
            <div className="sidebar__title">Enterprise PM</div>
            <div className="sidebar__subtitle">Ocean Professional</div>
          </div>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          <NavLink
            to="/projects"
            className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
          >
            <span aria-hidden="true">📁</span> Projects
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
          >
            <span aria-hidden="true">👤</span> Users
          </NavLink>
          <NavLink
            to="/roles"
            className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
          >
            <span aria-hidden="true">🛡️</span> Roles / Permissions
          </NavLink>
        </nav>

        <div style={{ marginTop: "auto", padding: "12px 10px" }}>
          <div className="card card--padded">
            <div style={{ fontWeight: 800, fontSize: 13 }}>Signed in</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {displayName}
            </div>
            <div className="inline" style={{ marginTop: 10 }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  pushToast({ type: "success", title: "Logged out", description: "See you next time." });
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header__left">
            <div className="header__title">{pageTitle}</div>
            <div className="header__crumb">/ {location.pathname}</div>
          </div>

          <div className="header__right">
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {displayName} ▾
              </button>

              {menuOpen ? (
                <div
                  className="card"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 240,
                    padding: 10
                  }}
                  role="menu"
                >
                  <div className="stack-sm">
                    <div className="muted" style={{ fontSize: 12 }}>
                      Session
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        pushToast({ type: "success", title: "Logged out" });
                        navigate("/login");
                      }}
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
