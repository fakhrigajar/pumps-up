import { Activity } from "../models/Activity.js";

const DEFAULT_LIMIT = 300;

export async function listActivity({ limit = DEFAULT_LIMIT } = {}) {
  return Activity.find()
    .sort({ at: -1 })
    .limit(Math.min(limit, 1000));
}

/**
 * Writes one activity entry as a side effect of a mutation, mirroring the
 * old client's `logAction(messageKey, product, extra)` call shape. Pass a
 * Mongoose transaction `session` when the write must commit atomically with
 * the mutation it is logging (checkout does; simple product/user edits do
 * not need to).
 */
export async function recordActivity(messageKey, subject, extra = {}, { session, actor } = {}) {
  const [doc] = await Activity.create(
    [
      {
        messageKey,
        name: subject?.name ?? "",
        sku: subject?.sku ?? "",
        actor: actor ?? null,
        reason: extra.reason || null,
        changes: extra.changes || null,
        at: new Date(),
      },
    ],
    { session },
  );
  return doc;
}
