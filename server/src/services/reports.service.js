import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { SaleLine } from "../models/SaleLine.js";
import { RegisterSession } from "../models/RegisterSession.js";
import { toIsoDate, todayIso } from "../lib/dates.js";
import { countOrders, selectHeatmap } from "../lib/register.js";
import * as dash from "../lib/dashboard.js";

const RECENT_SALES_LIMIT = 60;

/** Everything the Dashboard page used to compute client-side over the full
 * in-memory ledger, now queried and reduced server-side per request. */
export async function dashboardReport(monthsBack) {
  const { start, end } = dash.trailingWindow(monthsBack);
  const todayStr = todayIso();
  const now = new Date();
  const yesterdayStr = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  const [products, users, windowSales, todaySales, openSessions, windowSessions, recentSales] =
    await Promise.all([
      Product.find().lean(),
      User.find().lean(),
      SaleLine.find({ date: { $gte: start, $lte: end } }).lean(),
      SaleLine.find({ date: { $in: [todayStr, yesterdayStr] } }).lean(),
      RegisterSession.find({ closedAt: null }).lean(),
      RegisterSession.find({ date: { $gte: start, $lte: end } }).lean(),
      SaleLine.find().sort({ createdAt: -1 }).limit(RECENT_SALES_LIMIT).lean(),
    ]);

  const publicUsers = users.map((user) => ({ login: user.login, role: user.role }));

  return {
    today: dash.selectToday(todaySales),
    registers: dash.selectRegisterStatus(openSessions, publicUsers),
    kpis: dash.selectRealKpis(windowSales, monthsBack),
    daily: dash.selectDailySeries(windowSales, start, end),
    monthly: dash.selectMonthly(windowSales, start, end),
    byHour: dash.selectByHour(windowSessions, start, end),
    byWeekday: dash.selectByWeekday(windowSales, start, end),
    movers: dash.selectMovers(windowSales, products, start, end),
    categories: dash.selectCategories(windowSales, products, start, end),
    cashiers: dash.selectCashiers(windowSales, start, end),
    inventory: dash.selectInventory(products),
    recentSales,
  };
}

/** What the Reports page used to compute over `sales`/`sessions` props. */
export async function ledgerReport({ start, end, groupBy }) {
  const [rows, sessions] = await Promise.all([
    SaleLine.find({ date: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean(),
    RegisterSession.find({ date: { $gte: start, $lte: end } }).lean(),
  ]);

  const totals = rows.reduce(
    (sum, sale) => ({
      sales: sum.sales + sale.soldFor * sale.qty,
      profit: sum.profit + (sale.soldFor - sale.purchasePrice) * sale.qty,
      units: sum.units + sale.qty,
    }),
    { sales: 0, profit: 0, units: 0 },
  );

  return {
    rows,
    totals,
    orderCount: countOrders(rows, start, end),
    heatmap: selectHeatmap(sessions, { start, end, groupBy }),
  };
}
