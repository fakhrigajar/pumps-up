import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeLogin } from "../lib/users.js";

const TOKEN_TTL = "1d";
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Signed with the user's stable `_id`, not their login — so a self-service
 * login rename (Settings → change login) never invalidates the session that
 * made the change. */
export function issueToken(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

export async function login(candidate, password) {
  const user = await User.findOne({ login: normalizeLogin(candidate) });
  if (!user) throw ApiError.unauthorized("invalid_credentials", "That login and password do not match an account.");

  const ok = await bcrypt.compare(String(password ?? ""), user.passwordHash);
  if (!ok) throw ApiError.unauthorized("invalid_credentials", "That login and password do not match an account.");

  return user;
}
