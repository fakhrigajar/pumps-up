import { fromIsoDate, toIsoDate } from "../lib/dates";
import { minutesFromClock } from "../lib/storeSettings";

/**
 * A register session: one cashier's till, from the moment they opened it to
 * the moment they closed it, and every order rung up in between.
 *
 * An *order* is one checkout — everything on the counter paid for in one go —
 * which is why it holds lines rather than being one. The sales ledger keeps a
 * row per product because that is what a report is read by; a session keeps
 * the order intact because that is what a shift is counted in, and "42 orders"
 * and "68 items" are different numbers a shop cares about separately.
 *
 * Sessions are the only place a time of day is recorded. The ledger is dated
 * to the day, which is all a monthly report needs; knowing that the counter is
 * busy at six in the evening needs the clock, and that is a property of the
 * shift the sale was rung up in.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Trading hours the seeded history is spread across, and the window the
 * heatmap falls back to before any session exists to widen it. */
export const TRADING_OPEN_HOUR = 9;
export const TRADING_CLOSE_HOUR = 21;

export function openSession(cashier, at = Date.now()) {
  return {
    id: `RG-${cashier}-${at}`,
    cashier,
    date: toIsoDate(new Date(at)),
    openedAt: at,
    closedAt: null,
    orders: [],
  };
}

export function closeSession(session, at = Date.now()) {
  return { ...session, closedAt: at };
}

/** The session a cashier is standing at right now, if any. Only one can be
 * open per cashier: closing is what ends it, so an open one is unambiguous. */
export function openSessionOf(sessions, cashier) {
  return (
    sessions.find(
      (session) => session.cashier === cashier && session.closedAt === null,
    ) ?? null
  );
}

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
 * Seeded shifts, built from the same ledger the reports are built from, so a
 * day that shows 12 sales on the reports screen shows those 12 sales spread
 * across its cashiers' shifts rather than a second, disagreeing history.
 *
 * `random` is passed in already seeded, so the same catalogue produces the
 * same shifts on every reload — a heatmap that rearranged itself when the page
 * was refreshed would be describing the generator, not the shop.
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

  // Which checkout each ledger row was part of, and who rang it up. Both facts
  // only exist here, so this is the only place that can say them; handing them
  // back lets the ledger answer "how many orders" and "whose" on its own,
  // without a second, disagreeing history to cross-reference.
  const stampOf = new Map();

  for (const [date, daySales] of [...byDate.entries()].sort()) {
    const midnight = fromIsoDate(date).getTime();
    const shifts = new Map();

    for (const sale of daySales) {
      const cashier = cashiers[Math.floor(random() * cashiers.length)];
      const shift = shifts.get(cashier) ?? [];
      // Two humps over the trading day: the lunch hour and the walk home.
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
        // A checkout is usually one thing, sometimes a pair, rarely three.
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

      // A shift is a day at the counter, not the gap between its first and
      // last customer: the till is opened when the shop opens and counted
      // when it shuts, whether or not anybody bought anything at either end.
      // The drift either side of the hour is what makes one shift punctual
      // and the next one late.
      const openTarget =
        midnight + TRADING_OPEN_HOUR * HOUR + Math.round((random() - 0.6) * 34 * MINUTE);
      const closeTarget =
        midnight + TRADING_CLOSE_HOUR * HOUR + Math.round((random() - 0.55) * 40 * MINUTE);

      sessions.push({
        id: `RG-${date}-${cashier}`,
        cashier,
        date,
        // Whatever the clock says, a till cannot have been shut before it
        // rang somebody up: the takings are what the shift has to contain.
        openedAt: Math.min(openTarget, orders[0].at - 2 * MINUTE),
        closedAt: Math.max(
          closeTarget,
          orders[orders.length - 1].at + 2 * MINUTE,
        ),
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

/**
 * The heatmap's grid: a row per day (or per cashier, when the reader has
 * narrowed to that question) and a cell per hour of the trading day.
 *
 * The hour range is taken from the shifts themselves rather than fixed at
 * midnight-to-midnight — the question is when the counter was busy while it
 * was open, and two thirds of a 24-hour axis would be empty by definition.
 */
export function selectHeatmap(sessions, { start, end, groupBy = "day" }) {
  const inRange = sessions.filter(
    (session) => session.date >= start && session.date <= end,
  );

  const hours = tradingHours(inRange);
  const buckets = new Map();

  for (const session of inRange) {
    const key = groupBy === "cashier" ? session.cashier : session.date;
    const bucket =
      buckets.get(key) ??
      hours.map((hour) => ({ hour, orders: 0, revenue: 0, units: 0 }));

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
    // Days read newest first, the way every other list in the app does;
    // cashiers read alphabetically, because they have no order of their own.
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

/**
 * How many times somebody came to the counter in a date range.
 *
 * The ledger keeps a row per product, so counting rows counts items rather
 * than customers — a basket of three is three rows and one order. Each row
 * carries the checkout it belonged to, so the orders are what is distinct
 * about those rows, and the count is read from the same ledger as every other
 * figure on the reports screen rather than from a second source that could
 * drift away from it.
 */
export function countOrders(sales, start, end) {
  const orders = new Set();
  for (const sale of sales) {
    if (sale.date >= start && sale.date <= end) {
      orders.add(sale.orderId ?? sale.id);
    }
  }
  return orders.size;
}
