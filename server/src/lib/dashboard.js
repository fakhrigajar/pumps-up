/**
 * Ported from src/data/dashboard.js (and the KPI selector from
 * src/data/erp.js) on the client, unchanged — these are exactly the
 * functions the old client ran in a `useMemo` over the full in-memory
 * ledger; here they run the same way over arrays queried from MongoDB, so
 * the numbers the reports endpoints return are behaviorally identical to
 * what the app already showed.
 */

import { addMonths, datesBetween, fromIsoDate, isWithin, isoParts, splitRangeInHalf, startOfMonthIso, toIsoDate, todayIso } from "./dates.js";
import { orderRevenue, orderUnits } from "./register.js";

const revenueOf = (sale) => sale.soldFor * sale.qty;
const profitOf = (sale) => (sale.soldFor - sale.purchasePrice) * sale.qty;
const orderKey = (sale) => sale.orderId ?? sale.id;

export function trailingWindow(monthsBack) {
  const end = todayIso();
  const { year, monthIndex } = isoParts(end);
  const from = addMonths(year, monthIndex, -(monthsBack - 1));
  return { start: startOfMonthIso(from.year, from.monthIndex), end };
}

export function selectRealKpis(sales, monthsBack) {
  const { start, end } = trailingWindow(monthsBack);
  const days = datesBetween(start, end);

  const byDay = new Map();
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const bucket = byDay.get(sale.date) ?? { revenue: 0, cost: 0, orders: 0 };
    bucket.revenue += revenueOf(sale);
    bucket.cost += sale.purchasePrice * sale.qty;
    bucket.orders += 1;
    byDay.set(sale.date, bucket);
  }
  const daily = days.map((date) => byDay.get(date) ?? { revenue: 0, cost: 0, orders: 0 });

  const { previous, current } = splitRangeInHalf(start, end);
  const sumOver = (range, pick) =>
    days.reduce((total, date, index) => (isWithin(date, range.start, range.end) ? total + pick(daily[index]) : total), 0);

  const revenueNow = sumOver(current, (d) => d.revenue);
  const revenueBefore = sumOver(previous, (d) => d.revenue);
  const ordersNow = sumOver(current, (d) => d.orders);
  const ordersBefore = sumOver(previous, (d) => d.orders);
  const costNow = sumOver(current, (d) => d.cost);
  const costBefore = sumOver(previous, (d) => d.cost);

  const delta = (now, before) => (before ? ((now - before) / before) * 100 : 0);
  const marginNow = revenueNow ? ((revenueNow - costNow) / revenueNow) * 100 : 0;
  const marginBefore = revenueBefore ? ((revenueBefore - costBefore) / revenueBefore) * 100 : 0;
  const aovNow = ordersNow ? revenueNow / ordersNow : 0;
  const aovBefore = ordersBefore ? revenueBefore / ordersBefore : 0;

  return [
    { id: "revenue", labelKey: "kpi.revenue", value: revenueNow, format: "currency", delta: delta(revenueNow, revenueBefore), upIsGood: true, spark: daily.map((d) => d.revenue) },
    { id: "orders", labelKey: "kpi.orders", value: ordersNow, format: "number", delta: delta(ordersNow, ordersBefore), upIsGood: true, spark: daily.map((d) => d.orders) },
    { id: "margin", labelKey: "kpi.margin", value: marginNow, format: "percent", delta: marginNow - marginBefore, deltaUnit: "pp", upIsGood: true, spark: daily.map((d) => (d.revenue ? ((d.revenue - d.cost) / d.revenue) * 100 : 0)) },
    { id: "aov", labelKey: "kpi.aov", value: aovNow, format: "currency0", delta: delta(aovNow, aovBefore), upIsGood: true, spark: daily.map((d) => (d.orders ? d.revenue / d.orders : 0)) },
  ];
}

export function totalsOf(sales) {
  const orders = new Set();
  let revenue = 0;
  let profit = 0;
  let units = 0;

  for (const sale of sales) {
    revenue += revenueOf(sale);
    profit += profitOf(sale);
    units += sale.qty;
    orders.add(orderKey(sale));
  }

  return { revenue, profit, units, orders: orders.size, aov: orders.size ? revenue / orders.size : 0 };
}

export function selectDay(sales, iso) {
  return totalsOf(sales.filter((sale) => sale.date === iso));
}

export function selectToday(sales) {
  const now = new Date();
  const before = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return { today: selectDay(sales, todayIso()), yesterday: selectDay(sales, toIsoDate(before)) };
}

export const LOW_STOCK_THRESHOLD = 6;

