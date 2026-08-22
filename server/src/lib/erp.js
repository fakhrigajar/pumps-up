/**
 * Ported from src/data/erp.js on the client — the SKU-generation algorithm
 * (so the server can be the authoritative generator instead of trusting a
 * client-computed id) and the seed-only catalogue/history generators (used
 * once by scripts/seed.js to reproduce today's demo dataset in MongoDB).
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SHOE_SIZES = [36, 37, 38, 39, 40];
export const categories = ["Shoe", "Bag"];

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
  black: "BLK", white: "WHT", blue: "BLU", navy: "NVY", red: "RED",
  maroon: "MAR", burgundy: "BUR", green: "GRN", olive: "OLV", mint: "MNT",
  yellow: "YEL", gold: "GLD", orange: "ORG", coral: "COR", pink: "PNK",
  purple: "PUR", brown: "BRN", tan: "TAN", beige: "BEI", taupe: "TPE",
  khaki: "KHK", cream: "CRM", ivory: "IVR", grey: "GRY", gray: "GRY",
  charcoal: "CHR", silver: "SLV", teal: "TEL", multi: "MUL",
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

/** Seed-time uniqueness: retried against an in-memory `Set` until the id it
 * produces is free. Used only by the seed script, which generates the whole
 * catalogue in one pass and can hold every id used so far in memory. */
export function pickDigits(idFor, usedIds, random = Math.random) {
  let digits = randomDigits4(random);
  while (usedIds.has(idFor(digits))) digits = randomDigits4(random);
  usedIds.add(idFor(digits));
  return digits;
}

/**
 * Live-request uniqueness: retried against the database, since a concurrent
 * request could claim an id between this process's requests — the
 * authoritative version of the check the client used to do against a
 * snapshot of its own product list.
 */
export async function pickDigitsAsync(idFor, exists, random = Math.random, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const digits = randomDigits4(random);
    const candidate = idFor(digits);
    // eslint-disable-next-line no-await-in-loop
    if (!(await exists(candidate))) return digits;
  }
  throw new Error("Could not find a free product id after 20 attempts.");
}

// ---------------------------------------------------------------------------
// Seed-only: the demo catalogue and sales history, reproduced byte-for-byte
// from the client's old module-load-time generation so the seeded database
// looks exactly like the app used to before it had a backend.

const shoeFamilies = [
  { name: "Classic Court Sneaker", colors: { Black: { 36: 24, 37: 33, 38: 36, 39: 27, 40: 18 }, White: { 36: 16, 37: 22, 38: 24, 39: 18, 40: 12 } }, purchasePrice: 28, sellingPrice: 64.99, unitsBase: 3200 },
  { name: "Retro Runner", colors: { Navy: { 36: 12, 37: 21, 38: 30, 39: 23, 40: 13 }, Sand: { 36: 8, 37: 14, 38: 20, 39: 15, 40: 9 } }, purchasePrice: 32, sellingPrice: 72.5, unitsBase: 2650 },
  { name: "Canvas Low-Top", colors: { White: { 36: 33, 37: 39, 38: 36, 39: 22, 40: 14 }, Black: { 36: 27, 37: 31, 38: 29, 39: 18, 40: 11 } }, purchasePrice: 14.5, sellingPrice: 34.99, unitsBase: 4100 },
  { name: "Trail Hiker Boot", colors: { Brown: { 36: 7, 37: 10, 38: 12, 39: 11, 40: 8 }, Olive: { 36: 5, 37: 8, 38: 10, 39: 9, 40: 6 } }, purchasePrice: 46, sellingPrice: 99, unitsBase: 1450 },
  { name: "Slip-On Loafer", colors: { Black: { 36: 14, 37: 17, 38: 16, 39: 11, 40: 7 }, Beige: { 36: 11, 37: 13, 38: 12, 39: 9, 40: 5 } }, purchasePrice: 22, sellingPrice: 49.99, unitsBase: 1900 },
  { name: "Platform High-Top", colors: { White: { 36: 10, 37: 15, 38: 14, 39: 9, 40: 6 }, Black: { 36: 8, 37: 11, 38: 10, 39: 7, 40: 4 } }, purchasePrice: 30, sellingPrice: 68, unitsBase: 1600 },
  { name: "Suede Chelsea Boot", colors: { Taupe: { 36: 5, 37: 8, 38: 9, 39: 7, 40: 5 }, Black: { 36: 3, 37: 6, 38: 7, 39: 5, 40: 4 } }, purchasePrice: 52, sellingPrice: 112, unitsBase: 780 },
  { name: "Mesh Trainer", colors: { Grey: { 36: 19, 37: 23, 38: 21, 39: 14, 40: 10 }, Coral: { 36: 15, 37: 19, 38: 17, 39: 12, 40: 8 } }, purchasePrice: 19, sellingPrice: 42.5, unitsBase: 2300 },
];

