import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import CategoryOption from "../models/CategoryOption.js";
import Setting from "../models/Setting.js";
import { handleError, httpError } from "../utils/httpError.js";
import { normalizeSizeStock } from "../utils/inventory.js";

const cleanUnsplashUrl = (url) => {
    if (typeof url !== "string" || !url) return url;
    try {
        const parsed = new globalThis.URL(url);
        if (parsed.hostname.includes("unsplash.com") && parsed.pathname.includes("/photos/")) {
            const segments = parsed.pathname.split("/").filter(Boolean);
            const photoSegment = segments[1];
            if (photoSegment && photoSegment !== "download") {
                const id = photoSegment.split("-").pop();
                return `https://unsplash.com/photos/${id}/download`;
            }
        }
    } catch {
        // Ignore parsing errors
    }
    return url;
};

const isHttpUrl = (url) => typeof url === "string" && /^https?:\/\/\S+$/i.test(url);

const parseJsonArray = (value, label) => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value || "[]");
        if (!Array.isArray(parsed)) throw new Error();
        return parsed;
    } catch {
        throw httpError(400, `Invalid format for ${label}`);
    }
};

const parseSizes = (raw) => {
    const sizes = parseJsonArray(raw, "sizes");
    if (!sizes || sizes.length === 0) throw httpError(400, "Sizes must be a non-empty array");
    if (sizes.some((s) => typeof s !== "string" || !s.trim())) throw httpError(400, "Each size must be a non-empty string");
    const trimmed = sizes.map((s) => s.trim());
    if (new Set(trimmed).size !== trimmed.length) throw httpError(400, "Duplicate sizes are not allowed");
    return trimmed;
};

// Numeric field validation shared by create/update. Returns only the fields present.
const parseNumbers = (body) => {
    const out = {};
    const rules = {
        price: { min: 0, int: false },
        originalPrice: { min: 0, int: false },
        discount: { min: 0, max: 100, int: false },
        shippingCost: { min: 0, int: false },
        stock: { min: 0, int: true },
    };
    for (const [field, rule] of Object.entries(rules)) {
        if (body[field] === undefined || body[field] === "") continue;
        const n = Number(body[field]);
        if (!Number.isFinite(n)) throw httpError(400, `${field} must be a number`);
        if (n < rule.min) throw httpError(400, `${field} cannot be negative`);
        if (rule.max !== undefined && n > rule.max) throw httpError(400, `${field} must be between ${rule.min} and ${rule.max}`);
        if (rule.int && !Number.isInteger(n)) throw httpError(400, `${field} must be a whole number`);
        out[field] = n;
    }
    if (out.originalPrice > 0 && out.price !== undefined && out.originalPrice < out.price) {
        throw httpError(400, "Original price (MRP) cannot be lower than the selling price");
    }
    // Discount is always derived from the two prices so the badge can't disagree with them
    if (out.price !== undefined && out.originalPrice !== undefined) {
        out.discount = out.originalPrice > out.price ? Math.round(((out.originalPrice - out.price) / out.originalPrice) * 100) : 0;
    }
    return out;
};

const text = (value, max = 120) => (typeof value === "string" ? value.trim().slice(0, max) : undefined);

export const addProduct = async (req, res) => {
    try {
        const name = text(req.body.name, 200);
        const { category } = req.body;
        let imageUrl = cleanUnsplashUrl(req.imageUrl || req.body.imageUrl);
        const additionalImages = (req.additionalImages || []).map(cleanUnsplashUrl);
        const images = [imageUrl, ...additionalImages].filter(Boolean);

        if (!name || !category || req.body.price === undefined || req.body.price === "" || !imageUrl) {
            return res.status(400).json({ message: "Name, category, price, and image are required" });
        }
        if (!["shirt", "trouser"].includes(category)) return res.status(400).json({ message: "Category must be shirt or trouser" });
        if (!req.imageUrl && !isHttpUrl(imageUrl)) return res.status(400).json({ message: "Image URL must start with http:// or https://" });

        const numbers = parseNumbers({ ...req.body, originalPrice: req.body.originalPrice || 0 });
        const sizes = parseSizes(req.body.sizes);

        let sizeStock = [];
        let stock = numbers.stock || 0;
        if (req.body.sizeStock !== undefined) {
            try {
                ({ sizeStock, total: stock } = normalizeSizeStock(req.body.sizeStock, sizes));
            } catch (err) {
                throw httpError(400, err.message);
            }
        }

        const product = await Product.create({
            name,
            category,
            fabric: text(req.body.fabric),
            style: text(req.body.style),
            price: numbers.price,
            originalPrice: numbers.originalPrice || 0,
            discount: numbers.discount || 0,
            shippingCost: numbers.shippingCost || 0,
            imageUrl,
            images,
            videoUrl: req.videoUrl || (isHttpUrl(req.body.videoUrl) ? req.body.videoUrl : ""),
            sizes,
            sizeStock,
            stock,
        });
        res.status(201).json(product);
    } catch (error) {
        handleError(res, error, "Add product");
    }
};

