import { Router } from "express";
import { getCart, syncCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

router.use(userAuth);

router.get("/", getCart);
router.post("/sync", syncCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/item/:productId", removeFromCart);
router.delete("/clear", clearCart);

export default router;
