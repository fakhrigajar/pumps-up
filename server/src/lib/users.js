/**
 * Ported from src/data/users.js on the client — the validation constants
 * only, since the server is now the source of truth for the account list
 * itself and for password hashing.
 */

export const ROLES = ["admin", "cashier"];
export const DEFAULT_ROLE = "cashier";

export const LOGIN_PATTERN = /^[a-z0-9._-]+$/;
export const LOGIN_MIN_LENGTH = 3;
export const LOGIN_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;

export function normalizeLogin(value) {
  return String(value ?? "").trim().toLowerCase();
}
