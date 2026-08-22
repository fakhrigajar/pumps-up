import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listUsers, createUser, deleteUser, updateSelf } from "../services/users.service.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    res.json({ users: await listUsers() });
  }),
);

usersRouter.post(
  "/",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const user = await createUser(req.body ?? {});
    res.status(201).json({ user });
  }),
);

usersRouter.delete(
  "/:login",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    res.json(await deleteUser(req.params.login));
  }),
);

// Self-service only — identity comes from the session, not the URL, so this
// intentionally has no `:login` param.
usersRouter.patch(
  "/me",
  asyncRoute(async (req, res) => {
    const user = await updateSelf(req.user, req.body ?? {});
    res.json({ user });
  }),
);
