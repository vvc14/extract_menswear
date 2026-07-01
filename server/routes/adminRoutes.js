import { Router } from "express";
import { addProduct, updateProduct, deleteProduct, getUsers, updateUserRole, deleteUser, updateBulkShipping, getCategoryOptions, updateCategoryOptions } from "../controllers/adminController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

// Products
router.post("/products", upload.array("images", 10), uploadToCloudinary, addProduct);
router.put("/products/bulk-shipping", updateBulkShipping);
router.put("/products/:id", upload.array("images", 10), uploadToCloudinary, updateProduct);
router.delete("/products/:id", deleteProduct);

// User management
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Category options (fabrics/styles)
router.get("/category-options", getCategoryOptions);
router.put("/category-options", updateCategoryOptions);

export default router;
