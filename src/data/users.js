/**
 * The account list now lives in MongoDB, fetched through src/api/users.js.
 * What is left here is validation shared with the server (so a bad login or
 * a duplicate is caught instantly, client-side, before the round trip that
 * enforces it for real) and the small lookup helpers the account pages run
 * over whatever list they were handed as a prop.
 */

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
 * The last admin cannot be deleted client-side either: nobody would be left
 * who can reach this screen to create another one. The server enforces the
 * same rule — this is the instant version of that check, not the real one.
 */
export function isLastAdmin(users, user) {
  return user.role === "admin" && countAdmins(users) < 2;
}