export function selectInventory(products) {
  let value = 0;
  let potential = 0;
  let active = 0;
  const low = [];
  const out = [];

  for (const product of products) {
    value += product.stock * product.purchasePrice;
    potential += product.stock * (product.sellingPrice - product.purchasePrice);

    if (product.stock === 0) {
      out.push(product);
    } else {
      active += 1;
      if (product.stock <= LOW_STOCK_THRESHOLD) low.push(product);
    }
  }

  return { value, potential, variants: products.length, active, low: low.sort((a, b) => a.stock - b.stock), out };
}

export function selectDailySeries(sales, start, end) {
  const byDay = new Map();
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const bucket = byDay.get(sale.date) ?? { revenue: 0, profit: 0 };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    byDay.set(sale.date, bucket);
  }
  return datesBetween(start, end).map((date) => ({ date, ...(byDay.get(date) ?? { revenue: 0, profit: 0 }) }));
}

export function selectMonthly(sales, start, end) {
  const byMonth = new Map();
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const key = sale.date.slice(0, 7);
    const bucket = byMonth.get(key) ?? { revenue: 0, profit: 0, orders: new Set() };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    bucket.orders.add(orderKey(sale));
    byMonth.set(key, bucket);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, bucket]) => ({ month, revenue: bucket.revenue, profit: bucket.profit, orders: bucket.orders.size }));
}

const WEEK_LENGTH = 7;

export function selectByWeekday(sales, start, end) {
  const rows = Array.from({ length: WEEK_LENGTH }, (_, weekday) => ({ weekday, revenue: 0, profit: 0, units: 0, orders: new Set() }));
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const index = (fromIsoDate(sale.date).getDay() + 6) % WEEK_LENGTH;
    rows[index].revenue += revenueOf(sale);
    rows[index].profit += profitOf(sale);
    rows[index].units += sale.qty;
    rows[index].orders.add(orderKey(sale));
  }
  return rows.map((row) => ({ ...row, orders: row.orders.size }));
}

export function selectByHour(sessions, start, end) {
  const byHour = new Map();
  for (const session of sessions) {
    if (session.date < start || session.date > end) continue;
    for (const order of session.orders) {
      const hour = new Date(order.at).getHours();
      const bucket = byHour.get(hour) ?? { hour, revenue: 0, orders: 0, units: 0 };
      bucket.revenue += orderRevenue(order);
      bucket.units += orderUnits(order);
      bucket.orders += 1;
      byHour.set(hour, bucket);
    }
  }

  const hours = [...byHour.keys()];
  if (hours.length === 0) return [];
  const first = Math.min(...hours);
  const last = Math.max(...hours);
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const hour = first + index;
    return byHour.get(hour) ?? { hour, revenue: 0, orders: 0, units: 0 };
  });
}

const MOVER_COUNT = 6;

export function selectMovers(sales, products, start, end, limit = MOVER_COUNT) {
  const bySku = new Map();
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const entry = bySku.get(sale.sku) ?? { units: 0, revenue: 0 };
    entry.units += sale.qty;
    entry.revenue += revenueOf(sale);
    bySku.set(sale.sku, entry);
  }

  const rows = products.map((product) => ({
    sku: product.sku,
    name: product.name,
    category: product.category,
    stock: product.stock,
    units: bySku.get(product.sku)?.units ?? 0,
    revenue: bySku.get(product.sku)?.revenue ?? 0,
  }));

  return {
    best: [...rows].sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, limit),
    slowest: [...rows].sort((a, b) => a.units - b.units || b.stock - a.stock).slice(0, limit),
  };
}

export function selectCategories(sales, products, start, end) {
  const categoryOf = new Map(products.map((product) => [product.sku, product.category]));
  const byCategory = new Map();

  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const category = categoryOf.get(sale.sku);
    if (!category) continue;

    const bucket = byCategory.get(category) ?? { category, revenue: 0, profit: 0, units: 0 };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    bucket.units += sale.qty;
    byCategory.set(category, bucket);
  }

  return [...byCategory.values()].sort((a, b) => b.revenue - a.revenue);
}

export function selectCashiers(sales, start, end) {
  const byCashier = new Map();
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end) || !sale.cashier) continue;
    const bucket = byCashier.get(sale.cashier) ?? { cashier: sale.cashier, revenue: 0, profit: 0, units: 0, orders: new Set() };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    bucket.units += sale.qty;
    bucket.orders.add(orderKey(sale));
    byCashier.set(sale.cashier, bucket);
  }
  return [...byCashier.values()].map((bucket) => ({ ...bucket, orders: bucket.orders.size })).sort((a, b) => b.revenue - a.revenue);
}

export function selectRegisterStatus(sessions, users) {
  return users
    .filter((user) => user.role === "cashier")
    .map((user) => ({
      login: user.login,
      session: sessions.find((session) => session.cashier === user.login && session.closedAt === null) ?? null,
    }))
    .sort((a, b) => Number(Boolean(b.session)) - Number(Boolean(a.session)));
}
