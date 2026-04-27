import Wishlist from "../models/Wishlist.js";

// Get user's wishlist
export const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user.id });
        res.json(wishlist?.items || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sync entire wishlist (replace items)
export const syncWishlist = async (req, res) => {
    try {
        const { items } = req.body;
        const wishlist = await Wishlist.findOneAndUpdate(
            { userId: req.user.id },
            { userId: req.user.id, items: items || [] },
            { upsert: true, new: true }
        );
        res.json(wishlist.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle item in wishlist (add if not present, remove if present)
export const toggleWishlistItem = async (req, res) => {
    try {
        const { productId, name, price, imageUrl, images, category, fabric, style, discount, originalPrice } = req.body;
        let wishlist = await Wishlist.findOne({ userId: req.user.id });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                userId: req.user.id,
                items: [{ productId, name, price, imageUrl, images: images || [], category, fabric, style, discount, originalPrice }],
            });
            return res.json({ items: wishlist.items, added: true });
        }

        const existingIndex = wishlist.items.findIndex((i) => i.productId.toString() === productId);
        if (existingIndex >= 0) {
            wishlist.items.splice(existingIndex, 1);
            await wishlist.save();
            return res.json({ items: wishlist.items, added: false });
        } else {
            wishlist.items.push({ productId, name, price, imageUrl, images: images || [], category, fabric, style, discount, originalPrice });
            await wishlist.save();
            return res.json({ items: wishlist.items, added: true });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const wishlist = await Wishlist.findOne({ userId: req.user.id });
        if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

        wishlist.items = wishlist.items.filter((i) => i.productId.toString() !== productId);
        await wishlist.save();
        res.json(wishlist.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
    try {
        await Wishlist.findOneAndUpdate({ userId: req.user.id }, { items: [] });
        res.json({ message: "Wishlist cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
