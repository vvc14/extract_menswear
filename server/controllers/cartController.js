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

// Sync entire cart (replace items)
export const syncCart = async (req, res) => {
    try {
        const { items } = req.body;
        const cart = await Cart.findOne({ userId: req.user.id });

        // Keep track of quantities in the old cart
        const oldQtys = {};
        if (cart && cart.items) {
            cart.items.forEach(item => {
                const key = `${item.productId.toString()}_${item.size || ""}`;
                oldQtys[key] = (oldQtys[key] || 0) + item.quantity;
            });
        }

        // Keep track of quantities in the new cart
        const newQtys = {};
        if (items) {
            items.forEach(item => {
                const key = `${item.productId}_${item.size || ""}`;
                newQtys[key] = (newQtys[key] || 0) + item.quantity;
            });
        }

        // Process all products involved in old and new carts
        const allProductIds = new Set([
            ...(cart?.items || []).map(i => i.productId.toString()),
            ...(items || []).map(i => i.productId)
        ]);

        const finalItems = items ? JSON.parse(JSON.stringify(items)) : [];

        for (const pid of allProductIds) {
            const product = await Product.findById(pid);
            if (!product) continue;

            const oldQtyForProd = Object.keys(oldQtys)
                .filter(k => k.startsWith(pid + "_"))
                .reduce((sum, k) => sum + oldQtys[k], 0);

            const newQtyForProd = Object.keys(newQtys)
                .filter(k => k.startsWith(pid + "_"))
                .reduce((sum, k) => sum + newQtys[k], 0);

            const diff = newQtyForProd - oldQtyForProd;
            if (diff > 0) {
                // Deduct from stock, but clamp to available stock if exceeded
                const actualDeduct = Math.min(product.stock, diff);
                product.stock -= actualDeduct;
                await product.save();

                // Adjust items quantity if we had to clamp
                if (actualDeduct < diff) {
                    const diffDiff = diff - actualDeduct;
                    let remainingToReduce = diffDiff;
                    for (const item of finalItems) {
                        if (item.productId === pid) {
                            const reduceAmount = Math.min(item.quantity - 1, remainingToReduce);
                            item.quantity -= reduceAmount;
                            remainingToReduce -= reduceAmount;
                            if (remainingToReduce <= 0) break;
                        }
                    }
                }
            } else if (diff < 0) {
                // Restore to stock
                product.stock += Math.abs(diff);
                await product.save();
            }
        }

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

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { productId, name, price, imageUrl, images, category, fabric, style, shippingCost, quantity, size } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const qtyToAdd = quantity || 1;
        if (product.stock < qtyToAdd) {
            return res.status(400).json({ message: `Only ${product.stock} items left in stock` });
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

        // Deduct from product stock
        product.stock -= qtyToAdd;
        await product.save();

        const updatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(updatedCart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find((i) => i.productId.toString() === productId && (i.size || "") === (size || ""));
        if (!item) return res.status(404).json({ message: "Item not found in cart" });

        const oldQty = item.quantity;
        const newQty = quantity;
        const diff = newQty - oldQty;

        if (diff > 0) {
            if (product.stock < diff) {
                return res.status(400).json({ message: `Only ${product.stock} additional items left in stock` });
            }
            item.quantity = newQty;
            product.stock -= diff;
        } else if (diff < 0) {
            if (newQty <= 0) {
                cart.items = cart.items.filter((i) => !(i.productId.toString() === productId && (i.size || "") === (size || "")));
            } else {
                item.quantity = newQty;
            }
            product.stock += Math.abs(diff);
        }

        await cart.save();
        await product.save();

        const updatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(updatedCart.items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const { size } = req.query;
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find((i) => i.productId.toString() === productId && (i.size || "") === (size || ""));
        if (item) {
            const qtyToRestore = item.quantity;
            cart.items = cart.items.filter((i) => !(i.productId.toString() === productId && (i.size || "") === (size || "")));
            await cart.save();

            const product = await Product.findById(productId);
            if (product) {
                product.stock += qtyToRestore;
                await product.save();
            }
        }

        const updatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(updatedCart?.items || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (cart && cart.items && cart.items.length > 0) {
            for (const item of cart.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
            cart.items = [];
            await cart.save();
        }
        res.json({ message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
