import { Router } from "express";
import { addProduct, updateProduct, deleteProduct, getUsers, updateUserRole, deleteUser, updateBulkShipping, getCategoryOptions, updateCategoryOptions, getSettings, updateSetting } from "../controllers/adminController.js";
import { createCoupon, getCoupons, updateCoupon, deleteCoupon } from "../controllers/couponController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

// Products
router.post("/products", upload.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]), uploadToCloudinary, addProduct);
router.put("/products/bulk-shipping", updateBulkShipping);
router.put("/products/:id", upload.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]), uploadToCloudinary, updateProduct);
router.delete("/products/:id", deleteProduct);

// User management
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Category options (fabrics/styles)
router.get("/category-options", getCategoryOptions);
router.put("/category-options", updateCategoryOptions);

// Store settings
router.get("/settings", getSettings);
router.put("/settings", updateSetting);

// Coupons
router.post("/coupons", createCoupon);
router.get("/coupons", getCoupons);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

export default router;
