import { minutesFromClock } from "../lib/storeSettings";

/**
 * Register sessions themselves now live in MongoDB (opened/closed and
 * fetched through src/api/orders.js). What is left here are the per-row
 * display helpers a page runs over one already-fetched session at a time —
 * `sessionTotals`, `sessionProducts`, and the opening/closing lateness
 * verdicts — none of which need to run over the whole history the way
 * `selectHeatmap`/`countOrders` did (those moved to
 * server/src/lib/register.js, run once per request over what MongoDB has).
 */

/** Trading hours the demo history was seeded across. */
export const TRADING_OPEN_HOUR = 9;
export const TRADING_CLOSE_HOUR = 21;

export function orderRevenue(order) {
  return order.lines.reduce((sum, line) => sum + line.soldFor * line.qty, 0);
}

export function orderUnits(order) {
  return order.lines.reduce((sum, line) => sum + line.qty, 0);
}

/** What a shift came to: the three numbers a session is read by. */
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

/** Every product that crossed the counter in a session, folded to one row
 * each and heaviest first — the same product rung up in four orders is one
 * line of four, not four lines. */
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

/**
 * How far off the hour still counts as being on it. A till is opened by a
 * person with a key, not by a clock, so "09:00" in the settings means the
 * couple of minutes either side of it — without this, "On time" would be a
 * status almost no shift ever earned.
 */
export const ON_TIME_GRACE_MINUTES = 2;

/**
 * How a shift's opening compares to the hour the shop is meant to open.
 *
 * Early is not a fault: a till open before the doors is the shop ready for
 * them, so only lateness reads as a problem. The two functions are separate
 * rather than one with a flag because they disagree about which direction is
 * the bad one, and that disagreement is the whole point of them.
 */
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

/** The mirror of it at the other end of the day: closing up before the shop
 * was due to shut is the fault, and staying open past it is not. */
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
