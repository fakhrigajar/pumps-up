import { barcodeValue } from "../lib/barcode";

export const dateRanges = [
  { id: "3m", labelKey: "range.3m", monthsBack: 3 },
  { id: "6m", labelKey: "range.6m", monthsBack: 6 },
  { id: "12m", labelKey: "range.12m", monthsBack: 12 },
];

export function selectOutOfStock(products) {
  return products.filter((product) => product.stock === 0);
}

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

export function findByBarcode(products, code) {
  const digits = String(code).trim();
  if (!digits) return null;
  return (
    products.find((product) => barcodeValue(product.sku) === digits) ?? null
  );
}

export const SHOE_SIZES = [36, 37, 38, 39, 40];

export const categories = ["Shoe", "Bag"];

export const LOW_STOCK_THRESHOLD = 6;

const LETTER_MAP = {
  ə: "e",
  ı: "i",
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch",
  ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya",
};

function letterCode(text, length = 3) {
  const ascii = [...text.toLowerCase().normalize("NFD")]
    .map((character) => LETTER_MAP[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]/g, "");
  return ascii.slice(0, length).toUpperCase();
}

export function productCode(name) {
  return letterCode(name) || "PRD";
}

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

export function colorAbbreviation(name) {
  const key = name.trim().toLowerCase();
  return COLOR_ABBREVIATIONS[key] ?? letterCode(name) ?? "COL";
}

export function randomDigits4(random = Math.random) {
  return String(Math.floor(1000 + random() * 9000));
}

export function colorSkuStem(name, color, digits) {
  return `PU${productCode(name)}${colorAbbreviation(color)}${digits}`;
}

export function colorCodePrefix(name, color) {
  return `PU${productCode(name)}${colorAbbreviation(color)}`;
}

export function bagSkuStem(name, digits) {
  return `PU${productCode(name)}${digits}`;
}

export function sizedSku(stem, size) {
  return `${stem}${size}`;
}

export function listingName(name, color, size) {
  return [name, color, size].filter(Boolean).join(" ");
}

export function baseName({ name, color, size }) {
  const variant = [color, size].filter(Boolean).join(" ");
  if (!variant || !name.endsWith(` ${variant}`)) return name;
  return name.slice(0, -variant.length - 1);
}

export function pickDigits(idFor, usedIds, random = Math.random) {
  let digits = randomDigits4(random);
  while (usedIds.has(idFor(digits))) digits = randomDigits4(random);
  usedIds.add(idFor(digits));
  return digits;
}
