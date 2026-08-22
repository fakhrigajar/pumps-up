/**
 * The one place a fetch actually happens. Every request carries cookies
 * (`credentials: "include"`) so the httpOnly session cookie set by
 * /api/auth/login rides along automatically — nothing here ever touches a
 * token directly. In dev, Vite proxies `/api` to the Express server (see
 * vite.config.js) so this is always same-origin; in production Express
 * serves the built app itself, so it is same-origin there too.
 */
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
