import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { categories } from "../lib/erp.js";
import { recordActivity } from "./activity.service.js";

const COLLATION = { locale: "en", strength: 2 };

export async function listProducts() {
  return Product.find().sort({ createdAt: 1 });
}

function validateRow(row) {
  const name = String(row.name ?? "").trim();
  const category = row.category;
  const stock = Number(row.stock);
  const purchasePrice = Number(row.purchasePrice);
  const sellingPrice = Number(row.sellingPrice);
  const sku = String(row.sku ?? "").trim();

  if (!name) throw ApiError.badRequest("name_required", "Give the product a name.");
  if (!categories.includes(category)) throw ApiError.badRequest("category_invalid", "Category must be Shoe or Bag.");
  if (!sku) throw ApiError.badRequest("sku_required", "Missing product id.");
  if (!Number.isInteger(stock) || stock < 0) {
    throw ApiError.badRequest("stock_invalid", "Stock must be a whole number of units, zero or more.");
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    throw ApiError.badRequest("purchase_invalid", "Purchase price must be zero or more.");
  }
  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    throw ApiError.badRequest("selling_invalid", "Selling price must be zero or more.");
  }

  return {
    sku,
    name,
    category,
    color: category === "Shoe" && row.color ? String(row.color) : undefined,
    size: category === "Shoe" && row.size ? Number(row.size) : undefined,
    stock,
    purchasePrice,
    sellingPrice,
  };
}

/**
 * Adds one or more product rows in one call — a Shoe add can create many at
 * once, one per color×size, matching the old client's `onAdd(newProducts)`.
 *
 * The client still computes a candidate `sku` for each row (the same
 * generator this app has always used, for an instant id preview) but this is
 * where it is actually enforced: a collision with the catalogue, or between
 * two rows in the same submission, rejects the whole batch rather than
 * silently overwriting or renumbering anything.
 */
export async function createProducts(rows, { actor } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw ApiError.badRequest("rows_required", "Add at least one product.");
  }
  const docs = rows.map(validateRow);

  const seen = new Set();
  for (const doc of docs) {
    const key = doc.sku.toUpperCase();
    if (seen.has(key)) throw ApiError.conflict("sku_taken", `The id ${doc.sku} is used twice in this submission.`);
    seen.add(key);
  }

  const existing = await Product.find({ sku: { $in: docs.map((doc) => doc.sku) } }).collation(COLLATION);
  if (existing.length > 0) {
    throw ApiError.conflict("sku_taken", `The id ${existing[0].sku} is already in use.`);
  }

  const created = await Product.insertMany(docs);
  const activity = [];
  for (const product of created) {
    activity.push(await recordActivity("log.added", product, {}, { actor }));
  }
  return { products: created, activity };
}

const EDITABLE_FIELDS = ["name", "category", "color", "size", "stock", "purchasePrice", "sellingPrice"];

export async function updateProduct(sku, changes, { actor } = {}) {
  const product = await Product.findOne({ sku }).collation(COLLATION);
  if (!product) throw ApiError.notFound("product_not_found", "That product no longer exists.");

  const before = product.toObject();
  const applied = {};

  for (const field of EDITABLE_FIELDS) {
    if (!(field in changes)) continue;
    let value = changes[field];

    if (field === "stock") {
      value = Number(value);
      if (!Number.isInteger(value) || value < 0) {
        throw ApiError.badRequest("stock_invalid", "Stock must be a whole number of units, zero or more.");
      }
    } else if (field === "purchasePrice" || field === "sellingPrice") {
      value = Number(value);
      if (!Number.isFinite(value) || value < 0) {
        throw ApiError.badRequest(`${field}_invalid`, "Price must be zero or more.");
      }
    } else if (field === "category" && !categories.includes(value)) {
      throw ApiError.badRequest("category_invalid", "Category must be Shoe or Bag.");
    } else if (field === "size" && value != null) {
      value = Number(value);
    }

    product[field] = value;
    applied[field] = value;
  }

  await product.save();

  const changeList = Object.keys(applied)
    .filter((field) => before[field] !== applied[field])
    .map((field) => ({ field, from: before[field], to: applied[field] }));

  const activity = await recordActivity(
    "log.updated",
    product,
    { changes: changeList.length > 0 ? changeList : null },
    { actor },
  );
  return { product, activity: [activity] };
}

export async function deleteProduct(sku, { actor } = {}) {
  const product = await Product.findOneAndDelete({ sku }, { collation: COLLATION });
  if (!product) throw ApiError.notFound("product_not_found", "That product no longer exists.");

  const activity = await recordActivity("log.deleted", product, {}, { actor });
  return { sku: product.sku, activity: [activity] };
}

export async function returnProduct(sku, units, reason, { actor } = {}) {
  const parsedUnits = Number(units);
  if (!Number.isInteger(parsedUnits) || parsedUnits < 1) {
    throw ApiError.badRequest("units_invalid", "Enter a whole number of units, one or more.");
  }
  const trimmedReason = String(reason ?? "").trim();
  if (!trimmedReason) throw ApiError.badRequest("reason_required", "Give a reason for the return.");

  const product = await Product.findOneAndUpdate(
    { sku },
    { $inc: { stock: parsedUnits } },
    { new: true, collation: COLLATION },
  );
  if (!product) throw ApiError.notFound("product_not_found", "That product no longer exists.");

  const activity = await recordActivity("log.returned", product, { reason: trimmedReason }, { actor });
  return { product, activity: [activity] };
}
