import { APP_NAME } from "./brand.js";
// Edit the app's default data here. No server or API is required.
import {
  SHOE_SIZES,
  bagSkuStem,
  colorSkuStem,
  listingName,
  pickDigits,
  sizedSku,
} from "./data/erp.js";
import { fromIsoDate, toIsoDate } from "./lib/dates.js";

export const defaultUsers = [
  {
    login: "admin",
    password: "admin",
    role: "admin",
    createdAt: "2026-01-05",
    activityReadThrough: 0,
  },
  {
    login: "aysel",
    password: "kassa",
    role: "cashier",
    createdAt: "2026-01-05",
    activityReadThrough: 0,
  },
  {
    login: "rauf",
    password: "kassa",
    role: "cashier",
    createdAt: "2026-01-05",
    activityReadThrough: 0,
  },
];

export const defaultSettings = {
  version: 1,
  currency: "AZN",
  opensAt: "09:00",
  closesAt: "21:00",
};

export const defaultLabelTemplate = {
  version: 1,
  width: 50,
  height: 50,
  rotate: false,
  margin: 2.5,
  storeName: APP_NAME,
  elements: {
    logo: {
      visible: true,
      x: 0,
      y: 0,
      w: 100,
      h: 11,
      align: "center",
    },
    store: {
      visible: false,
      x: 0,
      y: 0,
      w: 100,
      h: 11,
      fontSize: 8,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
    name: {
      visible: true,
      x: 0,
      y: 12,
      w: 100,
      h: 15,
      fontSize: 10,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
    color: {
      visible: true,
      x: 0,
      y: 27.5,
      w: 100,
      h: 7.5,
      fontSize: 7.5,
      fontWeight: 500,
      align: "center",
      lineHeight: 1.2,
    },
    size: {
      visible: true,
      x: 0,
      y: 35,
      w: 100,
      h: 7.5,
      fontSize: 7.5,
      fontWeight: 500,
      align: "center",
      lineHeight: 1.2,
    },
    barcode: {
      visible: true,
      x: 2,
      y: 43,
      w: 96,
      h: 24.5,
    },
    code: {
      visible: true,
      x: 0,
      y: 68,
      w: 100,
      h: 10,
      fontSize: 8,
      fontWeight: 400,
      align: "center",
      lineHeight: 1.2,
    },
    price: {
      visible: true,
      x: 0,
      y: 79.5,
      w: 100,
      h: 20.5,
      fontSize: 14,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.2,
    },
  },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

function expandShoeFamily(
  { name, colors, purchasePrice, sellingPrice, unitsBase },
  seedRandom,
  seedIds,
) {
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

function expandBag(bag, seedRandom, seedIds) {
  const digits = pickDigits(
    (d) => bagSkuStem(bag.name, d),
    seedIds,
    seedRandom,
  );
  return { ...bag, sku: bagSkuStem(bag.name, digits) };
}

function buildCatalogue() {
  const seedRandom = mulberry32(4711);
  const seedIds = new Set();
  return [
    ...shoeFamilies.flatMap((family) =>
      expandShoeFamily(family, seedRandom, seedIds),
    ),
    ...bagProducts.map((bag) => expandBag(bag, seedRandom, seedIds)),
  ];
}

const HISTORY_DAYS = 92;

function buildSalesHistory(products) {
  const random = mulberry32(97);
  const entries = [];
  const today = new Date();
  let serial = 0;

  const totalWeight = products.reduce(
    (sum, product) => sum + product.unitsBase,
    0,
  );
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

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const TRADING_OPEN_HOUR = 9;
const TRADING_CLOSE_HOUR = 21;

function buildRegisterHistory(sales, cashiers, random) {
  if (cashiers.length === 0) return { sessions: [], stampOf: new Map() };

  const byDate = new Map();
  for (const sale of sales) {
    const day = byDate.get(sale.date) ?? [];
    day.push(sale);
    byDate.set(sale.date, day);
  }

  const sessions = [];
  const stampOf = new Map();

  for (const [date, daySales] of [...byDate.entries()].sort()) {
    const midnight = fromIsoDate(date).getTime();
    const shifts = new Map();

    for (const sale of daySales) {
      const cashier = cashiers[Math.floor(random() * cashiers.length)];
      const shift = shifts.get(cashier) ?? [];
      const peak = random() < 0.45 ? 12.5 : 18;
      const hour = clampHour(peak + (random() - 0.5) * 5.5);
      shift.push({ sale, at: midnight + Math.round(hour * HOUR) });
      shifts.set(cashier, shift);
    }

    for (const [cashier, rung] of shifts) {
      rung.sort((a, b) => a.at - b.at);

      const orders = [];
      let index = 0;
      while (index < rung.length) {
        const size = random() < 0.68 ? 1 : random() < 0.85 ? 2 : 3;
        const group = rung.slice(index, index + size);
        index += group.length;

        const orderId = `${group[0].sale.id}-O`;
        for (const { sale } of group)
          stampOf.set(sale.id, { orderId, cashier });

        orders.push({
          id: orderId,
          at: group[0].at,
          payment: group[0].sale.payment,
          lines: group.map(({ sale }) => ({
            sku: sale.sku,
            name: sale.name,
            qty: sale.qty,
            soldFor: sale.soldFor,
          })),
        });
      }

      const openTarget =
        midnight +
        TRADING_OPEN_HOUR * HOUR +
        Math.round((random() - 0.6) * 34 * MINUTE);
      const closeTarget =
        midnight +
        TRADING_CLOSE_HOUR * HOUR +
        Math.round((random() - 0.55) * 40 * MINUTE);

      sessions.push({
        cashier,
        date,
        openedAt: Math.min(openTarget, orders[0].at - 2 * MINUTE),
        closedAt: Math.max(
          closeTarget,
          orders[orders.length - 1].at + 2 * MINUTE,
        ),
        orders,
      });
    }
  }

  return {
    sessions: sessions.sort((a, b) => b.openedAt - a.openedAt),
    stampOf,
  };
}

function clampHour(hour) {
  return Math.min(
    TRADING_CLOSE_HOUR - 0.4,
    Math.max(TRADING_OPEN_HOUR + 0.2, hour),
  );
}

const catalogue = buildCatalogue();
export const defaultProducts = catalogue.map(
  ({ unitsBase: _unitsBase, ...product }) => product,
);
const history = buildSalesHistory(catalogue);
const cashierLogins = defaultUsers
  .filter((user) => user.role === "cashier")
  .map((user) => user.login);
const { sessions, stampOf } = buildRegisterHistory(
  history,
  cashierLogins,
  mulberry32(4931),
);
export const defaultSessions = sessions.map((session, index) => ({
  ...session,
  id: `SHIFT-${index + 1}`,
}));
export const defaultSales = history.map((sale) => ({
  ...sale,
  ...stampOf.get(sale.id),
}));
const orderTimes = new Map(
  sessions
    .flatMap((session) => session.orders)
    .map((order) => [order.id, order.at]),
);
export const defaultActivity = defaultSales
  .slice(0, 8)
  .map((sale, index) => ({
    id: `ACT-DEMO-${index + 1}`,
    messageKey: "log.sold",
    name: sale.name,
    sku: sale.sku,
    actor: sale.cashier,
    at: Math.min(orderTimes.get(sale.orderId) ?? Date.now(), Date.now()),
  }))
  .sort((a, b) => b.at - a.at);

export function createDefaultData() {
  return structuredClone({
    products: defaultProducts,
    users: defaultUsers,
    sales: defaultSales,
    sessions: defaultSessions,
    activity: defaultActivity,
  });
}
