import { api } from "./client";

export const users = {
  list: () => api.get("/users").then((data) => data.users),
  add: (user) => api.post("/users", user).then((data) => data.user),
  remove: (login) => api.delete(`/users/${encodeURIComponent(login)}`),
  updateSelf: (changes) => api.patch("/users/me", changes).then((data) => data.user),
};
