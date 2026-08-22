import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { listActivity } from "../services/activity.service.js";

export const activityRouter = Router();

activityRouter.get(
  "/",
  requireAuth,
  asyncRoute(async (req, res) => {
    const limit = Number(req.query.limit) || undefined;
    res.json({ entries: await listActivity({ limit }) });
  }),
);
