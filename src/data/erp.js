import { barcodeValue } from "../lib/barcode";
import {
  addMonths,
  datesBetween,
  isWithin,
  isoParts,
  splitRangeInHalf,
  startOfMonthIso,
  toIsoDate,
  todayIso,
} from "../lib/dates";

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

export const dateRanges = [
  { id: "3m", labelKey: "range.3m", monthsBack: 3 },
  { id: "6m", labelKey: "range.6m", monthsBack: 6 },
  { id: "12m", labelKey: "range.12m", monthsBack: 12 },
];

const saleRevenue = (sale) => sale.soldFor * sale.qty;
const saleCost = (sale) => sale.purchasePrice * sale.qty;

export function trailingWindow(monthsBack) {
  const end = todayIso();
  const { year, monthIndex } = isoParts(end);
  const from = addMonths(year, monthIndex, -(monthsBack - 1));
  return { start: startOfMonthIso(from.year, from.monthIndex), end };
}

export function selectRealKpis(sales, monthsBack) {
  const { start, end } = trailingWindow(monthsBack);
  const days = datesBetween(start, end);

  const byDay = new Map();
  for (const sale of sales) {
    if (!isWithin(sale.date, start, end)) continue;
    const bucket = byDay.get(sale.date) ?? { revenue: 0, cost: 0, orders: 0 };
    bucket.revenue += saleRevenue(sale);
    bucket.cost += saleCost(sale);
    bucket.orders += 1;
    byDay.set(sale.date, bucket);
  }
  const daily = days.map((date) => byDay.get(date) ?? { revenue: 0, cost: 0, orders: 0 });

  const { previous, current } = splitRangeInHalf(start, end);
  const sumOver = (range, pick) =>
    days.reduce(
      (total, date, index) => (isWithin(date, range.start, range.end) ? total + pick(daily[index]) : total),
      0,
    );

  const revenueNow = sumOver(current, (d) => d.revenue);
  const revenueBefore = sumOver(previous, (d) => d.revenue);
  const ordersNow = sumOver(current, (d) => d.orders);
  const ordersBefore = sumOver(previous, (d) => d.orders);
  const costNow = sumOver(current, (d) => d.cost);
  const costBefore = sumOver(previous, (d) => d.cost);

  const delta = (now, before) => (before ? ((now - before) / before) * 100 : 0);
  const marginNow = revenueNow ? ((revenueNow - costNow) / revenueNow) * 100 : 0;
  const marginBefore = revenueBefore ? ((revenueBefore - costBefore) / revenueBefore) * 100 : 0;
  const aovNow = ordersNow ? revenueNow / ordersNow : 0;
  const aovBefore = ordersBefore ? revenueBefore / ordersBefore : 0;

  return [
    {
      id: "revenue",
      labelKey: "kpi.revenue",
      value: revenueNow,
      format: "currency",
      delta: delta(revenueNow, revenueBefore),
      upIsGood: true,
      spark: daily.map((d) => d.revenue),
    },
    {
      id: "orders",
      labelKey: "kpi.orders",
      value: ordersNow,
      format: "number",
      delta: delta(ordersNow, ordersBefore),
      upIsGood: true,
      spark: daily.map((d) => d.orders),
    },
    {
      id: "margin",
      labelKey: "kpi.margin",
      value: marginNow,
      format: "percent",
      delta: marginNow - marginBefore,
      deltaUnit: "pp",
      upIsGood: true,
      spark: daily.map((d) => (d.revenue ? ((d.revenue - d.cost) / d.revenue) * 100 : 0)),
    },
    {
      id: "aov",
      labelKey: "kpi.aov",
      value: aovNow,
      format: "currency0",
      delta: delta(aovNow, aovBefore),
      upIsGood: true,
      spark: daily.map((d) => (d.orders ? d.revenue / d.orders : 0)),
    },
  ];
}

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

export const SHOE_SIZES = [36, 37, 38, 39, 40];

export const categories = ["Shoe", "Bag"];

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

/** A fresh 4-digit id suffix. `random` is swappable so seed data can draw
 * from the same seeded generator sales history uses, keeping the demo
 * catalogue byte-stable across reloads; the live Add form uses `Math.random`. */
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
 * they produce is free. `usedIds` is mutated (the winning id is added) so the
 * next call — the next size, the next color, the next family — never repeats
 * it; the seed catalogue and a live Add both call this, so both get the same
 * guarantee.
 */
export function pickDigits(idFor, usedIds, random = Math.random) {
  let digits = randomDigits4(random);
  while (usedIds.has(idFor(digits))) digits = randomDigits4(random);
  usedIds.add(idFor(digits));
  return digits;
}

const seedRandom = mulberry32(4711);
const seedIds = new Set();

