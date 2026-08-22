import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listProducts,
  createProducts,
  updateProduct,
  deleteProduct,
  returnProduct,
} from "../services/products.service.js";

export const productsRouter = Router();

productsRouter.use(requireAuth);

// Both roles read the catalogue (Inventory is admin-only, but Sales — open
// to cashiers too — needs the same full list for its own search).
productsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const products = await listProducts();
    res.json({ products });
  }),
);

productsRouter.post(
  "/",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const result = await createProducts(req.body?.products, { actor: req.user.login });
    res.status(201).json(result);
  }),
);

productsRouter.patch(
  "/:sku",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const result = await updateProduct(req.params.sku, req.body ?? {}, { actor: req.user.login });
    res.json(result);
  }),
);

productsRouter.delete(
  "/:sku",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const result = await deleteProduct(req.params.sku, { actor: req.user.login });
    res.json(result);
  }),
);

productsRouter.post(
  "/:sku/return",
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const { units, reason } = req.body ?? {};
    const result = await returnProduct(req.params.sku, units, reason, { actor: req.user.login });
    res.json(result);
  }),
);
