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

// Stock a product has in one size (mirrors utils/inventory.js availableStock).
// Products with sizeStock track each size; legacy ones share `stock` across sizes.
const stockInSize = (sizeExpr) => ({
    $cond: [
        { $gt: [{ $size: { $ifNull: ["$sizeStock", []] } }, 0] },
        { $sum: { $map: { input: { $filter: { input: "$sizeStock", cond: { $eq: ["$$this.size", sizeExpr] } } }, in: "$$this.stock" } } },
        { $ifNull: ["$stock", 0] },
    ],
});

const QUERY_KEYS = ["category", "fabric", "style", "color", "size", "minPrice", "maxPrice", "search", "sort", "inStock", "onSale", "bands"];
const assertStrings = (q) => {
    for (const k of QUERY_KEYS) {
        if (q[k] !== undefined && typeof q[k] !== "string") throw httpError(400, `Invalid ${k}`);
    }
};

// One Mongo condition per filter, so a facet count can leave its own filter out.
// Size means "can be bought in this size", not just "listed in this size".
const filterParts = (q) => {
    const parts = {};
    if (q.fabric) parts.fabric = { fabric: { $in: csv(q.fabric) } };
    if (q.style) parts.style = { style: { $in: csv(q.style) } };
    if (q.color) parts.color = { color: { $in: csv(q.color) } };
    if (q.size) {
        const sizes = csv(q.size);
        parts.size = { $expr: { $anyElementTrue: [{ $map: { input: sizes, as: "s", in: { $and: [{ $in: ["$$s", { $ifNull: ["$sizes", []] }] }, { $gt: [stockInSize("$$s"), 0] }] } } }] } };
    }
    const min = Number(q.minPrice);
    const max = Number(q.maxPrice);
    const price = {};
    if (q.minPrice && Number.isFinite(min)) price.$gte = Math.max(0, min);
    if (q.maxPrice && Number.isFinite(max)) price.$lte = Math.max(0, max);
    if (Object.keys(price).length) parts.price = { price };
    if (q.inStock === "true") parts.inStock = { stock: { $gt: 0 } };
    if (q.onSale === "true") parts.onSale = { $expr: { $gt: ["$originalPrice", "$price"] } };
    return parts;
};

// Category and free-text search apply to every listing and every facet
const baseFilter = (q) => {
    const filter = {};
    if (q.category) filter.category = q.category;
    if (q.search && q.search.trim()) {
        const pattern = escapeRegex(q.search.trim().slice(0, MAX_SEARCH_LENGTH));
        filter.$or = ["name", "fabric", "style", "color", "category"].map((field) => ({ [field]: { $regex: pattern, $options: "i" } }));
    }
    return filter;
};

const combine = (base, parts, except) => {
    const list = Object.entries(parts).filter(([k]) => k !== except).map(([, v]) => v);
    return list.length ? { $and: [base, ...list] } : base;
};

export const getProducts = async (req, res) => {
    try {
        assertStrings(req.query);
        const filter = combine(baseFilter(req.query), filterParts(req.query));

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
            discount: { discount: -1, price: 1 },
        };
        const sortOrder = Object.hasOwn(sortMap, req.query.sort) ? sortMap[req.query.sort] : { createdAt: -1 };

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

// GET /api/products/facets?category=shirt&size=M&... : what the filter panel can offer.
// Each group is counted with every other active filter applied but not its own, so a shopper
// sees how many products each choice would show and never gets a choice that leads to nothing.
export const getFacets = async (req, res) => {
    try {
        assertStrings(req.query);
        const parts = filterParts(req.query);
        // Price band lower edges come from the client (utils/priceBands.js), e.g. bands=0,500,1000
        const edges = csv(req.query.bands || "").map(Number);
        if (edges.length > 10 || edges.some((n, i) => !Number.isFinite(n) || n < 0 || (i && n <= edges[i - 1]))) throw httpError(400, "Invalid bands");
        const without = (key) => ({ $match: combine({}, parts, key) });
        const valueCounts = (field) => [
            without(field),
            { $match: { [field]: { $nin: [null, ""] } } },
            { $group: { _id: `$${field}`, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ];
        const [result] = await Product.aggregate([
            { $match: baseFilter(req.query) },
            {
                $facet: {
                    fabric: valueCounts("fabric"),
                    style: valueCounts("style"),
                    color: valueCounts("color"),
                    size: [
                        without("size"),
                        { $unwind: "$sizes" },
                        { $match: { $expr: { $gt: [stockInSize("$sizes"), 0] } } },
                        { $group: { _id: "$sizes", count: { $sum: 1 } } },
                    ],
                    ...(edges.length && { bands: [without("price"), { $bucket: { groupBy: "$price", boundaries: [...edges, Infinity], default: "below" } }] }),
                    inStock: [without("inStock"), { $match: { stock: { $gt: 0 } } }, { $count: "n" }],
                    onSale: [without("onSale"), { $match: { $expr: { $gt: ["$originalPrice", "$price"] } } }, { $count: "n" }],
                    total: [without(), { $count: "n" }],
                },
            },
        ]);
        const list = (rows) => rows.map((r) => ({ value: r._id, count: r.count }));
        res.json({
            fabric: list(result.fabric),
            style: list(result.style),
            color: list(result.color),
            size: list(result.size),
            bands: Object.fromEntries((result.bands || []).filter((b) => b._id !== "below").map((b) => [b._id, b.count])),
            inStock: result.inStock[0]?.n || 0,
            onSale: result.onSale[0]?.n || 0,
            total: result.total[0]?.n || 0,
        });
    } catch (error) {
        handleError(res, error, "Get facets");
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