export const updateProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Product not found" });
        const current = await Product.findById(req.params.id).select("-reviews").lean();
        if (!current) return res.status(404).json({ message: "Product not found" });

        const updates = {};
        const name = text(req.body.name, 200);
        if (req.body.name !== undefined) {
            if (!name) return res.status(400).json({ message: "Name cannot be empty" });
            updates.name = name;
        }
        if (req.body.category !== undefined) {
            if (!["shirt", "trouser"].includes(req.body.category)) return res.status(400).json({ message: "Category must be shirt or trouser" });
            updates.category = req.body.category;
        }
        if (req.body.fabric !== undefined) updates.fabric = text(req.body.fabric);
        if (req.body.style !== undefined) updates.style = text(req.body.style);

        const numbers = parseNumbers({
            price: req.body.price ?? current.price,
            originalPrice: req.body.originalPrice ?? current.originalPrice ?? 0,
            shippingCost: req.body.shippingCost,
            stock: req.body.stock,
        });
        Object.assign(updates, { price: numbers.price, originalPrice: numbers.originalPrice, discount: numbers.discount });
        if (numbers.shippingCost !== undefined) updates.shippingCost = numbers.shippingCost;

        const sizes = req.body.sizes !== undefined ? parseSizes(req.body.sizes) : current.sizes;
        if (req.body.sizes !== undefined) updates.sizes = sizes;

        // ─── Stock (optimistic concurrency: reject if orders changed stock since the form was loaded) ───
        const stockTouched = req.body.sizeStock !== undefined || numbers.stock !== undefined;
        if (stockTouched) {
            if (req.body.expectedStock !== undefined && Number(req.body.expectedStock) !== current.stock) {
                return res.status(409).json({ message: `Stock changed since you opened this product (now ${current.stock}). Reload and try again.` });
            }
            if (req.body.sizeStock !== undefined) {
                try {
                    const { sizeStock, total } = normalizeSizeStock(req.body.sizeStock, sizes);
                    updates.sizeStock = sizeStock;
                    updates.stock = total;
                } catch (err) {
                    return res.status(400).json({ message: err.message });
                }
            } else {
                updates.sizeStock = [];
                updates.stock = numbers.stock;
            }
        } else if (req.body.sizes !== undefined && current.sizeStock?.length) {
            // Sizes changed without new stock numbers: keep counts for sizes that remain
            const { sizeStock, total } = normalizeSizeStock(current.sizeStock, sizes);
            updates.sizeStock = sizeStock;
            updates.stock = total;
        }

        // ─── Media ───
        if (req.videoUrl) updates.videoUrl = req.videoUrl;
        else if (req.body.videoUrl !== undefined) updates.videoUrl = isHttpUrl(req.body.videoUrl) ? req.body.videoUrl : "";

        const existingImages = parseJsonArray(req.body.existingImages, "existing images");
        const keptImages = (existingImages || current.images || []).filter((u) => typeof u === "string" && u).map(cleanUnsplashUrl);
        const bodyImageUrl = req.body.imageUrl ? cleanUnsplashUrl(req.body.imageUrl) : null;
        if (bodyImageUrl && !isHttpUrl(bodyImageUrl)) return res.status(400).json({ message: "Image URL must start with http:// or https://" });
        const newImages = [cleanUnsplashUrl(req.imageUrl), bodyImageUrl, ...(req.additionalImages || []).map(cleanUnsplashUrl)].filter(Boolean);

        if (existingImages !== undefined || newImages.length > 0) {
            const images = [...new Set([...keptImages, ...newImages])];
            if (images.length === 0) return res.status(400).json({ message: "A product needs at least one image" });
            updates.images = images;
            updates.imageUrl = images[0];
        }

        const filter = { _id: current._id };
        if (stockTouched) filter.stock = current.stock; // lost-update guard
        const product = await Product.findOneAndUpdate(filter, { $set: updates }, { new: true, runValidators: true }).select("-reviews");
        if (!product) return res.status(409).json({ message: "Stock changed while saving (an order came in). Reload and try again." });
        res.json(product);
    } catch (error) {
        handleError(res, error, "Update product");
    }
};

export const updateBulkShipping = async (req, res) => {
    try {
        const { productIds, shippingCost } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: "No products selected" });
        }
        if (!productIds.every((id) => mongoose.isValidObjectId(id))) return res.status(400).json({ message: "Invalid product id" });
        const numShipping = Number(shippingCost);
        if (!Number.isFinite(numShipping) || numShipping < 0) return res.status(400).json({ message: "Shipping cost cannot be negative" });

        await Product.updateMany({ _id: { $in: productIds } }, { $set: { shippingCost: numShipping } });
        res.json({ message: "Shipping updated successfully" });
    } catch (error) {
        handleError(res, error, "Bulk shipping");
    }
};

