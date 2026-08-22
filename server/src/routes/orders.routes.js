import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  listSessions,
  mySession,
  openRegister,
  closeRegister,
  createOrder,
} from "../services/orders.service.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const { lines, payment } = req.body ?? {};
    const result = await createOrder(req.user, { lines, payment });
    res.status(201).json(result);
  }),
);

ordersRouter.get(
  "/sessions",
  asyncRoute(async (req, res) => {
    const sessions = await listSessions(req.user, { cashier: req.query.cashier });
    res.json({ sessions });
  }),
);

ordersRouter.get(
  "/sessions/mine",
  asyncRoute(async (req, res) => {
    res.json({ session: await mySession(req.user.login) });
  }),
);

ordersRouter.post(
  "/sessions/open",
  asyncRoute(async (req, res) => {
    res.status(201).json({ session: await openRegister(req.user.login) });
  }),
);

ordersRouter.post(
  "/sessions/close",
  asyncRoute(async (req, res) => {
    res.json({ session: await closeRegister(req.user.login) });
  }),
);
