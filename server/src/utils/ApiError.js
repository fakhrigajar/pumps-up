/**
 * An error a service raises on purpose — a rule was broken, not a bug hit.
 * Carries an HTTP status and a stable `code` the frontend can switch on
 * (mapApiError in src/api/errors.js) without parsing English sentences.
 */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  static badRequest(code, message) {
    return new ApiError(400, code, message);
  }

  static unauthorized(code = "unauthorized", message = "Sign in required.") {
    return new ApiError(401, code, message);
  }

  static forbidden(code = "forbidden", message = "Not allowed.") {
    return new ApiError(403, code, message);
  }

  static notFound(code = "not_found", message = "Not found.") {
    return new ApiError(404, code, message);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }
}
