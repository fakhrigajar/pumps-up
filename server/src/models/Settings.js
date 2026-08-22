import { Schema, model } from "mongoose";

/**
 * A singleton document — one shop, one settings row. `key` is always
 * `"store"`; services fetch/upsert by that fixed key rather than an id.
 * `labelTemplate` is stored as-is (already normalized by
 * lib/labelTemplate.js's `normalizeTemplate` before it ever reaches here),
 * since its shape is a nested design document, not a relational one.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    currency: { type: String, required: true },
    opensAt: { type: String, required: true },
    closesAt: { type: String, required: true },
    labelTemplate: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const Settings = model("Settings", settingsSchema);
