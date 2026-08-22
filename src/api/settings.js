import { api } from "./client";

export const settings = {
  get: () => api.get("/settings"),
  update: (changes) => api.patch("/settings", changes),
  getLabelTemplate: () => api.get("/settings/label-template"),
  saveLabelTemplate: (template) => api.patch("/settings/label-template", template),
};
