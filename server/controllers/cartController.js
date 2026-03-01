import Cart from "../models/Cart.js";

// Get user's cart
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        res.json(cart?.items || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sync entire cart (replace items)
export const syncCart = async (req, res) => {
    try {
        const { items } = req.body;
        const cart = await Cart.findOneAndUpdate(
            { userId: req.user.id },
            { userId: req.user.id, items: items || [] },
            { upsert: true, new: true }
        );
        res.json(cart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { productId, name, price, imageUrl, category, fabric, style, quantity } = req.body;
        let cart = await Cart.findOne({ userId: req.user.id });

        if (!cart) {
            cart = await Cart.create({
                userId: req.user.id,
                items: [{ productId, name, price, imageUrl, category, fabric, style, quantity: quantity || 1 }],
            });
        } else {
            const existing = cart.items.find((i) => i.productId.toString() === productId);
            if (existing) {
                existing.quantity += quantity || 1;
            } else {
                cart.items.push({ productId, name, price, imageUrl, category, fabric, style, quantity: quantity || 1 });
            }
            await cart.save();
        }

        res.json(cart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        if (quantity <= 0) {
            cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
        } else {
            const item = cart.items.find((i) => i.productId.toString() === productId);
            if (item) item.quantity = quantity;
        }

        await cart.save();
        res.json(cart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
        await cart.save();
        res.json(cart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [] });
        res.json({ message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
