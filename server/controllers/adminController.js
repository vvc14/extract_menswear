import Product from "../models/Product.js";
import User from "../models/User.js";

export const addProduct = async (req, res) => {
    try {
        const { name, category, fabric, style, price, originalPrice, discount, stock } = req.body;
        const imageUrl = req.imageUrl || req.body.imageUrl;

        if (!name || !category || !price || !imageUrl) {
            return res.status(400).json({ message: "Name, category, price, and image are required" });
        }

        const product = await Product.create({ name, category, fabric, style, price, originalPrice: originalPrice || 0, discount: discount || 0, imageUrl, stock });
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
