export const ROLES = ["admin", "cashier"];

export const DEFAULT_ROLE = "cashier";

export const LOGIN_PATTERN = /^[a-z0-9._-]+$/;
export const LOGIN_MIN_LENGTH = 3;
export const LOGIN_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;

export function normalizeLogin(value) {
  return value.trim().toLowerCase();
}

export function findUser(users, login) {
  const key = normalizeLogin(login);
  return users.find((user) => user.login === key) ?? null;
}

export function countAdmins(users) {
  return users.filter((user) => user.role === "admin").length;
}

export function isLastAdmin(users, user) {
  return user.role === "admin" && countAdmins(users) < 2;
}
