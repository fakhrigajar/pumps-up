import { minutesFromClock } from "../lib/storeSettings";

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
