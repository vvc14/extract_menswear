import Product from "../models/Product.js";

// ─── Inventory helpers ───
// A product is in "per-size" mode when it has sizeStock entries: each size has its own
// count and `stock` is kept equal to the sum. Otherwise ("shared" mode, legacy products)
// every size draws from the single `stock` number.
//
// All decrements are conditional atomic updates ({ stock: { $gte: qty } }), so two
// concurrent buyers can never both take the last unit.

export const isPerSize = (product) => Array.isArray(product?.sizeStock) && product.sizeStock.length > 0;

export const availableStock = (product, size) => {
    if (!product) return 0;
    if (isPerSize(product)) {
        const entry = product.sizeStock.find((s) => s.size === (size || ""));
        return entry ? Math.max(0, entry.stock) : 0;
    }
    return Math.max(0, product.stock || 0);
};

// Map of size -> available units, for API responses
export const stockBySize = (product) => {
    const map = {};
    for (const size of product?.sizes || []) map[size] = availableStock(product, size);
    return map;
};

// Atomically take `qty` units of (productId, size). Returns true on success.
export const reserveLine = async (productId, size, qty) => {
    const product = await Product.findById(productId).select("sizeStock stock").lean();
    if (!product) return false;

    let result;
    if (isPerSize(product)) {
        result = await Product.updateOne(
            { _id: productId, sizeStock: { $elemMatch: { size: size || "", stock: { $gte: qty } } } },
            { $inc: { "sizeStock.$.stock": -qty, stock: -qty } }
        );
    } else {
        result = await Product.updateOne(
            { _id: productId, stock: { $gte: qty } },
            { $inc: { stock: -qty } }
        );
    }
    return result.modifiedCount === 1;
};

// Put `qty` units of (productId, size) back. Safe if the product was deleted.
export const releaseLine = async (productId, size, qty) => {
    const product = await Product.findById(productId).select("sizeStock stock").lean();
    if (!product) return;

    if (isPerSize(product)) {
        const res = await Product.updateOne(
            { _id: productId, "sizeStock.size": size || "" },
            { $inc: { "sizeStock.$.stock": qty, stock: qty } }
        );
        if (res.matchedCount === 0) {
            // The size entry was removed after purchase; keep the per-size sum consistent
            await Product.updateOne(
                { _id: productId },
                { $push: { sizeStock: { size: size || "", stock: qty } }, $inc: { stock: qty } }
            );
            console.warn(`Inventory: restored ${qty} of removed size "${size}" on product ${productId}`);
        }
    } else {
        await Product.updateOne({ _id: productId }, { $inc: { stock: qty } });
    }
};

// Merge lines with the same product+size so stock is checked against the combined quantity
export const mergeLines = (items) => {
    const map = new Map();
    for (const item of items) {
        const key = `${item.productId}::${item.size || ""}`;
        const existing = map.get(key);
        if (existing) existing.quantity += item.quantity;
        else map.set(key, { productId: item.productId, size: item.size || "", quantity: item.quantity });
    }
    return [...map.values()];
};

// Reserve every line or none. Returns { ok: true } or { ok: false, failed: line }.
export const reserveItems = async (items) => {
    const lines = mergeLines(items);
    const done = [];
    for (const line of lines) {
        const ok = await reserveLine(line.productId, line.size, line.quantity);
        if (!ok) {
            for (const d of done) await releaseLine(d.productId, d.size, d.quantity);
            return { ok: false, failed: line };
        }
        done.push(line);
    }
    return { ok: true };
};

export const releaseItems = async (items) => {
    for (const line of mergeLines(items)) {
        try {
            await releaseLine(line.productId, line.size, line.quantity);
        } catch (err) {
            console.error(`Inventory: failed to release product ${line.productId} size "${line.size}":`, err.message);
        }
    }
};

// Normalise admin-supplied sizeStock against the product's sizes.
// Returns { sizeStock, total } or throws an Error with a user-facing message.
export const normalizeSizeStock = (rawSizeStock, sizes) => {
    let parsed = rawSizeStock;
    if (typeof parsed === "string") {
        try {
            parsed = JSON.parse(parsed || "[]");
        } catch {
            throw new Error("Invalid format for size stock");
        }
    }
    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
        parsed = Object.entries(parsed).map(([size, stock]) => ({ size, stock }));
    }
    if (!Array.isArray(parsed)) throw new Error("Invalid format for size stock");

    const bySize = new Map();
    for (const entry of parsed) {
        const size = typeof entry?.size === "string" ? entry.size.trim() : "";
        const stock = Number(entry?.stock);
        if (!size) throw new Error("Each size stock entry needs a size");
        if (!Number.isInteger(stock) || stock < 0) throw new Error(`Stock for size ${size} must be a whole number ≥ 0`);
        bySize.set(size, stock);
    }
    const sizeStock = sizes.map((size) => ({ size, stock: bySize.get(size) ?? 0 }));
    const total = sizeStock.reduce((sum, s) => sum + s.stock, 0);
    return { sizeStock, total };
};
