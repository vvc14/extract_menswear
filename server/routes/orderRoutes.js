import { Router } from "express";
import { userAuth } from "../middleware/auth.js";
import authMiddleware from "../middleware/auth.js";
import { getUserOrders, getOrderById, requestReturn, requestExchange, getAllOrders, updateOrderStatus } from "../controllers/orderController.js";

const router = Router();

// Admin routes (must come before /:id)
router.get("/admin", authMiddleware, getAllOrders);
router.put("/:id/status", authMiddleware, updateOrderStatus);

// User routes
router.get("/", userAuth, getUserOrders);
router.get("/:id", userAuth, getOrderById);
router.post("/:id/return", userAuth, requestReturn);
router.post("/:id/exchange", userAuth, requestExchange);

export default router;
