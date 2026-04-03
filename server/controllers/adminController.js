import Product from "../models/Product.js";
import User from "../models/User.js";
import CategoryOption from "../models/CategoryOption.js";

export const addProduct = async (req, res) => {
    try {
        const { name, category, fabric, style, price, originalPrice, discount, stock, shippingCost } = req.body;
        const imageUrl = req.imageUrl || req.body.imageUrl;

        if (!name || !category || !price || !imageUrl) {
            return res.status(400).json({ message: "Name, category, price, and image are required" });
        }

        const product = await Product.create({ name, category, fabric, style, price, originalPrice: originalPrice || 0, discount: discount || 0, shippingCost: shippingCost || 0, imageUrl, stock });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.imageUrl) updates.imageUrl = req.imageUrl;

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
        
        await Product.updateMany(
            { _id: { $in: productIds } }, 
            { $set: { shippingCost: Number(shippingCost) || 0 } }
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
    shirt: { fabrics: ["Linen", "Oxford", "Twill", "Satin"], styles: ["Plain", "Checks", "Print"] },
    trouser: { fabrics: ["Cotton", "Polyester", "Denim", "Wool"], styles: ["Formal", "Casual"] },
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
        options.forEach((o) => { result[o.category] = { fabrics: o.fabrics, styles: o.styles }; });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCategoryOptions = async (req, res) => {
    try {
        const { category, fabrics, styles } = req.body;
        if (!["shirt", "trouser"].includes(category)) {
            return res.status(400).json({ message: "Category must be 'shirt' or 'trouser'" });
        }
        const update = {};
        if (fabrics) update.fabrics = fabrics.filter((f) => f.trim());
        if (styles) update.styles = styles.filter((s) => s.trim());

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
