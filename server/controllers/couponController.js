import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import { handleError, httpError } from "../utils/httpError.js";

const CODE_RE = /^[A-Z0-9_-]{3,30}$/;

// Validate and normalise admin coupon input. `partial` allows omitted fields (updates).
const parseCouponInput = (body, partial = false) => {
    const out = {};

    if (body.code !== undefined || !partial) {
        const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
        if (!CODE_RE.test(code)) throw httpError(400, "Code must be 3-30 characters: letters, numbers, - or _");
        out.code = code;
    }
    if (body.discountType !== undefined || !partial) {
        if (!["percentage", "fixed"].includes(body.discountType)) throw httpError(400, "Discount type must be percentage or fixed");
        out.discountType = body.discountType;
    }
    if (body.discountValue !== undefined || !partial) {
        const v = Number(body.discountValue);
        if (!Number.isFinite(v) || v <= 0) throw httpError(400, "Discount value must be greater than 0");
        out.discountValue = v;
    }
    if (body.minOrderValue !== undefined) {
        const v = body.minOrderValue === "" || body.minOrderValue === null ? 0 : Number(body.minOrderValue);
        if (!Number.isFinite(v) || v < 0) throw httpError(400, "Minimum order value cannot be negative");
        out.minOrderValue = v;
    }
    if (body.usageLimit !== undefined) {
        if (body.usageLimit === "" || body.usageLimit === null) out.usageLimit = null;
        else {
            const v = Number(body.usageLimit);
            if (!Number.isInteger(v) || v < 1) throw httpError(400, "Usage limit must be a whole number ≥ 1 (leave empty for unlimited)");
            out.usageLimit = v;
        }
    }
    if (body.expiryDate !== undefined) {
        if (body.expiryDate === "" || body.expiryDate === null) out.expiryDate = null;
        else {
            // A plain date means "valid through the end of that day" (store timezone: IST)
            const raw = String(body.expiryDate);
            const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T23:59:59.999+05:30`) : new Date(raw);
            if (Number.isNaN(d.getTime())) throw httpError(400, "Invalid expiry date");
            out.expiryDate = d;
        }
    }
    for (const flag of ["isActive", "oncePerUser", "isPublic"]) {
        if (body[flag] !== undefined) out[flag] = body[flag] === true || body[flag] === "true";
    }
    return out;
};

const assertDiscountSane = (type, value) => {
    if (type === "percentage" && value > 100) throw httpError(400, "Percentage discount cannot exceed 100");
};

// ─── ADMIN ENDPOINTS ───

export const createCoupon = async (req, res) => {
    try {
        const data = parseCouponInput(req.body, false);
        assertDiscountSane(data.discountType, data.discountValue);
        if (await Coupon.exists({ code: data.code })) return res.status(409).json({ message: "Coupon code already exists." });
        const coupon = await Coupon.create(data);
        res.status(201).json(coupon);
    } catch (error) {
        handleError(res, error, "Create coupon");
    }
};

export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().select("-usedBy").sort({ createdAt: -1 }).lean();
        res.json(coupons);
    } catch (error) {
        handleError(res, error, "Get coupons");
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Coupon not found" });
        const current = await Coupon.findById(id).lean();
        if (!current) return res.status(404).json({ message: "Coupon not found" });

        const updates = parseCouponInput(req.body, true);
        assertDiscountSane(updates.discountType || current.discountType, updates.discountValue ?? current.discountValue);
        if (updates.code && (await Coupon.exists({ code: updates.code, _id: { $ne: id } }))) {
            return res.status(409).json({ message: "Coupon code already exists." });
        }

        const coupon = await Coupon.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select("-usedBy");
        res.json(coupon);
    } catch (error) {
        handleError(res, error, "Update coupon");
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Coupon not found" });
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        handleError(res, error, "Delete coupon");
    }
};

// ─── CUSTOMER ENDPOINTS ───

// POST /api/coupons/validate — preview only; checkout re-validates and reserves the coupon
export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const subtotal = Number(req.body.subtotal);
        if (typeof code !== "string" || !code.trim() || !Number.isFinite(subtotal) || subtotal <= 0) {
            return res.status(400).json({ message: "Coupon code and subtotal are required." });
        }

        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();
        if (!coupon) return res.status(404).json({ message: "Invalid coupon code." });
        if (!coupon.isActive) return res.status(400).json({ message: "This coupon is no longer active." });
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ message: "This coupon has expired." });
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: "This coupon has reached its usage limit." });

        if (coupon.oncePerUser) {
            if (!req.user) return res.status(401).json({ message: "Please sign in to use this coupon." });
            if ((coupon.usedBy || []).some((uid) => String(uid) === String(req.user.id))) {
                return res.status(400).json({ message: "You have already used this coupon." });
            }
        }

        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of ₹${coupon.minOrderValue} required.` });
        }

        let discountAmount = coupon.discountType === "percentage"
            ? (subtotal * Math.min(100, coupon.discountValue)) / 100
            : coupon.discountValue;
        discountAmount = Math.min(Math.max(0, discountAmount), subtotal);

        res.json({
            message: "Coupon applied successfully!",
            code: coupon.code,
            discountAmount: Math.round(discountAmount),
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
        });
    } catch (error) {
        handleError(res, error, "Validate coupon");
    }
};

// GET /api/coupons — public, active, unexpired, not used up
export const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            isPublic: { $ne: false },
            $and: [
                { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }] },
                { $or: [{ usageLimit: null }, { usageLimit: { $exists: false } }, { usageLimit: { $lte: 0 } }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
            ],
        })
            .select("code discountType discountValue minOrderValue oncePerUser")
            .sort({ createdAt: -1 })
            .lean();
        res.json(coupons);
    } catch (error) {
        handleError(res, error, "Get active coupons");
    }
};
