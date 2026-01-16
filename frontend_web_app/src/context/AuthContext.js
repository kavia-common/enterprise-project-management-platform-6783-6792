import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient } from "../api/client";
import { clearToken, getToken, setToken } from "../auth/tokenStorage";

const AuthContext = createContext(null);

function normalizeAuthResponse(data) {
  // Many backends return {access_token, token_type} (OAuth2PasswordBearer style)
  if (data && typeof data === "object") {
    if (data.access_token) return data.access_token;
    if (data.token) return data.token;
    if (data.jwt) return data.jwt;
  }
  return null;
}

async function bestEffortGetMe(api) {
  // Backend openapi currently only shows "/" healthcheck in this workspace.
  // We still attempt common "me" endpoints; failures are non-fatal.
  const candidates = ["/auth/me", "/me", "/users/me", "/api/me"];
  for (const path of candidates) {
    try {
      const me = await api.get(path);
      if (me) return me;
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider manages JWT-based auth state for the app.
 */
export function AuthProvider({ children }) {
  /** This is a public function. */
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const api = useMemo(
    () =>
      createApiClient({
        getToken: () => token
      }),
    [token]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setInitializing(true);
      try {
        if (!token) {
          setUser(null);
          return;
        }
        const me = await bestEffortGetMe(api);
        if (!cancelled) setUser(me);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [api, token]);

  const login = useCallback(
    async ({ email, password }) => {
      // Try common auth endpoints; successful one returns a token.
      const candidates = [
        { path: "/auth/login", body: { email, password } },
        { path: "/login", body: { email, password } },
        // OAuth2PasswordRequestForm style
        { path: "/token", body: { username: email, password } }
      ];

      let lastErr = null;
      for (const c of candidates) {
        try {
          const data = await api.post(c.path, { body: c.body });
          const jwt = normalizeAuthResponse(data);
          if (!jwt) throw new Error("Login response did not include a token.");
          setToken(jwt);
          setTokenState(jwt);
          const me = await bestEffortGetMe(
            createApiClient({
              getToken: () => jwt
            })
          );
          setUser(me);
          return { token: jwt, user: me };
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error("Login failed.");
    },
    [api]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const candidates = [
        { path: "/auth/register", body: { name, email, password } },
        { path: "/register", body: { name, email, password } },
        { path: "/auth/signup", body: { name, email, password } }
      ];

      let lastErr = null;
      for (const c of candidates) {
        try {
          const data = await api.post(c.path, { body: c.body });
          const jwt = normalizeAuthResponse(data);
          if (jwt) {
            setToken(jwt);
            setTokenState(jwt);
            const me = await bestEffortGetMe(
              createApiClient({
                getToken: () => jwt
              })
            );
            setUser(me);
          }
          return { token: jwt || null, user: null };
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error("Registration failed.");
    },
    [api]
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      initializing,
      login,
      register,
      logout
    }),
    [token, user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * useAuth provides access to auth/session state.
 */
export function useAuth() {
  /** This is a public function. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
