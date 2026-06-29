import { Router } from "express";
import { getProducts, getProductById, addReview } from "../controllers/productController.js";
import { getCategoryOptions } from "../controllers/adminController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.get("/", getProducts);
router.get("/category-options", getCategoryOptions);
router.get("/:id", getProductById);
router.post("/:id/reviews", authMiddleware, addReview);

export default router;

