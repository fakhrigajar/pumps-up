// The API is always reached on this app's own origin: a proxy forwards /api to
// the real backend — vite.config.js in development, netlify.toml in production.
//
// Deliberately NOT read from an env var. An absolute URL here points the browser
// straight at the API's domain, which makes the session cookie third-party, and
// incognito windows, phones, and Safari all discard those — login succeeds and
// every request after it returns 401. Reading it from the environment meant a
// leftover VITE_API_URL in a deploy dashboard could reintroduce that silently.

const SESSION_EXPIRED = "unauthorized";

let onSessionExpired = null;

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new ApiError(0, "network_error", "Could not reach the server.");
  });

  const hasBody = response.status !== 204;
  const data = hasBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new ApiError(response.status, data?.error ?? "unknown_error", data?.message);
    if (error.status === 401 && error.code === SESSION_EXPIRED) onSessionExpired?.();
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: body ?? {} }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ?? {} }),
  delete: (path) => request(path, { method: "DELETE" }),
};
