import { api } from "./client";

export const orders = {
  create: (payment, lines) => api.post("/orders", { payment, lines }),
  sessions: (cashier) => api.get(`/orders/sessions${cashier ? `?cashier=${encodeURIComponent(cashier)}` : ""}`).then((data) => data.sessions),
  mine: () => api.get("/orders/sessions/mine").then((data) => data.session),
  open: () => api.post("/orders/sessions/open").then((data) => data.session),
  close: () => api.post("/orders/sessions/close").then((data) => data.session),
};
