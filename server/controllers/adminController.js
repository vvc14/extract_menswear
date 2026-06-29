import Product from "../models/Product.js";
import User from "../models/User.js";
import CategoryOption from "../models/CategoryOption.js";

export const addProduct = async (req, res) => {
    try {
        const { name, category, fabric, style, price, originalPrice, discount, stock, shippingCost, sizes, videoUrl } = req.body;
        const imageUrl = req.imageUrl || req.body.imageUrl;
        const additionalImages = req.additionalImages || [];
        const images = [imageUrl, ...additionalImages].filter(Boolean);

        if (!name || !category || !price || !imageUrl) {
            return res.status(400).json({ message: "Name, category, price, and image are required" });
        }

        const numPrice = Number(price);
        const numOriginalPrice = Number(originalPrice) || 0;
        const numDiscount = Number(discount) || 0;
        const numStock = Number(stock) || 0;
        const numShippingCost = Number(shippingCost) || 0;

        if (numPrice < 0) return res.status(400).json({ message: "Price cannot be negative" });
        if (numOriginalPrice < 0) return res.status(400).json({ message: "Original price cannot be negative" });
        if (numDiscount < 0 || numDiscount > 100) return res.status(400).json({ message: "Discount must be between 0 and 100" });
        if (numStock < 0) return res.status(400).json({ message: "Stock cannot be negative" });
        if (numShippingCost < 0) return res.status(400).json({ message: "Shipping cost cannot be negative" });

        let parsedSizes;
        try {
            parsedSizes = typeof sizes === "string" ? JSON.parse(sizes || "[]") : (sizes || []);
        } catch {
            parsedSizes = [];
        }
        const product = await Product.create({ name, category, fabric, style, price: numPrice, originalPrice: numOriginalPrice, discount: numDiscount, shippingCost: numShippingCost, imageUrl, images, videoUrl: videoUrl || "", stock: numStock, sizes: parsedSizes });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.imageUrl) updates.imageUrl = req.imageUrl;

        // Parse sizes if sent as JSON string
        if (updates.sizes && typeof updates.sizes === "string") {
            try { updates.sizes = JSON.parse(updates.sizes); } catch { updates.sizes = []; }
        }

        // Handle videoUrl
        if (updates.videoUrl !== undefined) {
            updates.videoUrl = updates.videoUrl || "";
        }

        // Handle multiple images
        const additionalImages = req.additionalImages || [];
        const parseExistingImages = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            try { return JSON.parse(val); } catch { return []; }
        };
        if (req.imageUrl || additionalImages.length > 0) {
            const existingImages = parseExistingImages(updates.existingImages);
            const mainImage = req.imageUrl || updates.imageUrl;
            updates.images = [...existingImages, mainImage, ...additionalImages].filter(Boolean);
            updates.imageUrl = mainImage || existingImages[0] || updates.imageUrl;
        } else if (updates.existingImages) {
            const existingImages = parseExistingImages(updates.existingImages);
            updates.images = existingImages;
            updates.imageUrl = existingImages[0] || updates.imageUrl;
        }

        delete updates.existingImages;

        if (updates.price !== undefined && Number(updates.price) < 0) return res.status(400).json({ message: "Price cannot be negative" });
        if (updates.originalPrice !== undefined && Number(updates.originalPrice) < 0) return res.status(400).json({ message: "Original price cannot be negative" });
        if (updates.stock !== undefined && Number(updates.stock) < 0) return res.status(400).json({ message: "Stock cannot be negative" });
        if (updates.shippingCost !== undefined && Number(updates.shippingCost) < 0) return res.status(400).json({ message: "Shipping cost cannot be negative" });
        if (updates.discount !== undefined && (Number(updates.discount) < 0 || Number(updates.discount) > 100)) return res.status(400).json({ message: "Discount must be between 0 and 100" });

        const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateBulkShipping = async (req, res) => {
    try {
        const { productIds, shippingCost } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: "No products selected" });
        }
        const numShipping = Number(shippingCost) || 0;
        if (numShipping < 0) return res.status(400).json({ message: "Shipping cost cannot be negative" });

        await Product.updateMany(
            { _id: { $in: productIds } }, 
            { $set: { shippingCost: numShipping } }
        );
        res.json({ message: "Shipping updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── User Management ───

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        // Auto-seed defaults if nothing exists yet
        if (options.length === 0) {
            const docs = await CategoryOption.insertMany([
                { category: "shirt", ...DEFAULTS.shirt },
                { category: "trouser", ...DEFAULTS.trouser },
            ]);
            options = docs.map((d) => d.toObject());
        }
        const result = {};
        options.forEach((o) => { result[o.category] = { fabrics: o.fabrics, styles: o.styles, sizes: o.sizes || [] }; });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCategoryOptions = async (req, res) => {
    try {
        const { category, fabrics, styles, sizes } = req.body;
        if (!["shirt", "trouser"].includes(category)) {
            return res.status(400).json({ message: "Category must be 'shirt' or 'trouser'" });
        }
        const update = {};
        if (fabrics) update.fabrics = fabrics.filter((f) => f.trim());
        if (styles) update.styles = styles.filter((s) => s.trim());
        if (sizes) update.sizes = sizes.filter((s) => s.trim());

        const option = await CategoryOption.findOneAndUpdate(
            { category },
            { $set: update },
            { new: true, upsert: true }
        );
        res.json(option);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
