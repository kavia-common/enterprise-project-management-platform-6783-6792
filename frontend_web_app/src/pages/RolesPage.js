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

const DEFAULT_PERMISSIONS = [
  { key: "projects.read", label: "Projects: Read" },
  { key: "projects.write", label: "Projects: Write" },
  { key: "users.read", label: "Users: Read" },
  { key: "users.write", label: "Users: Write" },
  { key: "roles.read", label: "Roles: Read" },
  { key: "roles.write", label: "Roles: Write" }
];

/**
 * PUBLIC_INTERFACE
 * RolesPage manages roles and permissions mapping UX.
 */
export default function RolesPage() {
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

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const [rolePerms, setRolePerms] = useState({}); // key -> boolean
  const [assignUserId, setAssignUserId] = useState("");

  async function loadRoles() {
    const candidates = ["/roles", "/api/roles"];
    let lastErr = null;
    for (const path of candidates) {
      try {
        const data = await api.get(path);
        setRoles(normalizeList(data));
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Unable to load roles.");
  }

  async function loadUsers() {
    const candidates = ["/users", "/api/users"];
    for (const path of candidates) {
      try {
        const data = await api.get(path);
        setUsers(normalizeList(data));
        return;
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    loadRoles().catch((e) => pushToast({ type: "error", title: "Failed to load roles", description: e.message }));
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectRole(role) {
    setSelectedRole(role);
    setRolePerms({});

    // Best-effort load role permissions
    const candidates = [
      `/roles/${role.id}/permissions`,
      `/roles/${role.id}`,
      `/api/roles/${role.id}/permissions`
    ];
    for (const path of candidates) {
      try {
        const data = await api.get(path);
        const perms = data?.permissions || data?.perms || data;
        const list = normalizeList(perms);
        const next = {};
        for (const p of list) next[typeof p === "string" ? p : p.key || p.name] = true;
        setRolePerms(next);
        return;
      } catch {
        // ignore
      }
    }
  }

  async function savePermissions() {
    if (!selectedRole?.id) return;

    const keys = Object.entries(rolePerms)
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      const candidates = [
        () => api.put(`/roles/${selectedRole.id}/permissions`, { body: { permissions: keys } }),
        () => api.patch(`/roles/${selectedRole.id}`, { body: { permissions: keys } })
      ];

      let ok = false;
      let lastErr = null;
      for (const fn of candidates) {
        try {
          await fn();
          ok = true;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) throw lastErr || new Error("Save failed.");

      pushToast({ type: "success", title: "Permissions saved" });
    } catch (e) {
      pushToast({ type: "error", title: "Save failed", description: e.message });
    }
  }

  async function assignRoleToUser() {
    if (!selectedRole?.id || !assignUserId) return;

    try {
      const candidates = [
        () => api.post(`/users/${assignUserId}/roles`, { body: { roleId: selectedRole.id } }),
        () => api.put(`/users/${assignUserId}/role`, { body: { roleId: selectedRole.id } }),
        () => api.patch(`/users/${assignUserId}`, { body: { roleId: selectedRole.id } })
      ];

      let ok = false;
      let lastErr = null;
      for (const fn of candidates) {
        try {
          await fn();
          ok = true;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) throw lastErr || new Error("Assign failed.");

      pushToast({ type: "success", title: "Role assigned" });
    } catch (e) {
      pushToast({ type: "error", title: "Assign failed", description: e.message });
    }
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Roles & Permissions</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Manage access control across Projects and Users.
          </div>
        </div>
      </div>

      <div className="row">
        <div className="card card--padded">
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Roles</div>
          <div className="stack-sm">
            {roles.length ? (
              roles.map((r) => (
                <button
                  key={r.id ?? r.name}
                  className={`btn ${selectedRole?.id === r.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => selectRole(r)}
                  style={{ justifyContent: "space-between" }}
                >
                  <span>{r.name || `Role ${r.id}`}</span>
                  <span className="muted" style={{ fontWeight: 800 }}>
                    {r.id != null ? `#${r.id}` : ""}
                  </span>
                </button>
              ))
            ) : (
              <div className="muted">No roles found.</div>
            )}
          </div>
        </div>

        <div className="card card--padded">
          <div className="card__header">
            <div>
              <h2 className="card__title">{selectedRole ? `Role: ${selectedRole.name || selectedRole.id}` : "Select a role"}</h2>
              <p className="card__subtitle">Toggle permissions and assign the role to a user.</p>
            </div>
            <div className="inline">
              <button className="btn btn-primary" onClick={savePermissions} disabled={!selectedRole}>
                Save permissions
              </button>
            </div>
          </div>

          {selectedRole ? (
            <div className="stack">
              <div className="card card--padded">
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Permissions</div>
                <div className="stack-sm">
                  {DEFAULT_PERMISSIONS.map((p) => (
                    <label key={p.key} className="inline" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700 }}>{p.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(rolePerms[p.key])}
                        onChange={(e) => setRolePerms((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="card card--padded">
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Assign role to user</div>
                <div className="inline">
                  <select className="select" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
                    <option value="">Select user…</option>
                    {users.map((u) => (
                      <option key={u.id ?? u.email} value={String(u.id)}>
                        {u.email || u.name || u.id}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={assignRoleToUser} disabled={!assignUserId}>
                    Assign
                  </button>
                </div>
                <div className="helper">This uses common role assignment endpoints and will be finalized once backend routes are confirmed.</div>
              </div>
            </div>
          ) : (
            <div className="muted">Choose a role from the left to view and edit permissions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
