/**
 * The one place a fetch actually happens. Every request carries cookies
 * (`credentials: "include"`) so the httpOnly session cookie set by
 * /api/auth/login rides along automatically — nothing here ever touches a
 * token directly.
 *
 * The API is a separate deployment from this frontend (its own Railway
 * service), so this is a cross-origin request in every real environment —
 * `VITE_API_URL` is the absolute base to send it to. Only bare local dev,
 * with no `VITE_API_URL` set and a server running on the same machine, falls
 * back to a same-origin relative path.
 */
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
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
    throw new ApiError(response.status, data?.error ?? "unknown_error", data?.message);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: body ?? {} }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ?? {} }),
  delete: (path) => request(path, { method: "DELETE" }),
};
