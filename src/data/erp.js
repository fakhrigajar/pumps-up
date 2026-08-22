import { barcodeValue } from "../lib/barcode";

/**
 * The product catalogue and sales ledger now live in MongoDB, fetched
 * through src/api/. What is left here is what was never "data" in the first
 * place: the search/lookup helpers a page runs over whatever list it was
 * handed, and the SKU-generation algorithm — still used client-side for an
 * instant id preview while adding a product, with the server as the
 * authoritative generator (server/src/lib/erp.js is the same algorithm).
 */

export const dateRanges = [
  { id: "3m", labelKey: "range.3m", monthsBack: 3 },
  { id: "6m", labelKey: "range.6m", monthsBack: 6 },
  { id: "12m", labelKey: "range.12m", monthsBack: 12 },
];

export function selectOutOfStock(products) {
  return products.filter((product) => product.stock === 0);
}

/**
 * The product search, shared by Inventory and Sales so the placeholder over
 * the box tells the truth on both. Name, id and label number all match on a
 * substring: the number is there so a scanner pointed at the search box —
 * which types the digits and presses Enter — lands on the right row.
 */
export function filterProducts(products, query) {
  const term = query.trim().toLowerCase();
  if (!term) return products;
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      barcodeValue(product.sku).includes(term),
  );
}

/**
 * The one product a scanner just read, or null.
 *
 * Exact and whole-string where `filterProducts` is fuzzy and partial: a
 * scanner reports the number under the bars with no ambiguity to resolve, so
 * a near miss here is a wrong product rung up rather than a shorter list to
 * choose from.
 */
export function findByBarcode(products, code) {
  const digits = String(code).trim();
  if (!digits) return null;
  return (
    products.find((product) => barcodeValue(product.sku) === digits) ?? null
  );
}

export const SHOE_SIZES = [36, 37, 38, 39, 40];

export const categories = ["Shoe", "Bag"];

/** Stock at or under this many units is worth restocking before it runs out.
 * Display-only here (the LowStock panel's copy and bar math) — the server
 * (server/src/lib/dashboard.js) uses the same number to decide which
 * products actually populate `inventory.low`; keep the two in sync. */
export const LOW_STOCK_THRESHOLD = 6;

/**
 * Product id format: `PU` + first 3 letters of the product name + a 3-letter
 * color code + a random 4-digit number, with the stocked size appended for a
 * Shoe listing — e.g. "Nike Air Force", Blue, size 37 → "PUNIKBLU192337".
 * A Bag has no color or size, so its id stops after the random digits.
 *
 * The letters and the color code identify *what* the listing is; the random
 * digits are what actually make it unique. They are drawn per *variant* — one
 * fresh number for every color and size — so size 37 and size 38 of the same
 * color share nothing but their prefix (`PUNIKBLU192337`, `PUNIKBLU850438`).
 * Each variant is its own listing with its own stock and its own label, so
 * each gets an id no arithmetic on another one can produce.
 *
 * The id computed here is only ever a *preview*: the server (see
 * server/src/lib/erp.js) runs the same algorithm and is what actually
 * enforces uniqueness against the live catalogue.
 */

const LETTER_MAP = {
  ə: "e",
  ı: "i",
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch",
  ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya",
};

/**
 * `text`, transliterated and stripped to plain a–z0–9, uppercased and cut to
 * `length` characters — "Nike Air Force" → "NIK", "Чёрный" → "CHE". Shared by
 * `productCode` and `colorAbbreviation`'s fallback; empty when `text` has no
 * letters a transliteration can reach (e.g. an emoji name).
 */
function letterCode(text, length = 3) {
  const ascii = [...text.toLowerCase().normalize("NFD")]
    .map((character) => LETTER_MAP[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]/g, "");
  return ascii.slice(0, length).toUpperCase();
}

/** The product name's contribution to the id: its first 3 letters. */
export function productCode(name) {
  return letterCode(name) || "PRD";
}

/**
 * Common apparel color names to their standard 3-letter abbreviation, matched
 * on the trimmed, lowercased color name. A color that isn't in this table —
 * including one typed in Russian or Azerbaijani, which this table doesn't
 * attempt to cover — falls back to `letterCode`, the same first-3-letters
 * scheme `productCode` uses.
 */
const COLOR_ABBREVIATIONS = {
  black: "BLK",
  white: "WHT",
  blue: "BLU",
  navy: "NVY",
  red: "RED",
  maroon: "MAR",
  burgundy: "BUR",
  green: "GRN",
  olive: "OLV",
  mint: "MNT",
  yellow: "YEL",
  gold: "GLD",
  orange: "ORG",
  coral: "COR",
  pink: "PNK",
  purple: "PUR",
  brown: "BRN",
  tan: "TAN",
  beige: "BEI",
  taupe: "TPE",
  khaki: "KHK",
  cream: "CRM",
  ivory: "IVR",
  grey: "GRY",
  gray: "GRY",
  charcoal: "CHR",
  silver: "SLV",
  teal: "TEL",
  multi: "MUL",
};

/** The color's contribution to the id: a standard code, or its first 3 letters. */
export function colorAbbreviation(name) {
  const key = name.trim().toLowerCase();
  return COLOR_ABBREVIATIONS[key] ?? letterCode(name) ?? "COL";
}

/** A fresh 4-digit id suffix, drawn client-side for the live preview. */
export function randomDigits4(random = Math.random) {
  return String(Math.floor(1000 + random() * 9000));
}

/** "Nike Air Force" + "Blue" + "1923" → "PUNIKBLU1923", one variant's id stem,
 * a size away from being an id. The digits belong to the variant, not to the
 * color: the next size of the same color draws its own. */
export function colorSkuStem(name, color, digits) {
  return `PU${productCode(name)}${colorAbbreviation(color)}${digits}`;
}

/** "Nike Air Force" + "Blue" → "PUNIKBLU", everything a color's sizes do
 * share — the part of the id that is decided before the digits are drawn. */
export function colorCodePrefix(name, color) {
  return `PU${productCode(name)}${colorAbbreviation(color)}`;
}

/** "Everyday Tote" + "4821" → "PUEVE4821" — a Bag's whole id; it has no
 * color or size to append. */
export function bagSkuStem(name, digits) {
  return `PU${productCode(name)}${digits}`;
}

/** A stem plus its stocked size, with nothing between them: "PUNIKBLU1923" +
 * 37 → "PUNIKBLU192337". */
export function sizedSku(stem, size) {
  return `${stem}${size}`;
}

export function listingName(name, color, size) {
  return [name, color, size].filter(Boolean).join(" ");
}

/**
 * The random digits for one listing, retried against `usedIds` until the id
 * they produce is free. `usedIds` is the running set of ids this Add form has
 * minted so far in the same submit — the server is what checks against the
 * live catalogue.
 */
export function pickDigits(idFor, usedIds, random = Math.random) {
  let digits = randomDigits4(random);
  while (usedIds.has(idFor(digits))) digits = randomDigits4(random);
  usedIds.add(idFor(digits));
  return digits;
}
