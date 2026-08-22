import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[config.cookieName];
    if (!token) throw ApiError.unauthorized();

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized();

    req.user = { id: user._id.toString(), ...user.toPublic() };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(ApiError.unauthorized());
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return next(ApiError.forbidden());
    next();
  };
}
