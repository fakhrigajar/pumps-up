import { api } from "./client";

export const products = {
  list: () => api.get("/products").then((data) => data.products),
  add: (rows) => api.post("/products", { products: rows }),
  update: (sku, changes) => api.patch(`/products/${encodeURIComponent(sku)}`, changes),
  remove: (sku) => api.delete(`/products/${encodeURIComponent(sku)}`),
  returnStock: (sku, units, reason) =>
    api.post(`/products/${encodeURIComponent(sku)}/return`, { units, reason }),
};
