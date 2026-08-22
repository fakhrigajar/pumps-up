/**
 * Ported from src/data/register.js on the client — the read-only aggregation
 * functions (`selectHeatmap`, `countOrders`) unchanged, so the reports
 * endpoint produces the same numbers the client used to compute itself, plus
 * the seed-only `buildRegisterHistory` generator.
 *
 * The CRUD-shaped helpers the old client had (`openSession`, `closeSession`,
 * `openSessionOf`) are not ported: they return plain objects with a
 * client-generated `id`, which does not map onto a Mongoose document — the
 * order service talks to `RegisterSession` directly instead. The per-row
 * display helpers (`sessionTotals`, `sessionProducts`, `openingStatus`,
 * `closingStatus`) stay client-only, since they operate on one already-
 * fetched session at a time.
 */

import { fromIsoDate, toIsoDate } from "./dates.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const TRADING_OPEN_HOUR = 9;
export const TRADING_CLOSE_HOUR = 21;

export function orderRevenue(order) {
  return order.lines.reduce((sum, line) => sum + line.soldFor * line.qty, 0);
}

export function orderUnits(order) {
  return order.lines.reduce((sum, line) => sum + line.qty, 0);
}

export function selectHeatmap(sessions, { start, end, groupBy = "day" }) {
  const inRange = sessions.filter((session) => session.date >= start && session.date <= end);

  const hours = tradingHours(inRange);
  const buckets = new Map();

  for (const session of inRange) {
    const key = groupBy === "cashier" ? session.cashier : session.date;
    const bucket = buckets.get(key) ?? hours.map((hour) => ({ hour, orders: 0, revenue: 0, units: 0 }));

    for (const order of session.orders) {
      const index = hours.indexOf(new Date(order.at).getHours());
      if (index < 0) continue;
      bucket[index].orders += 1;
      bucket[index].units += orderUnits(order);
      bucket[index].revenue += orderRevenue(order);
    }

    buckets.set(key, bucket);
  }

  const keys = [...buckets.keys()].sort();
  return {
    hours,
    rows: (groupBy === "day" ? keys.reverse() : keys).map((key) => ({
      id: key,
      key,
      cells: buckets.get(key),
    })),
  };
}

function tradingHours(sessions) {
  let first = TRADING_OPEN_HOUR;
  let last = TRADING_CLOSE_HOUR;

  for (const session of sessions) {
    first = Math.min(first, new Date(session.openedAt).getHours());
    const closed = session.closedAt ?? Date.now();
    last = Math.max(last, new Date(closed).getHours());
  }

  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function countOrders(sales, start, end) {
  const orders = new Set();
  for (const sale of sales) {
    if (sale.date >= start && sale.date <= end) {
      orders.add(sale.orderId ?? sale.id);
    }
  }
  return orders.size;
}

/**
 * Seed-only: shifts built from the seeded ledger, so a day that shows N
 * sales in the reports also shows those N sales spread across cashier
 * shifts, exactly as the client used to generate at module-load time.
 */
export function buildRegisterHistory(sales, cashiers, random) {
  if (cashiers.length === 0) return { sessions: [], stampOf: new Map() };

  const byDate = new Map();
  for (const sale of sales) {
    const day = byDate.get(sale.date) ?? [];
    day.push(sale);
    byDate.set(sale.date, day);
  }

  const sessions = [];
  const stampOf = new Map();

  for (const [date, daySales] of [...byDate.entries()].sort()) {
    const midnight = fromIsoDate(date).getTime();
    const shifts = new Map();

    for (const sale of daySales) {
      const cashier = cashiers[Math.floor(random() * cashiers.length)];
      const shift = shifts.get(cashier) ?? [];
      const peak = random() < 0.45 ? 12.5 : 18;
      const hour = clampHour(peak + (random() - 0.5) * 5.5);
      shift.push({ sale, at: midnight + Math.round(hour * HOUR) });
      shifts.set(cashier, shift);
    }

    for (const [cashier, rung] of shifts) {
      rung.sort((a, b) => a.at - b.at);

      const orders = [];
      let index = 0;
      while (index < rung.length) {
        const size = random() < 0.68 ? 1 : random() < 0.85 ? 2 : 3;
        const group = rung.slice(index, index + size);
        index += group.length;

        const orderId = `${group[0].sale.id}-O`;
        for (const { sale } of group) stampOf.set(sale.id, { orderId, cashier });

        orders.push({
          id: orderId,
          at: group[0].at,
          payment: group[0].sale.payment,
          lines: group.map(({ sale }) => ({
            sku: sale.sku,
            name: sale.name,
            qty: sale.qty,
            soldFor: sale.soldFor,
          })),
        });
      }

      const openTarget = midnight + TRADING_OPEN_HOUR * HOUR + Math.round((random() - 0.6) * 34 * MINUTE);
      const closeTarget = midnight + TRADING_CLOSE_HOUR * HOUR + Math.round((random() - 0.55) * 40 * MINUTE);

      sessions.push({
        cashier,
        date,
        openedAt: Math.min(openTarget, orders[0].at - 2 * MINUTE),
        closedAt: Math.max(closeTarget, orders[orders.length - 1].at + 2 * MINUTE),
        orders,
      });
    }
  }

  return {
    sessions: sessions.sort((a, b) => b.openedAt - a.openedAt),
    stampOf,
  };
}

function clampHour(hour) {
  return Math.min(TRADING_CLOSE_HOUR - 0.4, Math.max(TRADING_OPEN_HOUR + 0.2, hour));
}
