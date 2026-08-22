import { Schema, model } from "mongoose";

/**
 * The flat sales ledger — one row per product per checkout. Mirrors the old
 * client's `sales` array exactly, so the ported dashboard/report selectors in
 * lib/dashboard.js and lib/register.js can run over it unchanged.
 */
const saleLineSchema = new Schema(
  {
    id: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    cashier: { type: String, default: null, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    sku: { type: String, required: true, index: true },
    name: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    soldFor: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    payment: { type: String, required: true, enum: ["cash", "card"] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const SaleLine = model("SaleLine", saleLineSchema);
