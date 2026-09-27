import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { handleError, httpError } from "../utils/httpError.js";
import { availableStock } from "../utils/inventory.js";

const MAX_CART_LINES = 50;
const MAX_QTY_PER_LINE = 20;

// Build a clean cart from client-supplied lines: products must exist, sizes must be valid,
// quantities are whole numbers clamped to available stock, and every price/name/shipping
// value comes from the database (never from the client).
const buildItems = async (rawItems) => {
    if (!Array.isArray(rawItems)) return [];

    const lines = new Map();
    for (const raw of rawItems.slice(0, MAX_CART_LINES)) {
        const productId = String(raw?.productId || "");
        const size = typeof raw?.size === "string" ? raw.size.trim() : "";
        const quantity = Math.floor(Number(raw?.quantity));
        if (!mongoose.isValidObjectId(productId) || !Number.isFinite(quantity) || quantity < 1) continue;
        const key = `${productId}::${size}`;
        lines.set(key, { productId, size, quantity: (lines.get(key)?.quantity || 0) + quantity });
    }

    const ids = [...new Set([...lines.values()].map((l) => l.productId))];
    const products = await Product.find({ _id: { $in: ids } }).select("-reviews").lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    for (const line of lines.values()) {
        const p = byId.get(line.productId);
        if (!p) continue;
        const sized = p.sizes?.length > 0;
        if (sized && !p.sizes.includes(line.size)) continue;
        if (!sized && line.size) continue;
        const stock = availableStock(p, line.size);
        const quantity = Math.min(line.quantity, MAX_QTY_PER_LINE, Math.max(stock, 1));
        items.push({
            productId: p._id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            images: p.images || [],
            category: p.category,
            fabric: p.fabric,
            style: p.style,
            shippingCost: p.shippingCost || 0,
            quantity,
            size: line.size,
        });
    }
    return items;
};

// Current price and per-size stock for each stored line (prices can change while in cart)
const presentCart = async (cart) => {
    if (!cart || cart.items.length === 0) return [];
    const ids = [...new Set(cart.items.map((i) => String(i.productId)))];
    const products = await Product.find({ _id: { $in: ids } }).select("-reviews").lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    return cart.items
        .filter((i) => byId.has(String(i.productId)))
        .map((i) => {
            const p = byId.get(String(i.productId));
            return {
                _id: i._id,
                productId: { _id: p._id, sizes: p.sizes || [], stock: availableStock(p, i.size) },
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                images: p.images || [],
                category: p.category,
                fabric: p.fabric,
                style: p.style,
                shippingCost: p.shippingCost || 0,
                quantity: i.quantity,
                size: i.size || "",
                stock: availableStock(p, i.size),
            };
        });
};

// GET /api/cart
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).lean();
        res.json(await presentCart(cart));
    } catch (error) {
        handleError(res, error, "Get cart");
    }
};

// POST /api/cart/sync — replace the cart with validated, DB-priced lines
export const syncCart = async (req, res) => {
    try {
        const items = await buildItems(req.body.items);
        const cart = await Cart.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { userId: req.user.id, items } },
            { upsert: true, new: true }
        ).lean();
        res.json(await presentCart(cart));
    } catch (error) {
        handleError(res, error, "Sync cart");
    }
};

// POST /api/cart/add
export const addToCart = async (req, res) => {
    try {
        const { productId, size } = req.body;
        const quantity = Number(req.body.quantity ?? 1);
        if (!mongoose.isValidObjectId(productId)) throw httpError(400, "Invalid product");
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) throw httpError(400, "Invalid quantity");

        const product = await Product.findById(productId).select("-reviews").lean();
        if (!product) throw httpError(404, "Product not found");
        const normalizedSize = typeof size === "string" ? size.trim() : "";
        if (product.sizes?.length > 0 ? !product.sizes.includes(normalizedSize) : !!normalizedSize) {
            throw httpError(400, "Invalid size selected");
        }

        const cart = (await Cart.findOne({ userId: req.user.id })) || new Cart({ userId: req.user.id, items: [] });
        const existing = cart.items.find((i) => String(i.productId) === String(productId) && (i.size || "") === normalizedSize);
        const newQty = (existing?.quantity || 0) + quantity;
        const stock = availableStock(product, normalizedSize);
        if (stock <= 0) throw httpError(409, "This item is out of stock");
        if (newQty > stock) throw httpError(409, `Only ${stock} available`);

        const fresh = await buildItems([
            ...cart.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })).filter((i) => !(String(i.productId) === String(productId) && (i.size || "") === normalizedSize)),
            { productId, size: normalizedSize, quantity: newQty },
        ]);
        cart.items = fresh;
        await cart.save();
        res.json(await presentCart(cart.toObject()));
    } catch (error) {
        handleError(res, error, "Add to cart");
    }
};

// PUT /api/cart/update
export const updateCartItem = async (req, res) => {
    try {
        const { productId, size } = req.body;
        const quantity = Number(req.body.quantity);
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QTY_PER_LINE) throw httpError(400, "Invalid quantity");

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
        const normalizedSize = typeof size === "string" ? size.trim() : "";
        const item = cart.items.find((i) => String(i.productId) === String(productId) && (i.size || "") === normalizedSize);
        if (!item) return res.status(404).json({ message: "Item not found in cart" });

        const lines = cart.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i === item ? quantity : i.quantity }));
        cart.items = await buildItems(lines.filter((l) => l.quantity > 0));
        await cart.save();
        res.json(await presentCart(cart.toObject()));
    } catch (error) {
        handleError(res, error, "Update cart");
    }
};

// DELETE /api/cart/item/:productId?size=
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const size = typeof req.query.size === "string" ? req.query.size : "";
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter((i) => !(String(i.productId) === productId && (i.size || "") === size));
        await cart.save();
        res.json(await presentCart(cart.toObject()));
    } catch (error) {
        handleError(res, error, "Remove from cart");
    }
};

// DELETE /api/cart/clear
export const clearCart = async (req, res) => {
    try {
        await Cart.updateOne({ userId: req.user.id }, { $set: { items: [] } });
        res.json({ message: "Cart cleared" });
    } catch (error) {
        handleError(res, error, "Clear cart");
    }
};
