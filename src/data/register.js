import { minutesFromClock } from "../lib/storeSettings.js";

export const TRADING_OPEN_HOUR = 9;
export const TRADING_CLOSE_HOUR = 21;

export function orderRevenue(order) {
  return order.lines.reduce((sum, line) => sum + line.soldFor * line.qty, 0);
}

export function orderUnits(order) {
  return order.lines.reduce((sum, line) => sum + line.qty, 0);
}

export function sessionTotals(session) {
  return session.orders.reduce(
    (totals, order) => ({
      orders: totals.orders + 1,
      units: totals.units + orderUnits(order),
      revenue: totals.revenue + orderRevenue(order),
    }),
    { orders: 0, units: 0, revenue: 0 },
  );
}

export function sessionProducts(session) {
  const byProduct = new Map();

  for (const order of session.orders) {
    for (const line of order.lines) {
      const current = byProduct.get(line.sku) ?? {
        sku: line.sku,
        name: line.name,
        qty: 0,
        revenue: 0,
      };
      current.qty += line.qty;
      current.revenue += line.soldFor * line.qty;
      byProduct.set(line.sku, current);
    }
  }

  return [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);
}

export const ON_TIME_GRACE_MINUTES = 2;

export function openingStatus(openedAt, opensAt) {
  const drift = minutesFromClock(openedAt, opensAt);
  if (drift === null) return null;
  if (drift > ON_TIME_GRACE_MINUTES) {
    return { key: "reg.late", tone: "critical", drift };
  }
  if (drift < -ON_TIME_GRACE_MINUTES) {
    return { key: "reg.early", tone: "good", drift };
  }
  return { key: "reg.onTime", tone: "good", drift };
}

export function closingStatus(closedAt, closesAt) {
  const drift = minutesFromClock(closedAt, closesAt);
  if (drift === null) return null;
  if (drift < -ON_TIME_GRACE_MINUTES) {
    return { key: "reg.closedEarly", tone: "critical", drift };
  }
  if (drift > ON_TIME_GRACE_MINUTES) {
    return { key: "reg.lateClose", tone: "good", drift };
  }
  return { key: "reg.onTime", tone: "good", drift };
}

export function sessionKey(session) {
  return (
    session.id ??
    session._id ??
    `${session.cashier}-${session.date}-${session.openedAt}`
  );
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
