import { api } from "./client";
import { normalizeEntries } from "./activity";

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
