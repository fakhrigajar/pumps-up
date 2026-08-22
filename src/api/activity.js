import { api } from "./client";

export const activity = {
  list: (limit) => api.get(`/activity${limit ? `?limit=${limit}` : ""}`).then((data) => data.entries),
};