function expandShoeFamily({ name, colors, purchasePrice, sellingPrice, unitsBase }) {
  const colorNames = Object.keys(colors);
  const unitsIn = (color) =>
    SHOE_SIZES.reduce((sum, size) => sum + (colors[color][size] ?? 0), 0);
  const totalStock = colorNames.reduce((sum, color) => sum + unitsIn(color), 0);

  return colorNames.flatMap((color) =>
    SHOE_SIZES.filter((size) => colors[color][size] > 0).map((size) => {
      const digits = pickDigits(
        (d) => sizedSku(colorSkuStem(name, color, d), size),
        seedIds,
        seedRandom,
      );
      return {
        sku: sizedSku(colorSkuStem(name, color, digits), size),
        name: listingName(name, color, size),
        category: "Shoe",
        color,
        size,
        stock: colors[color][size],
        purchasePrice,
        sellingPrice,
        unitsBase: Math.max(
          1,
          Math.round((unitsBase * colors[color][size]) / totalStock),
        ),
      };
    }),
  );
}

const shoeFamilies = [
  {
    name: "Classic Court Sneaker",
    colors: {
      Black: { 36: 24, 37: 33, 38: 36, 39: 27, 40: 18 },
      White: { 36: 16, 37: 22, 38: 24, 39: 18, 40: 12 },
    },
    purchasePrice: 28,
    sellingPrice: 64.99,
    unitsBase: 3200,
  },
  {
    name: "Retro Runner",
    colors: {
      Navy: { 36: 12, 37: 21, 38: 30, 39: 23, 40: 13 },
      Sand: { 36: 8, 37: 14, 38: 20, 39: 15, 40: 9 },
    },
    purchasePrice: 32,
    sellingPrice: 72.5,
    unitsBase: 2650,
  },
  {
    name: "Canvas Low-Top",
    colors: {
      White: { 36: 33, 37: 39, 38: 36, 39: 22, 40: 14 },
      Black: { 36: 27, 37: 31, 38: 29, 39: 18, 40: 11 },
    },
    purchasePrice: 14.5,
    sellingPrice: 34.99,
    unitsBase: 4100,
  },
  {
    name: "Trail Hiker Boot",
    colors: {
      Brown: { 36: 7, 37: 10, 38: 12, 39: 11, 40: 8 },
      Olive: { 36: 5, 37: 8, 38: 10, 39: 9, 40: 6 },
    },
    purchasePrice: 46,
    sellingPrice: 99,
    unitsBase: 1450,
  },
  {
    name: "Slip-On Loafer",
    colors: {
      Black: { 36: 14, 37: 17, 38: 16, 39: 11, 40: 7 },
      Beige: { 36: 11, 37: 13, 38: 12, 39: 9, 40: 5 },
    },
    purchasePrice: 22,
    sellingPrice: 49.99,
    unitsBase: 1900,
  },
  {
    name: "Platform High-Top",
    colors: {
      White: { 36: 10, 37: 15, 38: 14, 39: 9, 40: 6 },
      Black: { 36: 8, 37: 11, 38: 10, 39: 7, 40: 4 },
    },
    purchasePrice: 30,
    sellingPrice: 68,
    unitsBase: 1600,
  },
  {
    name: "Suede Chelsea Boot",
    colors: {
      Taupe: { 36: 5, 37: 8, 38: 9, 39: 7, 40: 5 },
      Black: { 36: 3, 37: 6, 38: 7, 39: 5, 40: 4 },
    },
    purchasePrice: 52,
    sellingPrice: 112,
    unitsBase: 780,
  },
  {
    name: "Mesh Trainer",
    colors: {
      Grey: { 36: 19, 37: 23, 38: 21, 39: 14, 40: 10 },
      Coral: { 36: 15, 37: 19, 38: 17, 39: 12, 40: 8 },
    },
    purchasePrice: 19,
    sellingPrice: 42.5,
    unitsBase: 2300,
  },
];

const bagProducts = [
  {
    name: "Everyday Tote",
    category: "Bag",
    stock: 180,
    purchasePrice: 16,
    sellingPrice: 39.99,
    unitsBase: 1350,
  },
  {
    name: "Weekend Duffel",
    category: "Bag",
    stock: 96,
    purchasePrice: 24,
    sellingPrice: 58,
    unitsBase: 820,
  },
  {
    name: "Mini Crossbody",
    category: "Bag",
    stock: 240,
    purchasePrice: 11,
    sellingPrice: 27.5,
    unitsBase: 1750,
  },
  {
    name: "Structured Backpack",
    category: "Bag",
    stock: 140,
    purchasePrice: 21,
    sellingPrice: 52,
    unitsBase: 990,
  },
  {
    name: "Leather Satchel",
    category: "Bag",
    stock: 58,
    purchasePrice: 45,
    sellingPrice: 98,
    unitsBase: 410,
  },
  {
    name: "Drawstring Gym Sack",
    category: "Bag",
    stock: 310,
    purchasePrice: 5.5,
    sellingPrice: 14.99,
    unitsBase: 640,
  },
];

/** A Bag has one listing, no color or size — just its own generated id. */
function expandBag(bag) {
  const digits = pickDigits((d) => bagSkuStem(bag.name, d), seedIds, seedRandom);
  return { ...bag, sku: bagSkuStem(bag.name, digits) };
}

export const products = [
  ...shoeFamilies.flatMap(expandShoeFamily),
  ...bagProducts.map(expandBag),
];

const HISTORY_DAYS = 92;

function buildSalesHistory() {
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
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - back,
    );
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

export const salesHistory = buildSalesHistory();
