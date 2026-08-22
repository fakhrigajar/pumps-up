import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { login, issueToken, cookieOptions } from "../services/auth.service.js";
import { config } from "../config.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    const { login: candidate, password } = req.body ?? {};
    const user = await login(candidate, password);
    const token = issueToken(user);
    res.cookie(config.cookieName, token, cookieOptions());
    res.json({ user: user.toPublic() });
  }),
);

authRouter.post("/logout", (req, res) => {
  res.clearCookie(config.cookieName, { path: "/" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  const { id: _id, ...user } = req.user;
  res.json({ user });
});
