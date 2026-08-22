import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getSettings,
  updateSettings,
  getLabelTemplate,
  updateLabelTemplate,
} from "../services/settings.service.js";

export const settingsRouter = Router();

// Public: currency and trading hours are shop-level facts, not secrets, and
// StoreSettingsProvider/LabelTemplateProvider sit above the login screen —
// they need to resolve before anyone has signed in.
settingsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    res.json(await getSettings());
  }),
);

settingsRouter.get(
  "/label-template",
  asyncRoute(async (req, res) => {
    res.json(await getLabelTemplate());
  }),
);

settingsRouter.patch(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    res.json(await updateSettings(req.body ?? {}));
  }),
);

settingsRouter.patch(
  "/label-template",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    res.json(await updateLabelTemplate(req.body ?? {}));
  }),
);
