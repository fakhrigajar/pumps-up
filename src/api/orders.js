import { api } from "./client";
import { normalizeEntries } from "./activity";

// The server sends `openedAt`/`closedAt`/order `at` as JSON date strings
// (Mongoose serializes its `Date` fields that way); every consumer here
// does epoch-ms arithmetic or hands them straight to `formatClockTime`,
// which throws on a string (`Intl.DateTimeFormat` only accepts a number or
// a `Date`). Normalized to numbers once, at the boundary — `closedAt` stays
// `null` rather than becoming epoch 0, since `session.closedAt === null`
// is how the UI tells an open shift from a closed one.
function normalizeSession(session) {
  if (!session) return session;
  return {
    ...session,
    openedAt: new Date(session.openedAt).getTime(),
    closedAt: session.closedAt ? new Date(session.closedAt).getTime() : null,
    orders: session.orders.map((order) => ({ ...order, at: new Date(order.at).getTime() })),
  };
}

export const orders = {
  // A checkout answers with three things at once — the restocked products,
  // the cashier's now-updated session, and the "sold" entries it logged —
  // and both of the latter two carry dates the app does arithmetic on.
  create: (payment, lines) =>
    api.post("/orders", { payment, lines }).then((data) => ({
      ...data,
      session: normalizeSession(data.session),
      activity: normalizeEntries(data.activity),
    })),
  sessions: (cashier) =>
    api
      .get(`/orders/sessions${cashier ? `?cashier=${encodeURIComponent(cashier)}` : ""}`)
      .then((data) => data.sessions.map(normalizeSession)),
  mine: () => api.get("/orders/sessions/mine").then((data) => normalizeSession(data.session)),
  open: () => api.post("/orders/sessions/open").then((data) => normalizeSession(data.session)),
  close: () => api.post("/orders/sessions/close").then((data) => normalizeSession(data.session)),
};