export const deleteProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Product not found" });
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        // Remove the product from every cart and wishlist (order history keeps its snapshot)
        await Promise.all([
            Cart.updateMany({ "items.productId": product._id }, { $pull: { items: { productId: product._id } } }),
            Wishlist.updateMany({ "items.productId": product._id }, { $pull: { items: { productId: product._id } } }),
        ]);
        res.json({ message: "Product deleted" });
    } catch (error) {
        handleError(res, error, "Delete product");
    }
};

// ─── User Management ───

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password -tokenVersion").sort({ createdAt: -1 }).limit(5000).lean();
        res.json(users);
    } catch (error) {
        handleError(res, error, "Get users");
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
        }
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "User not found" });
        if (req.admin.kind === "user" && req.params.id === req.admin.id && role !== "admin") {
            return res.status(400).json({ message: "You cannot remove your own admin role" });
        }

        // Bump tokenVersion so the change applies to existing sessions immediately
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role }, $inc: { tokenVersion: 1 } },
            { new: true }
        ).select("-password -tokenVersion");

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        handleError(res, error, "Update user role");
    }
};

export const deleteUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "User not found" });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user._id.toString() === req.admin.id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        await Cart.deleteMany({ userId: user._id });
        await Wishlist.deleteMany({ userId: user._id });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        handleError(res, error, "Delete user");
    }
};

// ─── Category Options Management ───

const DEFAULTS = {
    shirt: { fabrics: ["Linen", "Oxford", "Twill", "Satin"], styles: ["Plain", "Checks", "Print"], sizes: ["S", "M", "L", "XL", "XXL"] },
    trouser: { fabrics: ["Cotton", "Polyester", "Denim", "Wool"], styles: ["Formal", "Casual"], sizes: ["28", "30", "32", "34", "36", "38", "40"] },
};

export const getCategoryOptions = async (req, res) => {
    try {
        let options = await CategoryOption.find().lean();
        if (options.length === 0) {
            // Seed defaults once; upsert avoids duplicate-key races on concurrent first loads
            await Promise.all(
                Object.entries(DEFAULTS).map(([category, values]) =>
                    CategoryOption.updateOne({ category }, { $setOnInsert: { category, ...values } }, { upsert: true })
                )
            );
            options = await CategoryOption.find().lean();
        }

        const maxPrices = await Product.aggregate([{ $group: { _id: "$category", maxPrice: { $max: "$price" } } }]);
        const priceMap = {};
        maxPrices.forEach((p) => { priceMap[p._id] = p.maxPrice; });

        const result = {};
        options.forEach((o) => {
            result[o.category] = {
                fabrics: o.fabrics,
                styles: o.styles,
                sizes: o.sizes || [],
                maxPrice: priceMap[o.category] || 1000,
            };
        });
        res.json(result);
    } catch (error) {
        handleError(res, error, "Get category options");
    }
};

export const updateCategoryOptions = async (req, res) => {
    try {
        const { category, fabrics, styles, sizes } = req.body;
        if (!["shirt", "trouser"].includes(category)) {
            return res.status(400).json({ message: "Category must be 'shirt' or 'trouser'" });
        }
        const clean = (arr, label) => {
            if (!Array.isArray(arr)) throw httpError(400, `${label} must be an array`);
            return [...new Set(arr.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim().slice(0, 50)))];
        };
        const update = {};
        if (fabrics !== undefined) update.fabrics = clean(fabrics, "Fabrics");
        if (styles !== undefined) update.styles = clean(styles, "Styles");
        if (sizes !== undefined) update.sizes = clean(sizes, "Sizes");

        const option = await CategoryOption.findOneAndUpdate({ category }, { $set: update }, { new: true, upsert: true });
        res.json(option);
    } catch (error) {
        handleError(res, error, "Update category options");
    }
};

// ─── Store Settings ───
const SETTING_RULES = {
    newArrivalsDays: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 365) throw httpError(400, "New arrivals days must be a whole number from 1 to 365");
        return n;
    },
};

export const getSettings = async (req, res) => {
    try {
        await Setting.updateOne(
            { key: "newArrivalsDays" },
            { $setOnInsert: { key: "newArrivalsDays", value: 14, description: "Number of days a product is considered a new arrival after being added" } },
            { upsert: true }
        );
        const settings = await Setting.find().lean();
        const mapped = {};
        settings.forEach((s) => { mapped[s.key] = s.value; });
        res.json(mapped);
    } catch (error) {
        handleError(res, error, "Get settings");
    }
};

export const updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        const rule = SETTING_RULES[key];
        if (!rule) return res.status(400).json({ message: "Unknown setting" });
        const setting = await Setting.findOneAndUpdate(
            { key },
            { $set: { value: rule(value), updatedAt: Date.now() } },
            { new: true, upsert: true }
        );
        res.json(setting);
    } catch (error) {
        handleError(res, error, "Update setting");
    }
};
