/**
 * Token storage. Uses localStorage for persistence.
 * If you later want more secure storage, this is the only module to swap out.
 */

const TOKEN_KEY = "epm.jwt";

/**
 * PUBLIC_INTERFACE
 * getToken returns stored JWT token (if any).
 */
export function getToken() {
  /** This is a public function. */
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * setToken stores a JWT token.
 * @param {string} token
 */
export function setToken(token) {
  /** This is a public function. */
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 * clearToken removes stored JWT token.
 */
export function clearToken() {
  /** This is a public function. */
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
