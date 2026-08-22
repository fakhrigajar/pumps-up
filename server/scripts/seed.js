/**
 * Resets the database to the same demo state the app used to ship with as
 * static, in-memory data: a full product catalogue, 92 days of sales
 * history, the register shifts behind it, and the 3 demo accounts (now with
 * hashed passwords instead of plaintext).
 *
 * Destructive by design — it clears Product, SaleLine, RegisterSession and
 * User before reinserting, so re-running this against a database with real
 * live orders would wipe them. Run with `npm run seed` inside server/.
 */
import bcrypt from "bcryptjs";
import { connectDb } from "../src/db.js";
import { Product } from "../src/models/Product.js";
import { User } from "../src/models/User.js";
import { SaleLine } from "../src/models/SaleLine.js";
import { RegisterSession } from "../src/models/RegisterSession.js";
import { Settings } from "../src/models/Settings.js";
import { buildCatalogue, buildSalesHistory, mulberry32 } from "../src/lib/erp.js";
import { buildRegisterHistory } from "../src/lib/register.js";
import { DEFAULT_SETTINGS } from "../src/lib/storeSettings.js";
import { DEFAULT_TEMPLATE } from "../src/lib/labelTemplate.js";

const HASH_ROUNDS = 10;

const DEMO_USERS = [
  { login: "dami", password: "pumpsup123", role: "admin" },
  { login: "aysel", password: "kassa123", role: "cashier" },
  { login: "rauf", password: "kassa456", role: "cashier" },
];

async function main() {
  await connectDb();

  console.log("[seed] clearing existing products, sales, sessions, users…");
  await Promise.all([
    Product.deleteMany({}),
    SaleLine.deleteMany({}),
    RegisterSession.deleteMany({}),
    User.deleteMany({}),
  ]);

  // The catalogue, with unitsBase kept for the sales-history weighting below,
  // stripped before it goes into the Product collection — nothing at runtime
  // reads it once seeded.
  const catalogueWithWeights = buildCatalogue();
  const products = catalogueWithWeights.map(({ unitsBase: _unitsBase, ...product }) => product);
  await Product.insertMany(products);
  console.log(`[seed] inserted ${products.length} products`);

  const salesHistory = buildSalesHistory(catalogueWithWeights);
  const cashierLogins = DEMO_USERS.filter((user) => user.role === "cashier").map((user) => user.login);
  const { sessions, stampOf } = buildRegisterHistory(salesHistory, cashierLogins, mulberry32(4931));

  const saleLines = salesHistory.map((sale) => {
    const stamp = stampOf.get(sale.id);
    return {
      id: sale.id,
      orderId: stamp?.orderId ?? sale.id,
      cashier: stamp?.cashier ?? null,
      date: sale.date,
      sku: sale.sku,
      name: sale.name,
      purchasePrice: sale.purchasePrice,
      sellingPrice: sale.sellingPrice,
      soldFor: sale.soldFor,
      qty: sale.qty,
      payment: sale.payment,
    };
  });
  await SaleLine.insertMany(saleLines);
  console.log(`[seed] inserted ${saleLines.length} sale lines`);

  const registerSessions = sessions.map((session) => ({
    cashier: session.cashier,
    date: session.date,
    openedAt: new Date(session.openedAt),
    closedAt: session.closedAt == null ? null : new Date(session.closedAt),
    orders: session.orders.map((order) => ({
      id: order.id,
      at: new Date(order.at),
      payment: order.payment,
      lines: order.lines,
    })),
  }));
  await RegisterSession.insertMany(registerSessions);
  console.log(`[seed] inserted ${registerSessions.length} register sessions`);

  const userDocs = await Promise.all(
    DEMO_USERS.map(async (user) => ({
      login: user.login,
      passwordHash: await bcrypt.hash(user.password, HASH_ROUNDS),
      role: user.role,
    })),
  );
  await User.insertMany(userDocs);
  console.log(`[seed] inserted ${userDocs.length} users (passwords hashed)`);

  await Settings.findOneAndUpdate(
    { key: "store" },
    { $set: { ...DEFAULT_SETTINGS, labelTemplate: DEFAULT_TEMPLATE } },
    { upsert: true },
  );
  console.log("[seed] store settings ready");

  console.log("\n[seed] done. Sign in with:");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.login} / ${user.password}  (${user.role})`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("[seed] failed:", error);
  process.exit(1);
});
