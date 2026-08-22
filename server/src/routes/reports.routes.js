import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { dashboardReport, ledgerReport } from "../services/reports.service.js";
import { todayIso } from "../lib/dates.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireRole("admin"));

reportsRouter.get(
  "/dashboard",
  asyncRoute(async (req, res) => {
    const monthsBack = Number(req.query.monthsBack) || 3;
    res.json(await dashboardReport(monthsBack));
  }),
);

reportsRouter.get(
  "/ledger",
  asyncRoute(async (req, res) => {
    const today = todayIso();
    const start = req.query.start || today;
    const end = req.query.end || today;
    const groupBy = req.query.groupBy === "cashier" ? "cashier" : "day";
    res.json(await ledgerReport({ start, end, groupBy }));
  }),
);
