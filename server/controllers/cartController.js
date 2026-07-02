import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Get user's cart
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(cart?.items || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sync entire cart (replace items) — no stock changes
export const syncCart = async (req, res) => {
    try {
        const { items } = req.body;
        const finalItems = items ? JSON.parse(JSON.stringify(items)) : [];

        const updatedCart = await Cart.findOneAndUpdate(
            { userId: req.user.id },
            { userId: req.user.id, items: finalItems },
            { upsert: true, new: true }
        ).populate("items.productId");

        res.json(updatedCart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add item to cart — no stock deduction, just check availability
export const addToCart = async (req, res) => {
    try {
        const { productId, name, price, imageUrl, images, category, fabric, style, shippingCost, quantity, size } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const qtyToAdd = quantity || 1;

        if (product.sizes && product.sizes.length > 0) {
            if (!size || !product.sizes.includes(size)) {
                return res.status(400).json({ message: "Invalid size selected" });
            }
        } else {
            if (size && size !== "") {
                return res.status(400).json({ message: "Invalid size selected" });
            }
        }

        let cart = await Cart.findOne({ userId: req.user.id });

        if (!cart) {
            cart = await Cart.create({
                userId: req.user.id,
                items: [{ productId, name, price, imageUrl, images: images || [], category, fabric, style, shippingCost: shippingCost || 0, quantity: qtyToAdd, size: size || "" }],
            });
        } else {
            const existing = cart.items.find((i) => i.productId.toString() === productId && (i.size || "") === (size || ""));
            if (existing) {
                existing.quantity += qtyToAdd;
            } else {
                cart.items.push({ productId, name, price, imageUrl, images: images || [], category, fabric, style, shippingCost: shippingCost || 0, quantity: qtyToAdd, size: size || "" });
            }
            await cart.save();
        }

        const updatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(updatedCart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update item quantity — no stock changes
export const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find((i) => i.productId.toString() === productId && (i.size || "") === (size || ""));
        if (!item) return res.status(404).json({ message: "Item not found in cart" });

        if (quantity <= 0) {
            cart.items = cart.items.filter((i) => !(i.productId.toString() === productId && (i.size || "") === (size || "")));
        } else {
            item.quantity = quantity;
        }

        await cart.save();

        const updatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(updatedCart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove item from cart — no stock restoration
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const { size } = req.query;
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter((i) => !(i.productId.toString() === productId && (i.size || "") === (size || "")));
        await cart.save();

        const updatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(updatedCart?.items || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear cart — no stock restoration
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
