import { api } from "./client";

export function normalizeEntry(entry) {
  return { ...entry, at: new Date(entry.at).getTime() };
}

export const normalizeEntries = (entries) =>
  (entries ?? []).map(normalizeEntry);

export const activity = {
  list: (limit) =>
    api
      .get(`/activity${limit ? `?limit=${limit}` : ""}`)
      .then((data) => normalizeEntries(data.entries)),
  markRead: () =>
    api.post("/activity/read").then((data) => new Date(data.readThrough).getTime()),
};
