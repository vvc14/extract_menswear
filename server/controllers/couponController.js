import Coupon from "../models/Coupon.js";

// ─── ADMIN ENDPOINTS ───

// Create a new coupon
export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderValue, usageLimit, expiryDate, isActive } = req.body;
        
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: "Coupon code already exists." });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderValue,
            usageLimit,
            expiryDate,
            isActive
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all coupons
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a coupon
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        if (updates.code) {
            updates.code = updates.code.toUpperCase();
            const existing = await Coupon.findOne({ code: updates.code, _id: { $ne: id } });
            if (existing) {
                return res.status(400).json({ message: "Coupon code already exists." });
            }
        }

        const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });

        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a coupon
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });

        res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── CUSTOMER ENDPOINT ───

// Validate a coupon
export const validateCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        
        if (!code || !subtotal) {
            return res.status(400).json({ message: "Coupon code and subtotal are required." });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        
        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code." });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ message: "This coupon is no longer active." });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: "This coupon has expired." });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "This coupon has reached its usage limit." });
        }

        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of ₹${coupon.minOrderValue} required.` });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = (subtotal * coupon.discountValue) / 100;
        } else if (coupon.discountType === "fixed") {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount > subtotal) {
            discountAmount = subtotal;
        }

        res.json({
            message: "Coupon applied successfully!",
            code: coupon.code,
            discountAmount: Math.round(discountAmount),
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/coupons — retrieve all active, unexpired coupons for customers
export const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            $or: [
                { expiryDate: { $exists: false } },
                { expiryDate: null },
                { expiryDate: { $gt: now } }
            ]
        })
        .select("code discountType discountValue minOrderValue")
        .sort({ createdAt: -1 });

        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
