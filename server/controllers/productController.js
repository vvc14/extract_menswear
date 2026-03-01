import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
    try {
        const { category, fabric, style, minPrice, maxPrice, search } = req.query;
        const filter = {};

        if (category) filter.category = category;
        if (fabric) filter.fabric = { $in: fabric.split(",") };
        if (style) filter.style = { $in: style.split(",") };
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) filter.name = { $regex: search, $options: "i" };

        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
