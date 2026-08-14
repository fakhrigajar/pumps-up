import { toIsoDate, todayIso } from "../lib/dates";

/**
 * Every role an account can hold, in the order the picker offers them.
 * `admin` reaches the whole back office, this screen included; `cashier` is
 * the till — the sales screen and the product list, nothing that changes who
 * can sign in.
 */
export const ROLES = ["admin", "cashier"];

export const DEFAULT_ROLE = "cashier";

/**
 * A login is typed at sign-in, so it stays to characters that survive a
 * keyboard in any of the three languages: lowercase a–z, digits, and the
 * three separators people actually use in a username.
 */
export const LOGIN_PATTERN = /^[a-z0-9._-]+$/;
export const LOGIN_MIN_LENGTH = 3;
export const LOGIN_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;

/**
 * Logins are folded to lowercase on the way in and compared that way, so
 * "Aysel" and "aysel" are one account rather than two rows nobody can tell
 * apart in the list.
 */
export function normalizeLogin(value) {
  return value.trim().toLowerCase();
}

/** The login is the key here, the way `sku` is the key for a product. */
export function findUser(users, login) {
  const key = normalizeLogin(login);
  return users.find((user) => user.login === key) ?? null;
}

export function countAdmins(users) {
  return users.filter((user) => user.role === "admin").length;
}

/**
 * The last admin cannot be deleted: nobody would be left who can reach this
 * screen to create another one, and there is no backend to fix it from.
 */
export function isLastAdmin(users, user) {
  return user.role === "admin" && countAdmins(users) < 2;
}

/** One account record, with its login normalized and dated as of today. */
export function createUser({ login, password, role }) {
  return {
    login: normalizeLogin(login),
    password,
    role,
    createdAt: todayIso(),
  };
}

function daysAgoIso(days) {
  const now = new Date();
  return toIsoDate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - days),
  );
}

/**
 * Seed accounts, so the screen is never empty on first load and there is
 * always an admin to sign in as. The passwords are placeholders and sit in
 * plain memory exactly as the catalogue does — there is no backend to hash
 * them against, and nothing here survives a reload.
 */
export const users = [
  {
    login: "dami",
    password: "pumpsup123",
    role: "admin",
    createdAt: daysAgoIso(126),
  },
  {
    login: "aysel",
    password: "kassa123",
    role: "cashier",
    createdAt: daysAgoIso(54),
  },
  {
    login: "rauf",
    password: "kassa456",
    role: "cashier",
    createdAt: daysAgoIso(12),
  },
];
