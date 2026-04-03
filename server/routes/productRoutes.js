import { Router } from "express";
import { getProducts, getProductById } from "../controllers/productController.js";
import { getCategoryOptions } from "../controllers/adminController.js";

const router = Router();

router.get("/", getProducts);
router.get("/category-options", getCategoryOptions);
router.get("/:id", getProductById);

export default router;

