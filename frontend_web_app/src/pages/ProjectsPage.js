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

function validateProject({ name }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  return errors;
}

/**
 * PUBLIC_INTERFACE
 * ProjectsPage provides CRUD UX for projects.
 */
export default function ProjectsPage() {
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

  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);

  const [mode, setMode] = useState("none"); // none | create | edit
  const [form, setForm] = useState({ name: "", description: "", status: "active" });
  const [errors, setErrors] = useState({});

  async function load() {
    // Try common project endpoints; the backend spec is minimal in this workspace.
    const candidates = ["/projects", "/api/projects"];
    let lastErr = null;
    for (const path of candidates) {
      try {
        const data = await api.get(path);
        setProjects(normalizeList(data));
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Unable to load projects.");
  }

  useEffect(() => {
    load().catch((e) => {
      pushToast({ type: "error", title: "Failed to load projects", description: e.message });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setMode("create");
    setSelected(null);
    setForm({ name: "", description: "", status: "active" });
    setErrors({});
  }

  function startEdit(p) {
    setMode("edit");
    setSelected(p);
    setForm({
      name: p?.name || "",
      description: p?.description || "",
      status: p?.status || "active"
    });
    setErrors({});
  }

  async function save() {
    const v = validateProject(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      if (mode === "create") {
        const created = await api.post("/projects", { body: form });
        pushToast({ type: "success", title: "Project created" });
        setProjects((prev) => [created, ...prev].filter(Boolean));
        setMode("none");
      } else if (mode === "edit" && selected?.id != null) {
        const updated = await api.put(`/projects/${selected.id}`, { body: form });
        pushToast({ type: "success", title: "Project updated" });
        setProjects((prev) => prev.map((p) => (p.id === selected.id ? updated : p)));
        setSelected(updated);
        setMode("none");
      }
    } catch (e) {
      pushToast({ type: "error", title: "Save failed", description: e.message });
    }
  }

  async function archiveOrDelete(p) {
    // Prefer archive if supported, fallback to delete.
    try {
      await api.patch(`/projects/${p.id}`, { body: { status: "archived" } });
      pushToast({ type: "success", title: "Project archived" });
      setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "archived" } : x)));
      return;
    } catch {
      // continue to delete attempt
    }

    try {
      await api.delete(`/projects/${p.id}`);
      pushToast({ type: "success", title: "Project deleted" });
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      if (selected?.id === p.id) setSelected(null);
    } catch (e) {
      pushToast({ type: "error", title: "Action failed", description: e.message });
    }
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Projects</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Create, edit, and archive enterprise projects.
          </div>
        </div>
        <div className="inline">
          <button className="btn btn-primary" onClick={startCreate}>
            + New project
          </button>
        </div>
      </div>

      <div className="card card--padded">
        <table className="table" aria-label="Projects table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Name</th>
              <th>Description</th>
              <th style={{ width: 140 }}>Status</th>
              <th style={{ width: 220 }} />
            </tr>
          </thead>
          <tbody>
            {projects.length ? (
              projects.map((p) => (
                <tr key={p.id ?? p.name}>
                  <td style={{ fontWeight: 800 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setSelected(p)}
                      style={{ padding: "6px 10px" }}
                    >
                      {p.name || "Untitled"}
                    </button>
                  </td>
                  <td className="muted">{p.description || "—"}</td>
                  <td>
                    <span className={`badge ${p.status === "archived" ? "badge--warning" : "badge--success"}`}>
                      {p.status || "active"}
                    </span>
                  </td>
                  <td>
                    <div className="inline">
                      <button className="btn btn-ghost" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => archiveOrDelete(p)}>
                        Archive/Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="muted">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(mode === "create" || mode === "edit") && (
        <div className="card card--padded">
          <div className="card__header">
            <div>
              <h2 className="card__title">{mode === "create" ? "Create project" : "Edit project"}</h2>
              <p className="card__subtitle">All fields are validated client-side before submitting.</p>
            </div>
            <div className="inline">
              <button className="btn btn-ghost" onClick={() => setMode("none")}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save}>
                Save
              </button>
            </div>
          </div>

          <div className="stack">
            <div className="field">
              <label className="label" htmlFor="pname">
                Name
              </label>
              <input
                id="pname"
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Q2 Migration"
              />
              {errors.name ? <div className="error">{errors.name}</div> : null}
            </div>

            <div className="field">
              <label className="label" htmlFor="pdesc">
                Description
              </label>
              <textarea
                id="pdesc"
                className="textarea"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short summary of scope and outcomes…"
              />
            </div>

            <div className="field" style={{ maxWidth: 320 }}>
              <label className="label" htmlFor="pstatus">
                Status
              </label>
              <select
                id="pstatus"
                className="select"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {selected ? (
        <div className="card card--padded">
          <div className="card__header">
            <div>
              <h2 className="card__title">{selected.name || "Project"}</h2>
              <p className="card__subtitle">{selected.description || "No description provided."}</p>
            </div>
            <div className="inline">
              <button className="btn btn-ghost" onClick={() => startEdit(selected)}>
                Edit
              </button>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>

          <div className="row">
            <div className="card card--padded">
              <div style={{ fontWeight: 800 }}>Details</div>
              <div className="stack-sm" style={{ marginTop: 10 }}>
                <div className="inline">
                  <span className="muted" style={{ width: 90 }}>
                    ID
                  </span>
                  <span>{String(selected.id ?? "—")}</span>
                </div>
                <div className="inline">
                  <span className="muted" style={{ width: 90 }}>
                    Status
                  </span>
                  <span>{selected.status || "active"}</span>
                </div>
              </div>
            </div>
            <div className="card card--padded">
              <div style={{ fontWeight: 800 }}>Notes</div>
              <div className="muted" style={{ marginTop: 10 }}>
                This panel is ready for future timeline/milestones integration.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
