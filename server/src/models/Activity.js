import { Schema, model } from "mongoose";

const changeSchema = new Schema(
  { field: String, from: Schema.Types.Mixed, to: Schema.Types.Mixed },
  { _id: false },
);

/** The audit trail — written server-side as a side effect of every mutation,
 * never client-constructed the way the old `logAction` was. */
const activitySchema = new Schema(
  {
    messageKey: { type: String, required: true },
    name: { type: String, default: "" },
    sku: { type: String, default: "" },
    actor: { type: String, default: null },
    reason: { type: String, default: null },
    changes: { type: [changeSchema], default: null },
    at: { type: Date, required: true, default: Date.now, index: true },
  },
  // `virtuals: true` so the `id` string virtual (Mongoose's `_id.toString()`)
  // is included on the way out — the client keys its activity rows by
  // `entry.id`, the same field name the old client-assigned serial used.
  { timestamps: false, toJSON: { virtuals: true } },
);

export const Activity = model("Activity", activitySchema);