const bagProducts = [
  { name: "Everyday Tote", category: "Bag", stock: 180, purchasePrice: 16, sellingPrice: 39.99, unitsBase: 1350 },
  { name: "Weekend Duffel", category: "Bag", stock: 96, purchasePrice: 24, sellingPrice: 58, unitsBase: 820 },
  { name: "Mini Crossbody", category: "Bag", stock: 240, purchasePrice: 11, sellingPrice: 27.5, unitsBase: 1750 },
  { name: "Structured Backpack", category: "Bag", stock: 140, purchasePrice: 21, sellingPrice: 52, unitsBase: 990 },
  { name: "Leather Satchel", category: "Bag", stock: 58, purchasePrice: 45, sellingPrice: 98, unitsBase: 410 },
  { name: "Drawstring Gym Sack", category: "Bag", stock: 310, purchasePrice: 5.5, sellingPrice: 14.99, unitsBase: 640 },
];

function expandShoeFamily({ name, colors, purchasePrice, sellingPrice, unitsBase }, seedRandom, seedIds) {
  const colorNames = Object.keys(colors);
  const unitsIn = (color) => SHOE_SIZES.reduce((sum, size) => sum + (colors[color][size] ?? 0), 0);
  const totalStock = colorNames.reduce((sum, color) => sum + unitsIn(color), 0);

  return colorNames.flatMap((color) =>
    SHOE_SIZES.filter((size) => colors[color][size] > 0).map((size) => {
      const digits = pickDigits((d) => sizedSku(colorSkuStem(name, color, d), size), seedIds, seedRandom);
      return {
        sku: sizedSku(colorSkuStem(name, color, digits), size),
        name: listingName(name, color, size),
        category: "Shoe",
        color,
        size,
        stock: colors[color][size],
        purchasePrice,
        sellingPrice,
        unitsBase: Math.max(1, Math.round((unitsBase * colors[color][size]) / totalStock)),
      };
    }),
  );
}

function expandBag(bag, seedRandom, seedIds) {
  const digits = pickDigits((d) => bagSkuStem(bag.name, d), seedIds, seedRandom);
  return { ...bag, sku: bagSkuStem(bag.name, digits) };
}

/** The demo catalogue, plus `unitsBase` (a seed-only weighting value, dropped
 * before insertion into the `Product` collection — see scripts/seed.js). */
export function buildCatalogue() {
  const seedRandom = mulberry32(4711);
  const seedIds = new Set();
  return [
    ...shoeFamilies.flatMap((family) => expandShoeFamily(family, seedRandom, seedIds)),
    ...bagProducts.map((bag) => expandBag(bag, seedRandom, seedIds)),
  ];
}

const HISTORY_DAYS = 92;

/** 92 days of seeded sales, weighted by each product's `unitsBase` — ported
 * unchanged from the client's `buildSalesHistory` (previously un-exported). */
export function buildSalesHistory(products) {
  const random = mulberry32(97);
  const entries = [];
  const today = new Date();
  let serial = 0;

  const totalWeight = products.reduce((sum, product) => sum + product.unitsBase, 0);
  function pickProduct() {
    let roll = random() * totalWeight;
    for (const product of products) {
      roll -= product.unitsBase;
      if (roll <= 0) return product;
    }
    return products[products.length - 1];
  }

  for (let back = HISTORY_DAYS - 1; back >= 0; back -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const count = (weekend ? 5 : 3) + Math.floor(random() * 4);

    for (let i = 0; i < count; i += 1) {
      const product = pickProduct();
      const discount = random() < 0.35 ? 0.05 + random() * 0.2 : 0;
      serial += 1;
      entries.push({
        id: `SH-${String(serial).padStart(5, "0")}`,
        date: toIsoDate(day),
        sku: product.sku,
        name: product.name,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        soldFor: Math.round(product.sellingPrice * (1 - discount) * 100) / 100,
        qty: 1 + Math.floor(random() * 3),
        payment: random() < 0.58 ? "card" : "cash",
      });
    }
  }

  return entries.reverse();
}

function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
