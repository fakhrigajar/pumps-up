import { api } from "./client";

export const reports = {
  dashboard: (monthsBack) => api.get(`/reports/dashboard?monthsBack=${monthsBack}`),
  ledger: (start, end, groupBy) =>
    api.get(`/reports/ledger?start=${start}&end=${end}&groupBy=${groupBy}`),
};
