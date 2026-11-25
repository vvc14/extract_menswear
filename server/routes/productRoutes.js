import { Router } from "express";
import { getProducts, getFacets, getProductById, addReview, deleteReview } from "../controllers/productController.js";
import { userAuth } from "../middleware/auth.js";
import { reviewImageUpload, uploadToCloudinary } from "../middleware/upload.js";

const router = Router();

router.get("/", getProducts);
router.get("/facets", getFacets);
router.get("/:id", getProductById);
router.post("/:id/reviews", userAuth, reviewImageUpload, uploadToCloudinary, addReview);
router.delete("/:id/reviews", userAuth, deleteReview);

export default router;
