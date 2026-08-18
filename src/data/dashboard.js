import {
  datesBetween,
  fromIsoDate,
  isWithin,
  toIsoDate,
  todayIso,
} from "../lib/dates";
import { orderRevenue, orderUnits } from "./register";

/**
 * What the dashboard reads the shop by.
 *
 * Every figure here comes off the sales ledger, which carries the price a row
 * was sold at, the cost it was bought at, the checkout it belonged to and who
 * rang it up. That is deliberate: one list answering every question is one
 * list to keep honest, and two panels on the same screen cannot quietly
 * disagree about a day. The only exception is the hour of day — the ledger is
 * dated to the day, and the clock lives on the shift.
 */

const revenueOf = (sale) => sale.soldFor * sale.qty;
const profitOf = (sale) => (sale.soldFor - sale.purchasePrice) * sale.qty;

/** The checkout a ledger row belonged to. Rows written before orders were
 * stamped stand alone, which counts them as one order each — the honest
 * reading of a row that cannot say what it was grouped with. */
const orderKey = (sale) => sale.orderId ?? sale.id;

/**
 * The five numbers a period is read by. Orders are counted by distinct
 * checkout rather than by row, because a basket of three is three rows and one
 * customer; the average order value then divides two figures that agree about
 * what an order is.
 */
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

  return {
    revenue,
    profit,
    units,
    orders: orders.size,
    aov: orders.size ? revenue / orders.size : 0,
  };
}

export function selectDay(sales, iso) {
  return totalsOf(sales.filter((sale) => sale.date === iso));
}

/**
 * Today against yesterday.
 *
 * A day on its own is a number without a size — 400 is a good morning or a
 * bad one depending on what the shop usually does. Yesterday is the nearest
 * thing a till has to a benchmark, and it is the comparison a shopkeeper makes
 * anyway.
 */
export function selectToday(sales) {
  const now = new Date();
  const before = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return {
    today: selectDay(sales, todayIso()),
    yesterday: selectDay(sales, toIsoDate(before)),
  };
}

/** Stock at or under this many units is worth restocking before it runs out. */
export const LOW_STOCK_THRESHOLD = 6;

/**
 * What is on the shelves, valued two ways: what it cost to buy, and what it
 * would add if every unit sold at its list price. The second is a ceiling
 * rather than a forecast — nothing discounts, nothing is left over — which is
 * why it is labelled as an estimate wherever it is shown.
 */
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

  return {
    value,
    potential,
    variants: products.length,
    active,
    low: low.sort((a, b) => a.stock - b.stock),
    out,
  };
}

/** A row per day across the whole window, gaps included: a day the shop took
 * nothing is a zero on the chart, not a missing point the line skips over. */
export function selectDailySeries(sales, start, end) {
  const byDay = new Map();

  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const bucket = byDay.get(sale.date) ?? { revenue: 0, profit: 0 };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    byDay.set(sale.date, bucket);
  }

  return datesBetween(start, end).map((date) => ({
    date,
    ...(byDay.get(date) ?? { revenue: 0, profit: 0 }),
  }));
}

/** Month against month. The key stays `YYYY-MM` so months sort as strings,
 * the way dates do everywhere else in the app. */
export function selectMonthly(sales, start, end) {
  const byMonth = new Map();

  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const key = sale.date.slice(0, 7);
    const bucket = byMonth.get(key) ?? {
      revenue: 0,
      profit: 0,
      orders: new Set(),
    };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    bucket.orders.add(orderKey(sale));
    byMonth.set(key, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, bucket]) => ({
      month,
      revenue: bucket.revenue,
      profit: bucket.profit,
      orders: bucket.orders.size,
    }));
}

const WEEK_LENGTH = 7;

/** Monday first, matching the calendar grid — a shop's week is not the
 * locale's week, and the two charts should not disagree about where it starts. */
export function selectByWeekday(sales, start, end) {
  const rows = Array.from({ length: WEEK_LENGTH }, (_, weekday) => ({
    weekday,
    revenue: 0,
    profit: 0,
    units: 0,
    orders: new Set(),
  }));

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

/**
 * The trading day by the clock, which only the shifts can say: the ledger is
 * dated to the day, and knowing the counter is busy at six in the evening
 * needs the hour the checkout happened at.
 *
 * The axis runs from the first hour that saw a sale to the last, rather than
 * midnight to midnight — two thirds of a 24-hour axis would be empty by
 * definition, and the shape of a working day is what is being looked for.
 */
export function selectByHour(sessions, start, end) {
  const byHour = new Map();

  for (const session of sessions) {
    if (session.date < start || session.date > end) continue;
    for (const order of session.orders) {
      const hour = new Date(order.at).getHours();
      const bucket = byHour.get(hour) ?? {
        hour,
        revenue: 0,
        orders: 0,
        units: 0,
      };
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

/**
 * What is moving and what is not, ranked off the catalogue rather than off the
 * ledger. Ranking the ledger can only rank things that sold at least once, and
 * a product that sold *nothing* is exactly what the slow end of this list is
 * for. Ties at zero are broken by stock on hand: of two products that sold
 * nothing, the one with forty on the shelf is the one tying up money.
 */
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
    best: [...rows]
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, limit),
    slowest: [...rows]
      .sort((a, b) => a.units - b.units || b.stock - a.stock)
      .slice(0, limit),
  };
}

/** Sales folded to the category the product belongs to. A sale of something
 * no longer in the catalogue has no category to fold into and is left out,
 * rather than inventing an "Other" nobody stocks. */
export function selectCategories(sales, products, start, end) {
  const categoryOf = new Map(
    products.map((product) => [product.sku, product.category]),
  );
  const byCategory = new Map();

  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const category = categoryOf.get(sale.sku);
    if (!category) continue;

    const bucket = byCategory.get(category) ?? {
      category,
      revenue: 0,
      profit: 0,
      units: 0,
    };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    bucket.units += sale.qty;
    byCategory.set(category, bucket);
  }

  return [...byCategory.values()].sort((a, b) => b.revenue - a.revenue);
}

/** Who took what. Rows with no cashier — an admin ringing something up off a
 * shift — belong to nobody and are left out rather than pooled under a name
 * that does not exist. */
export function selectCashiers(sales, start, end) {
  const byCashier = new Map();

  for (const sale of sales) {
    if (!isWithin(sale.date, start, end) || !sale.cashier) continue;
    const bucket = byCashier.get(sale.cashier) ?? {
      cashier: sale.cashier,
      revenue: 0,
      profit: 0,
      units: 0,
      orders: new Set(),
    };
    bucket.revenue += revenueOf(sale);
    bucket.profit += profitOf(sale);
    bucket.units += sale.qty;
    bucket.orders.add(orderKey(sale));
    byCashier.set(sale.cashier, bucket);
  }

  return [...byCashier.values()]
    .map((bucket) => ({ ...bucket, orders: bucket.orders.size }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Every till and whether somebody is standing at it right now.
 *
 * It is built from the cashier list rather than from the open sessions, so a
 * till nobody has opened is a row that says "closed" instead of a row that is
 * missing — "three cashiers, one open" is the state of the shop floor, and it
 * cannot be read off a list that only contains what is open.
 */
export function selectRegisterStatus(sessions, users) {
  return users
    .filter((user) => user.role === "cashier")
    .map((user) => ({
      login: user.login,
      session:
        sessions.find(
          (session) => session.cashier === user.login && session.closedAt === null,
        ) ?? null,
    }))
    .sort((a, b) => Number(Boolean(b.session)) - Number(Boolean(a.session)));
}
