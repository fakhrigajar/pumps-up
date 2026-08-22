import { api } from "./client";

export const auth = {
  me: () => api.get("/auth/me"),
  login: (login, password) => api.post("/auth/login", { login, password }),
  logout: () => api.post("/auth/logout"),
};
