import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  LOGIN_PATTERN,
  PASSWORD_MIN_LENGTH,
  normalizeLogin,
} from "../lib/users.js";

const HASH_ROUNDS = 10;

export async function listUsers() {
  const users = await User.find().sort({ createdAt: 1 });
  return users.map((user) => user.toPublic());
}

function validateLogin(login) {
  if (!login) throw ApiError.badRequest("login_required", "Give the user a login.");
  if (login.length < LOGIN_MIN_LENGTH || login.length > LOGIN_MAX_LENGTH) {
    throw ApiError.badRequest("login_length", `A login is between ${LOGIN_MIN_LENGTH} and ${LOGIN_MAX_LENGTH} characters.`);
  }
  if (!LOGIN_PATTERN.test(login)) {
    throw ApiError.badRequest("login_chars", "A login is lowercase letters, numbers, dots, underscores or hyphens.");
  }
}

function validatePassword(password) {
  if (String(password ?? "").length < PASSWORD_MIN_LENGTH) {
    throw ApiError.badRequest("password_length", `A password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
}

export async function createUser({ login, password, role }) {
  const normalized = normalizeLogin(login);
  validateLogin(normalized);
  validatePassword(password);
  if (role !== "admin" && role !== "cashier") {
    throw ApiError.badRequest("role_invalid", "Role must be admin or cashier.");
  }

  const existing = await User.findOne({ login: normalized }).collation({ locale: "en", strength: 2 });
  if (existing) throw ApiError.conflict("login_taken", `The login ${normalized} is already taken.`);

  const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);
  const user = await User.create({ login: normalized, passwordHash, role });
  return user.toPublic();
}

export async function deleteUser(login) {
  const normalized = normalizeLogin(login);
  const user = await User.findOne({ login: normalized });
  if (!user) throw ApiError.notFound("user_not_found", "That account no longer exists.");

  if (user.role === "admin") {
    const admins = await User.countDocuments({ role: "admin" });
    if (admins < 2) {
      throw ApiError.conflict("last_admin", "The last admin account cannot be deleted.");
    }
  }

  await user.deleteOne();
  return { login: normalized };
}

/**
 * Self-service login/password change — identity comes from the signed-in
 * session (`actingUser`), never a path parameter, so nobody can edit an
 * account that is not their own by changing a URL.
 */
export async function updateSelf(actingUser, changes) {
  const user = await User.findById(actingUser.id);
  if (!user) throw ApiError.unauthorized();

  if (typeof changes.login === "string") {
    const normalized = normalizeLogin(changes.login);
    if (normalized !== user.login) {
      validateLogin(normalized);
      const existing = await User.findOne({ login: normalized }).collation({ locale: "en", strength: 2 });
      if (existing) throw ApiError.conflict("login_taken", `The login ${normalized} is already taken.`);
      user.login = normalized;
    }
  }

  if (typeof changes.password === "string" && changes.password !== "") {
    const currentOk = await bcrypt.compare(String(changes.currentPassword ?? ""), user.passwordHash);
    if (!currentOk) throw ApiError.unauthorized("current_password_mismatch", "That is not the current password.");
    validatePassword(changes.password);
    user.passwordHash = await bcrypt.hash(changes.password, HASH_ROUNDS);
  }

  await user.save();
  return user.toPublic();
}
