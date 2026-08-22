import { Schema, model } from "mongoose";

/**
 * One SKU variant — a Shoe's color×size or a Bag's single listing. `sku` is
 * the app-facing key everywhere else (sale lines, order lines, labels); the
 * Mongo `_id` is only ever used internally.
 *
 * `unitsBase` from the old client-side generator is deliberately not stored
 * here — it was a seed-time-only weighting value nothing at runtime reads.
 */
const productSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["Shoe", "Bag"] },
    color: { type: String, trim: true },
    size: { type: Number },
    stock: { type: Number, required: true, min: 0, default: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Case-insensitive uniqueness, matching the app's existing "PUNIKBLU192337"
// vs "punikblu192337" collision check that used to happen client-side.
productSchema.index(
  { sku: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

export const Product = model("Product", productSchema);
