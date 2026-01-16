/**
 * Lightweight API client around fetch().
 * - Base URL: REACT_APP_API_BASE
 * - Automatically attaches Authorization: Bearer <token>
 * - Centralizes JSON parsing + error normalization
 */

const API_BASE = process.env.REACT_APP_API_BASE;

/**
 * PUBLIC_INTERFACE
 * getApiBase returns the configured API base URL from environment.
 */
export function getApiBase() {
  /** This is a public function. */
  return API_BASE;
}

function joinUrl(base, path) {
  if (!base) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function safeJsonParse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

/**
 * PUBLIC_INTERFACE
 * createApiClient constructs an API client.
 * @param {object} opts
 * @param {() => string | null} opts.getToken - function returning JWT token
 * @param {(isLoading: boolean) => void} [opts.onLoading] - loading state hook
 */
export function createApiClient({ getToken, onLoading } = {}) {
  /** This is a public function. */
  if (!API_BASE) {
    // This is intentionally a runtime warning, not a hard error, so preview can still load.
    // The orchestrator/user should provide REACT_APP_API_BASE in .env for real API calls.
    // eslint-disable-next-line no-console
    console.warn("REACT_APP_API_BASE is not set. API calls will likely fail.");
  }

  async function request(method, path, { body, headers, signal } = {}) {
    const url = joinUrl(API_BASE || "", path);

    const token = getToken ? getToken() : null;
    const mergedHeaders = {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    };

    onLoading?.(true);
    try {
      const res = await fetch(url, {
        method,
        headers: mergedHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal
      });

      const text = await res.text();
      const data = safeJsonParse(text);

      if (!res.ok) {
        const message =
          (data && (data.detail || data.message || data.error)) ||
          (typeof data === "string" ? data : null) ||
          `Request failed (${res.status})`;

        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } finally {
      onLoading?.(false);
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, opts) => request("POST", path, opts),
    put: (path, opts) => request("PUT", path, opts),
    patch: (path, opts) => request("PATCH", path, opts),
    delete: (path, opts) => request("DELETE", path, opts)
  };
}
