import { Settings } from "../models/Settings.js";
import { DEFAULT_SETTINGS, normalizeSettings } from "../lib/storeSettings.js";
import { DEFAULT_TEMPLATE, normalizeTemplate } from "../lib/labelTemplate.js";

const KEY = "store";

/** The singleton settings row, created with defaults the first time
 * anything asks for it — there is nothing to seed ahead of time here. */
async function ensureDoc() {
  const doc = await Settings.findOneAndUpdate(
    { key: KEY },
    { $setOnInsert: { key: KEY, ...DEFAULT_SETTINGS, labelTemplate: DEFAULT_TEMPLATE } },
    { new: true, upsert: true },
  );
  return doc;
}

export async function getSettings() {
  const doc = await ensureDoc();
  return { version: 1, currency: doc.currency, opensAt: doc.opensAt, closesAt: doc.closesAt };
}

export async function updateSettings(changes) {
  const doc = await ensureDoc();
  const next = normalizeSettings(
    { currency: doc.currency, opensAt: doc.opensAt, closesAt: doc.closesAt, ...changes },
    doc,
  );
  doc.currency = next.currency;
  doc.opensAt = next.opensAt;
  doc.closesAt = next.closesAt;
  await doc.save();
  return { version: 1, ...next };
}

export async function getLabelTemplate() {
  const doc = await ensureDoc();
  return doc.labelTemplate;
}

export async function updateLabelTemplate(next) {
  const doc = await ensureDoc();
  const clean = normalizeTemplate(next);
  doc.labelTemplate = clean;
  doc.markModified("labelTemplate");
  await doc.save();
  return clean;
}
