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
  // Answers with the moment the server recorded, which is the one the feed's
  // own timestamps are measured against — so the caller stores what came back
  // rather than the time it happened to ask.
  markRead: () =>
    api.post("/activity/read").then((data) => new Date(data.readThrough).getTime()),
};
