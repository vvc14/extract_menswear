import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
    try {
        const { category, fabric, style, size, minPrice, maxPrice, search, sort } = req.query;
        const filter = {};

        if (category) filter.category = category;
        if (fabric) filter.fabric = { $in: fabric.split(",") };
        if (style) filter.style = { $in: style.split(",") };
        if (size) filter.sizes = { $in: size.split(",") };
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Math.max(0, Number(minPrice));
            if (maxPrice !== undefined) filter.price.$lte = Math.max(0, Number(maxPrice));
        }
        if (search) filter.name = { $regex: search, $options: "i" };

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "price-low": { price: 1 },
            "price-high": { price: -1 },
            "name-az": { name: 1 },
            "name-za": { name: -1 },
        };
        const sortOrder = sortMap[sort] || { createdAt: -1 };

        const limit = parseInt(req.query.limit) || 0;
        let query = Product.find(filter).sort(sortOrder);
        if (limit > 0) query = query.limit(limit);
        const products = await query;
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
