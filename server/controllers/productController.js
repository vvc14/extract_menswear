import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Setting from "../models/Setting.js";
import { handleError, httpError, escapeRegex } from "../utils/httpError.js";

const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;
// Statuses that prove the customer received the product
const PURCHASED_STATUSES = ["delivered", "return-requested", "exchange-requested", "exchanged"];

const csv = (value) =>
    String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 30);

const recomputeRatings = (product) => {
    product.numOfReviews = product.reviews.length;
    product.ratings = product.reviews.length
        ? Number((product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1))
        : 0;
};

export const getProducts = async (req, res) => {
    try {
        const { category, fabric, style, size, minPrice, maxPrice, search, sort } = req.query;
        const filter = {};

        if (category && typeof category === "string") filter.category = category;
        if (fabric) filter.fabric = { $in: csv(fabric) };
        if (style) filter.style = { $in: csv(style) };
        if (size) filter.sizes = { $in: csv(size) };

        const min = Number(minPrice);
        const max = Number(maxPrice);
        if (minPrice !== undefined && Number.isFinite(min)) filter.price = { ...filter.price, $gte: Math.max(0, min) };
        if (maxPrice !== undefined && Number.isFinite(max)) filter.price = { ...filter.price, $lte: Math.max(0, max) };

        if (search && typeof search === "string" && search.trim()) {
            const pattern = escapeRegex(search.trim().slice(0, MAX_SEARCH_LENGTH));
            filter.$or = ["name", "fabric", "style", "category"].map((field) => ({ [field]: { $regex: pattern, $options: "i" } }));
        }

        if (req.query.newArrivals === "true") {
            const setting = await Setting.findOne({ key: "newArrivalsDays" }).lean();
            const days = Number(setting?.value) > 0 ? Number(setting.value) : 14;
            const cutOffDate = new Date();
            cutOffDate.setDate(cutOffDate.getDate() - days);
            filter.createdAt = { $gte: cutOffDate };
        }

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "price-low": { price: 1 },
            "price-high": { price: -1 },
            "name-az": { name: 1 },
            "name-za": { name: -1 },
        };
        const sortOrder = sortMap[sort] || { createdAt: -1 };

        const page = parseInt(req.query.page, 10) || 0;
        const limit = Math.min(parseInt(req.query.limit, 10) || 0, MAX_PAGE_SIZE);

        // Paginated mode: when page >= 1
        if (page >= 1) {
            const perPage = limit > 0 ? limit : 12;
            const skip = (page - 1) * perPage;
            const [products, total] = await Promise.all([
                Product.find(filter).select("-reviews").sort(sortOrder).skip(skip).limit(perPage).lean(),
                Product.countDocuments(filter),
            ]);
            const pages = Math.ceil(total / perPage);
            return res.json({ products, total, page, pages, hasMore: page < pages });
        }

        // Flat-array mode (Home page, admin, etc.)
        let query = Product.find(filter).select("-reviews").sort(sortOrder);
        if (limit > 0) query = query.limit(limit);
        res.json(await query.lean());
    } catch (error) {
        handleError(res, error, "Get products");
    }
};

export const getProductById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Product not found" });
        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        handleError(res, error, "Get product");
    }
};

// POST /api/products/:id/reviews — verified purchasers only; re-posting edits the review
export const addReview = async (req, res) => {
    try {
        const rating = Number(req.body.rating);
        const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, "Rating must be a whole number from 1 to 5");
        if (!comment) throw httpError(400, "Please write a comment");
        if (comment.length > 1000) throw httpError(400, "Comment must be 1000 characters or fewer");

        if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, "Product not found");
        const product = await Product.findById(req.params.id);
        if (!product) throw httpError(404, "Product not found");

        const userId = req.user.id;
        const purchased = await Order.exists({ userId, status: { $in: PURCHASED_STATUSES }, "items.productId": product._id });
        if (!purchased) throw httpError(403, "Only customers who received this product can review it");

        const userObj = await User.findById(userId).select("name").lean();
        const userName = userObj?.name || "Customer";
        const imageUrl = req.imageUrl || "";

        const existing = product.reviews.find((r) => String(r.userId) === String(userId));
        if (existing) {
            existing.rating = rating;
            existing.comment = comment;
            if (imageUrl) existing.imageUrl = imageUrl;
            existing.verifiedPurchase = true;
            existing.createdAt = Date.now();
        } else {
            product.reviews.push({ userId, userName, rating, comment, imageUrl, verifiedPurchase: true });
        }

        recomputeRatings(product);
        await product.save();
        res.status(existing ? 200 : 201).json(product);
    } catch (error) {
        handleError(res, error, "Add review");
    }
};

// DELETE /api/products/:id/reviews — remove your own review (admins may pass ?userId=)
export const deleteReview = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, "Product not found");
        const product = await Product.findById(req.params.id);
        if (!product) throw httpError(404, "Product not found");

        const targetUserId = req.user.role === "admin" && req.query.userId ? String(req.query.userId) : String(req.user.id);
        const before = product.reviews.length;
        product.reviews = product.reviews.filter((r) => String(r.userId) !== targetUserId);
        if (product.reviews.length === before) throw httpError(404, "Review not found");

        recomputeRatings(product);
        await product.save();
        res.json(product);
    } catch (error) {
        handleError(res, error, "Delete review");
    }
};
