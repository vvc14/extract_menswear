import { Router } from "express";
import { getProducts, getProductById, addReview } from "../controllers/productController.js";
import { getCategoryOptions } from "../controllers/adminController.js";
import { userAuth } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = Router();

router.get("/", getProducts);
router.get("/category-options", getCategoryOptions);
router.get("/:id", getProductById);
router.post("/:id/reviews", userAuth, upload.single("image"), uploadToCloudinary, addReview);

export default router;

