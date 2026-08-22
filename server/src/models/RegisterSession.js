import { Schema, model } from "mongoose";

const orderLineSchema = new Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    soldFor: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    id: { type: String, required: true },
    at: { type: Date, required: true },
    payment: { type: String, required: true, enum: ["cash", "card"] },
    lines: { type: [orderLineSchema], default: [] },
  },
  { _id: false },
);

/** A cashier's shift, from open to close, with every checkout rung up on it
 * embedded — mirrors the old client's `sessions` array shape exactly. */
const registerSessionSchema = new Schema(
  {
    cashier: { type: String, required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    openedAt: { type: Date, required: true },
    closedAt: { type: Date, default: null },
    orders: { type: [orderSchema], default: [] },
  },
  { timestamps: false },
);

registerSessionSchema.index({ cashier: 1, closedAt: 1 });

export const RegisterSession = model("RegisterSession", registerSessionSchema);
