import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { SaleLine } from "../models/SaleLine.js";
import { RegisterSession } from "../models/RegisterSession.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity } from "./activity.service.js";
import { todayIso } from "../lib/dates.js";

const COLLATION = { locale: "en", strength: 2 };

export async function listSessions(actingUser, { cashier } = {}) {
  const filter = {};
  if (actingUser.role === "cashier") {
    // A cashier's own shifts only, whatever `cashier` was asked for — the
    // filter is decided by who is asking, never by what the query string says.
    filter.cashier = actingUser.login;
  } else if (cashier) {
    filter.cashier = cashier;
  }
  return RegisterSession.find(filter).sort({ openedAt: -1 });
}

export async function mySession(login) {
  return RegisterSession.findOne({ cashier: login, closedAt: null });
}

export async function openRegister(login) {
  const existing = await mySession(login);
  if (existing) return existing;
  return RegisterSession.create({
    cashier: login,
    date: todayIso(),
    openedAt: new Date(),
    closedAt: null,
    orders: [],
  });
}

export async function closeRegister(login) {
  const session = await mySession(login);
  if (!session) throw ApiError.badRequest("register_not_open", "No open register to close.");
  session.closedAt = new Date();
  await session.save();
  return session;
}

/**
 * The checkout — the one write-path everything else in this file leads up
 * to. Ported from the old client's `completeSale`, whose own comment said it
 * best: "an order can never appear in one and not the other." Here that
 * invariant is enforced by MongoDB itself: every line's stock decrement,
 * every ledger row, the shift's order, and every activity entry commit or
 * roll back together as one transaction.
 */
export async function createOrder(actingUser, { lines, payment }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw ApiError.badRequest("lines_required", "Add at least one product.");
  }
  if (payment !== "cash" && payment !== "card") {
    throw ApiError.badRequest("payment_invalid", "Payment must be cash or card.");
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const openSessionDoc = await RegisterSession.findOne({
        cashier: actingUser.login,
        closedAt: null,
      }).session(session);

      if (actingUser.role === "cashier" && !openSessionDoc) {
        throw ApiError.badRequest("register_closed", "Open the register before selling.");
      }

      const date = todayIso();
      const at = new Date();
      const orderId = `OR-${at.getTime()}`;

      const saleDocs = [];
      const orderLines = [];
      const updatedProducts = [];

      for (const [index, line] of lines.entries()) {
        const sku = String(line.sku ?? "");
        const qty = Number(line.qty);
        const soldFor = Number(line.soldFor);

        if (!sku) throw ApiError.badRequest("sku_required", "Missing product id.");
        if (!Number.isInteger(qty) || qty < 1) {
          throw ApiError.badRequest("qty_invalid", "Quantity must be a whole number, one or more.");
        }
        if (!Number.isFinite(soldFor) || soldFor < 0) {
          throw ApiError.badRequest("sold_for_invalid", "Sold-for price must be zero or more.");
        }

        // Atomic, not read-then-write: the `stock: {$gte: qty}` filter is
        // what actually stops two concurrent checkouts from both succeeding
        // against the last unit — the old client's `Math.max(0, stock-qty)`
        // had no such guard.
        const product = await Product.findOneAndUpdate(
          { sku, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true, session, collation: COLLATION },
        );

        if (!product) {
          const exists = await Product.findOne({ sku }).session(session).collation(COLLATION);
          if (!exists) throw ApiError.notFound("product_not_found", `No product with id ${sku}.`);
          throw ApiError.conflict("insufficient_stock", `Not enough ${exists.name} in stock.`);
        }

        saleDocs.push({
          id: `${orderId}-L${index}`,
          orderId,
          cashier: actingUser.login,
          date,
          sku: product.sku,
          name: product.name,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          soldFor,
          qty,
          payment,
        });
        orderLines.push({ sku: product.sku, name: product.name, qty, soldFor });
        updatedProducts.push({ sku: product.sku, stock: product.stock });
      }

      const createdSales = await SaleLine.insertMany(saleDocs, { session });

      if (openSessionDoc) {
        openSessionDoc.orders.push({ id: orderId, at, payment, lines: orderLines });
        await openSessionDoc.save({ session });
      }

      const activity = [];
      for (const sale of createdSales) {
        activity.push(await recordActivity("log.sold", sale, {}, { session, actor: actingUser.login }));
      }

      result = {
        sales: createdSales,
        session: openSessionDoc,
        products: updatedProducts,
        activity,
      };
    });
  } finally {
    await session.endSession();
  }

  return result;
}
