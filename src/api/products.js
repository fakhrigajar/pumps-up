import { api } from "./client";
import { normalizeEntries } from "./activity";

const withActivity = (data) => ({ ...data, activity: normalizeEntries(data.activity) });

export const products = {
  list: () => api.get("/products").then((data) => data.products),
  add: (rows) => api.post("/products", { products: rows }).then(withActivity),
  update: (sku, changes) => api.patch(`/products/${encodeURIComponent(sku)}`, changes).then(withActivity),
  remove: (sku) => api.delete(`/products/${encodeURIComponent(sku)}`).then(withActivity),
  returnStock: (sku, units, reason) =>
    api.post(`/products/${encodeURIComponent(sku)}/return`, { units, reason }).then(withActivity),
};
