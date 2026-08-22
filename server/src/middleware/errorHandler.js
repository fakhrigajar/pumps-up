import { ApiError } from "../utils/ApiError.js";

/** Wraps an async route handler so a rejected promise reaches the error
 * handler below instead of crashing the process. */
export function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.code, message: error.message });
  }

  if (error?.code === 11000) {
    // A unique-index collision that slipped past an application-level check
    // (a genuine race) — reported the same shape as one caught in code.
    return res.status(409).json({ error: "conflict", message: "That value is already in use." });
  }

  console.error(error);
  res.status(500).json({ error: "internal_error", message: "Something went wrong." });
}
