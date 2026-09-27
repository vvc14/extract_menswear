import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { handleError, httpError } from "../utils/httpError.js";

const MAX_WISHLIST = 100;

// Wishlist entries are snapshots built from the database, never from client-supplied fields
const snapshot = (p) => ({
    productId: p._id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    images: p.images || [],
    category: p.category,
    fabric: p.fabric,
    style: p.style,
    discount: p.discount || 0,
    originalPrice: p.originalPrice || 0,
});

// GET /api/wishlist — refreshed with current product data; deleted products dropped
export const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user.id }).lean();
        if (!wishlist?.items?.length) return res.json([]);
        const products = await Product.find({ _id: { $in: wishlist.items.map((i) => i.productId) } }).select("-reviews").lean();
        const byId = new Map(products.map((p) => [String(p._id), p]));
        res.json(
            wishlist.items
                .filter((i) => byId.has(String(i.productId)))
                .map((i) => {
                    const p = byId.get(String(i.productId));
                    return { _id: i._id, ...snapshot(p), productId: { _id: p._id, sizes: p.sizes || [], stock: p.stock || 0 } };
                })
        );
    } catch (error) {
        handleError(res, error, "Get wishlist");
    }
};

// POST /api/wishlist/sync — replace the wishlist with the given product ids
export const syncWishlist = async (req, res) => {
    try {
        const raw = Array.isArray(req.body.items) ? req.body.items : [];
        const ids = [...new Set(raw.map((i) => String(i?.productId || "")).filter((id) => mongoose.isValidObjectId(id)))].slice(0, MAX_WISHLIST);
        const products = await Product.find({ _id: { $in: ids } }).select("-reviews").lean();
        const byId = new Map(products.map((p) => [String(p._id), p]));
        const items = ids.filter((id) => byId.has(id)).map((id) => snapshot(byId.get(id)));

        const wishlist = await Wishlist.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { userId: req.user.id, items } },
            { upsert: true, new: true }
        );
        res.json(wishlist.items);
    } catch (error) {
        handleError(res, error, "Sync wishlist");
    }
};

// POST /api/wishlist/toggle — add if absent, remove if present
export const toggleWishlistItem = async (req, res) => {
    try {
        const productId = String(req.body.productId || "");
        if (!mongoose.isValidObjectId(productId)) throw httpError(400, "Invalid product");

        const wishlist = (await Wishlist.findOne({ userId: req.user.id })) || new Wishlist({ userId: req.user.id, items: [] });
        const existingIndex = wishlist.items.findIndex((i) => String(i.productId) === productId);

        let added;
        if (existingIndex >= 0) {
            wishlist.items.splice(existingIndex, 1);
            added = false;
        } else {
            const product = await Product.findById(productId).select("-reviews").lean();
            if (!product) throw httpError(404, "Product not found");
            if (wishlist.items.length >= MAX_WISHLIST) throw httpError(400, `Your wishlist can hold up to ${MAX_WISHLIST} items`);
            wishlist.items.push(snapshot(product));
            added = true;
        }
        await wishlist.save();
        res.json({ items: wishlist.items, added });
    } catch (error) {
        handleError(res, error, "Toggle wishlist");
    }
};

// DELETE /api/wishlist/item/:productId
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const wishlist = await Wishlist.findOne({ userId: req.user.id });
        if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

        wishlist.items = wishlist.items.filter((i) => String(i.productId) !== productId);
        await wishlist.save();
        res.json(wishlist.items);
    } catch (error) {
        handleError(res, error, "Remove from wishlist");
    }
};

// DELETE /api/wishlist/clear
export const clearWishlist = async (req, res) => {
    try {
        await Wishlist.updateOne({ userId: req.user.id }, { $set: { items: [] } });
        res.json({ message: "Wishlist cleared" });
    } catch (error) {
        handleError(res, error, "Clear wishlist");
    }
};
