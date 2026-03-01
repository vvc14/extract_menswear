import { Router } from "express";
import { addProduct, updateProduct, deleteProduct, getUsers, updateUserRole } from "../controllers/adminController.js";
import authMiddleware from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = Router();

router.use(authMiddleware);

// Products
router.post("/products", upload.single("image"), uploadToCloudinary, addProduct);
router.put("/products/:id", upload.single("image"), uploadToCloudinary, updateProduct);
router.delete("/products/:id", deleteProduct);

// User management
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);

export default router;
