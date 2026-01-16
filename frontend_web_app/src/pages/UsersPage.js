import React, { useEffect, useMemo, useState } from "react";
import { createApiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function validateUser({ email }) {
  const errors = {};
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = "Valid email required.";
  return errors;
}

/**
 * PUBLIC_INTERFACE
 * UsersPage provides user management UX.
 */
export default function UsersPage() {
  /** This is a public function. */
  const { token } = useAuth();
  const { pushToast, setLoading } = useUI();

  const api = useMemo(
    () =>
      createApiClient({
        getToken: () => token,
        onLoading: setLoading
      }),
    [token, setLoading]
  );

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", roleId: "" });
  const [errors, setErrors] = useState({});

  async function loadUsers() {
    const candidates = ["/users", "/api/users"];
    let lastErr = null;
    for (const path of candidates) {
      try {
        const data = await api.get(path);
        setUsers(normalizeList(data));
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Unable to load users.");
  }

  async function loadRoles() {
    const candidates = ["/roles", "/api/roles"];
    for (const path of candidates) {
      try {
        const data = await api.get(path);
        setRoles(normalizeList(data));
        return;
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    loadUsers().catch((e) => pushToast({ type: "error", title: "Failed to load users", description: e.message }));
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openInvite() {
    setInviteOpen(true);
    setInviteForm({ email: "", name: "", roleId: roles?.[0]?.id ? String(roles[0].id) : "" });
    setErrors({});
  }

  async function submitInvite() {
    const v = validateUser(inviteForm);
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      // Try invite/create endpoints
      const candidates = [
        { path: "/users/invite", body: inviteForm },
        { path: "/invite", body: inviteForm },
        { path: "/users", body: inviteForm }
      ];

      let created = null;
      let lastErr = null;
      for (const c of candidates) {
        try {
          created = await api.post(c.path, { body: c.body });
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!created) throw lastErr || new Error("Invite failed.");

      pushToast({ type: "success", title: "User invited/created" });
      setUsers((prev) => [created, ...prev].filter(Boolean));
      setInviteOpen(false);
    } catch (e) {
      pushToast({ type: "error", title: "Invite failed", description: e.message });
    }
  }

  async function updateUserRole(userId, roleId) {
    try {
      const body = { roleId };
      // common patterns: PUT /users/:id/role, PATCH /users/:id, POST /users/:id/roles
      const candidates = [
        () => api.put(`/users/${userId}/role`, { body }),
        () => api.patch(`/users/${userId}`, { body: { roleId } }),
        () => api.post(`/users/${userId}/roles`, { body: { roleId } })
      ];

      let updated = null;
      let lastErr = null;
      for (const fn of candidates) {
        try {
          updated = await fn();
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!updated) throw lastErr || new Error("Role update failed.");

      pushToast({ type: "success", title: "Role updated" });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      pushToast({ type: "error", title: "Update failed", description: e.message });
    }
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Users</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Invite users and manage role assignments.
          </div>
        </div>
        <div className="inline">
          <button className="btn btn-primary" onClick={openInvite}>
            + Invite / Create user
          </button>
        </div>
      </div>

      <div className="card card--padded">
        <table className="table" aria-label="Users table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Name</th>
              <th>Email</th>
              <th style={{ width: 260 }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? (
              users.map((u) => (
                <tr key={u.id ?? u.email}>
                  <td style={{ fontWeight: 800 }}>{u.name || "—"}</td>
                  <td className="muted">{u.email || "—"}</td>
                  <td>
                    <select
                      className="select"
                      value={u.roleId != null ? String(u.roleId) : ""}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      disabled={!u.id}
                    >
                      <option value="">Unassigned</option>
                      {roles.map((r) => (
                        <option key={r.id ?? r.name} value={String(r.id)}>
                          {r.name || `Role ${r.id}`}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {inviteOpen ? (
        <div className="card card--padded">
          <div className="card__header">
            <div>
              <h2 className="card__title">Invite / Create user</h2>
              <p className="card__subtitle">Creates an account or sends an invite depending on backend configuration.</p>
            </div>
            <div className="inline">
              <button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitInvite}>
                Submit
              </button>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label className="label" htmlFor="iname">
                Name
              </label>
              <input
                id="iname"
                className="input"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="iemail">
                Email *
              </label>
              <input
                id="iemail"
                className="input"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@company.com"
              />
              {errors.email ? <div className="error">{errors.email}</div> : null}
            </div>
          </div>

          <div className="field" style={{ maxWidth: 360 }}>
            <label className="label" htmlFor="irole">
              Initial role
            </label>
            <select
              id="irole"
              className="select"
              value={inviteForm.roleId}
              onChange={(e) => setInviteForm((f) => ({ ...f, roleId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {roles.map((r) => (
                <option key={r.id ?? r.name} value={String(r.id)}>
                  {r.name || `Role ${r.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
