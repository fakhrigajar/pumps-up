import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultData, defaultSettings, defaultLabelTemplate } from "../src/data.js";
import { selectDashboard } from "../src/data/dashboard.js";
import { selectLedger } from "../src/data/reports.js";
import { sessionTotals } from "../src/data/register.js";
import * as store from "../src/data/store.js";
import { todayIso } from "../src/lib/dates.js";
import { normalizeSettings } from "../src/lib/storeSettings.js";
import { normalizeTemplate } from "../src/lib/labelTemplate.js";

test("defaults supply consistent sales, shifts, users, and settings", () => {
  const data = createDefaultData();
  assert.ok(data.products.length > 0 && data.sales.length > 0 && data.activity.length > 0);
  assert.equal(new Set(data.products.map((product) => product.sku)).size, data.products.length);
  assert.ok(data.users.every((user) => /^\d{4}-\d{2}-\d{2}$/.test(user.createdAt)));
  assert.ok(data.activity.every((entry) => entry.at <= Date.now()));
  const ledgerRevenue = data.sales.reduce((sum, sale) => sum + sale.qty * sale.soldFor, 0);
  const registerRevenue = data.sessions.reduce((sum, session) => sum + sessionTotals(session).revenue, 0);
  assert.ok(Math.abs(ledgerRevenue - registerRevenue) < 0.00001);
  assert.deepEqual(normalizeSettings(defaultSettings), defaultSettings);
  assert.deepEqual(normalizeTemplate(defaultLabelTemplate), defaultLabelTemplate);
  data.products[0].stock = 0;
  assert.ok(createDefaultData().products[0].stock > 0);
});

test("cashier checkout updates stock, ledger, activity, and register together", () => {
  const initial = createDefaultData();
  const user = initial.users.find((user) => user.role === "cashier");
  const products = initial.products.slice(0, 2);
  const lines = products.map((product) => ({ sku: product.sku, qty: 2, soldFor: product.sellingPrice }));
  assert.throws(() => store.completeSale(initial, user, "card", lines), { code: "register_closed" });
  const opened = store.openRegister(initial, user.login);
  const before = selectLedger(opened.sales, opened.sessions, { start: todayIso(), end: todayIso() }, "day");
  const next = store.completeSale(opened, user, "card", lines);
  const amount = lines.reduce((sum, line) => sum + line.qty * line.soldFor, 0);
  const ledger = selectLedger(next.sales, next.sessions, { start: todayIso(), end: todayIso() }, "day");
  assert.ok(Math.abs(ledger.totals.sales - before.totals.sales - amount) < 0.00001);
  assert.equal(ledger.orderCount, before.orderCount + 1);
  assert.equal(sessionTotals(store.openSessionOf(next, user.login)).revenue, amount);
  assert.equal(next.activity.length, initial.activity.length + 2);
  for (const product of products) {
    assert.equal(next.products.find((item) => item.sku === product.sku).stock, product.stock - 2);
    assert.equal(initial.products.find((item) => item.sku === product.sku).stock, product.stock);
  }
  const dashboard = selectDashboard(next.products, next.sales, next.sessions, 3);
  assert.equal(dashboard.recentSales[0].orderId, next.sales[0].orderId);
  const closed = store.closeRegister(next, user.login);
  assert.equal(store.openSessionOf(closed, user.login), null);
  assert.throws(() => store.completeSale(closed, user, "cash", lines), { code: "register_closed" });
});

test("a checkout failure leaves all state unchanged, including repeated product lines", () => {
  const initial = createDefaultData();
  const admin = initial.users.find((user) => user.role === "admin");
  const [first, second] = initial.products;
  const snapshot = structuredClone(initial);
  const validLine = { sku: first.sku, qty: 1, soldFor: first.sellingPrice };
  assert.throws(() => store.completeSale(initial, admin, "cash", [validLine, {
    sku: second.sku, qty: second.stock + 1, soldFor: second.sellingPrice,
  }]), { code: "insufficient_stock" });
  assert.throws(() => store.completeSale(initial, admin, "cash", [
    { ...validLine, qty: first.stock }, validLine,
  ]), { code: "insufficient_stock" });
  assert.deepEqual(initial, snapshot);
});

test("inventory actions and returns share the same stock and activity", () => {
  const initial = createDefaultData();
  const product = { sku: "DEMO-BAG", name: "Demo bag", category: "Bag", stock: 2, purchasePrice: 10, sellingPrice: 20 };
  const added = store.addProducts(initial, [product]);
  const returned = store.returnProduct(added, product.sku, 3, "Customer return");
  const updated = store.updateProduct(returned, product.sku, { stock: 8, sellingPrice: 25 });
  assert.equal(updated.products.find((item) => item.sku === product.sku).stock, 8);
  assert.equal(returned.activity[0].reason, "Customer return");
  assert.equal(updated.activity[0].changes.find((change) => change.field === "stock").from, 5);
  assert.throws(() => store.addProducts(updated, [product]), { code: "sku_duplicate" });
  const removed = store.deleteProduct(updated, product.sku);
  assert.ok(!removed.products.some((item) => item.sku === product.sku));
  assert.equal(removed.activity[0].messageKey, "log.deleted");
});

test("account changes preserve register ownership and protect the last admin", () => {
  const defaults = createDefaultData();
  const cashier = defaults.users.find((user) => user.role === "cashier");
  const admin = defaults.users.find((user) => user.role === "admin");
  const initial = store.openRegister(defaults, cashier.login);
  assert.throws(() => store.updateAccount(initial, cashier.login, { password: "newpass", currentPassword: `${cashier.password}-wrong` }), { code: "current_password_mismatch" });
  const renamed = store.updateAccount(initial, cashier.login, { login: "CASHIER.NEW", password: "newpass", currentPassword: cashier.password });
  assert.equal(renamed.users.find((user) => user.login === "cashier.new").password, "newpass");
  assert.ok(store.openSessionOf(renamed, "cashier.new"));
  assert.ok(!renamed.sales.some((sale) => sale.cashier === cashier.login));
  assert.throws(() => store.deleteUser(renamed, admin.login), { code: "last_admin" });
  const added = store.addUser(renamed, { login: "NEW.USER", password: "demo123", role: "cashier" });
  assert.equal(added.users[0].createdAt, todayIso());
  assert.ok(!store.deleteUser(added, "new.user").users.some((user) => user.login === "new.user"));
});
