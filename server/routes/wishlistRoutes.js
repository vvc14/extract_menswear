import { Router } from "express";
import { getWishlist, syncWishlist, toggleWishlistItem, removeFromWishlist, clearWishlist } from "../controllers/wishlistController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

router.use(userAuth);

router.get("/", getWishlist);
router.post("/sync", syncWishlist);
router.post("/toggle", toggleWishlistItem);
router.delete("/item/:productId", removeFromWishlist);
router.delete("/clear", clearWishlist);

export default router;
