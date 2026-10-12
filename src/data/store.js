import { todayIso } from "../lib/dates.js";
import { findUser, isLastAdmin, normalizeLogin } from "./users.js";

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function productOf(state, sku) {
  const product = state.products.find((item) => item.sku === sku);
  if (!product) fail("product_not_found", `No product with id ${sku}.`);
  return product;
}

function activity(messageKey, product, extra = {}) {
  return { id: crypto.randomUUID(), at: Date.now(), messageKey, name: product.name, sku: product.sku, ...extra };
}

export function addProducts(state, products) {
  const used = new Set(state.products.map((product) => product.sku));
  for (const product of products) {
    if (used.has(product.sku)) fail("sku_duplicate", `Product id ${product.sku} already exists.`);
    used.add(product.sku);
  }
  return {
    ...state,
    products: [...products, ...state.products],
    activity: [...products.map((product) => activity("log.added", product)), ...state.activity],
  };
}

export function deleteProduct(state, sku) {
  const product = productOf(state, sku);
  return {
    ...state,
    products: state.products.filter((item) => item.sku !== sku),
    activity: [activity("log.deleted", product), ...state.activity],
  };
}

export function updateProduct(state, sku, changes) {
  const before = productOf(state, sku);
  const product = { ...before, ...changes, sku };
  const changed = ["name", "category", "stock", "purchasePrice", "sellingPrice"]
    .filter((field) => before[field] !== product[field])
    .map((field) => ({ field, from: before[field], to: product[field] }));
  return {
    ...state,
    products: state.products.map((item) => item.sku === sku ? product : item),
    activity: changed.length ? [activity("log.updated", product, { changes: changed }), ...state.activity] : state.activity,
  };
}

export function returnProduct(state, sku, units, reason) {
  const before = productOf(state, sku);
  if (!Number.isInteger(units) || units < 1) fail("units_invalid", "Enter a positive whole quantity.");
  if (!reason?.trim()) fail("reason_required", "Enter a return reason.");
  const product = { ...before, stock: before.stock + units };
  return {
    ...state,
    products: state.products.map((item) => item.sku === sku ? product : item),
    activity: [activity("log.returned", product, {
      reason: reason.trim(), changes: [{ field: "stock", from: before.stock, to: product.stock }],
    }), ...state.activity],
  };
}

export function openSessionOf(state, login) {
  return state.sessions.find((session) => session.cashier === login && session.closedAt === null) ?? null;
}

export function openRegister(state, login) {
  if (openSessionOf(state, login)) return state;
  return {
    ...state,
    sessions: [{ id: crypto.randomUUID(), cashier: login, date: todayIso(), openedAt: Date.now(), closedAt: null, orders: [] }, ...state.sessions],
  };
}

export function closeRegister(state, login) {
  const open = openSessionOf(state, login);
  if (!open) fail("register_not_open", "No open register to close.");
  return {
    ...state,
    sessions: state.sessions.map((session) => session.id === open.id ? { ...session, closedAt: Date.now() } : session),
  };
}

export function completeSale(state, user, payment, lines) {
  const open = openSessionOf(state, user.login);
  if (user.role === "cashier" && !open) fail("register_closed", "Open the register before selling.");
  if (!lines.length) fail("lines_required", "Add at least one product.");
  if (!["cash", "card"].includes(payment)) fail("payment_invalid", "Choose cash or card.");
  const products = state.products.map((product) => ({ ...product }));
  const orderId = crypto.randomUUID();
  const sales = lines.map((line, index) => {
    const product = productOf({ products }, line.sku);
    if (!Number.isInteger(line.qty) || line.qty < 1) fail("units_invalid", "Enter a positive whole quantity.");
    if (!Number.isFinite(line.soldFor) || line.soldFor < 0) fail("sold_for_invalid", "Enter a valid selling price.");
    if (line.qty > product.stock) fail("insufficient_stock", `Not enough ${product.name} in stock.`);
    product.stock -= line.qty;
    return {
      id: `${orderId}-${index}`, orderId, cashier: user.login, date: todayIso(),
      sku: product.sku, name: product.name, purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice, qty: line.qty, soldFor: line.soldFor, payment,
    };
  });
  const order = {
    id: orderId, at: Date.now(), payment,
    lines: sales.map(({ sku, name, qty, soldFor }) => ({ sku, name, qty, soldFor })),
  };
  return {
    ...state, products, sales: [...sales, ...state.sales],
    sessions: open ? state.sessions.map((session) => session.id === open.id ? { ...session, orders: [...session.orders, order] } : session) : state.sessions,
    activity: [...sales.map((sale) => activity("log.sold", sale, { actor: user.login })), ...state.activity],
  };
}

export function addUser(state, user) {
  const created = { ...user, login: normalizeLogin(user.login), createdAt: todayIso(), activityReadThrough: 0 };
  if (findUser(state.users, created.login)) fail("login_duplicate", `Login ${created.login} already exists.`);
  return { ...state, users: [created, ...state.users] };
}

export function deleteUser(state, login) {
  const user = findUser(state.users, login);
  if (user && isLastAdmin(state.users, user)) fail("last_admin", "Keep at least one administrator.");
  return { ...state, users: state.users.filter((user) => user.login !== login) };
}

export function updateAccount(state, login, changes) {
  const current = findUser(state.users, login);
  if (!current) fail("invalid_credentials", "Account not found.");
  const nextLogin = changes.login ? normalizeLogin(changes.login) : login;
  if (nextLogin !== login && findUser(state.users, nextLogin)) fail("login_duplicate", `Login ${nextLogin} already exists.`);
  if (changes.password && changes.currentPassword !== current.password) fail("current_password_mismatch", "Current password is incorrect.");
  return {
    ...state,
    users: state.users.map((user) => user.login === login ? { ...user, login: nextLogin, password: changes.password ?? user.password } : user),
    sessions: state.sessions.map((session) => session.cashier === login ? { ...session, cashier: nextLogin } : session),
    sales: state.sales.map((sale) => sale.cashier === login ? { ...sale, cashier: nextLogin } : sale),
    activity: state.activity.map((entry) => entry.actor === login ? { ...entry, actor: nextLogin } : entry),
  };
}
