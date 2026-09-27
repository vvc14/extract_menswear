import { Router } from "express";
import authMiddleware, { userAuth } from "../middleware/auth.js";
import {
    getUserOrders,
    getOrderById,
    requestReturn,
    requestExchange,
    getAllOrders,
    getOrderStats,
    updateOrderStatus,
    cancelOrder,
    retryRefund,
} from "../controllers/orderController.js";

const router = Router();

// Admin routes (must come before /:id). authMiddleware enforces the admin role.
router.get("/admin", authMiddleware, getAllOrders);
router.get("/admin/stats", authMiddleware, getOrderStats);
router.put("/:id/status", authMiddleware, updateOrderStatus);
router.post("/:id/refund", authMiddleware, retryRefund);

// Customer routes (scoped to the signed-in user)
router.get("/", userAuth, getUserOrders);
router.get("/:id", userAuth, getOrderById);
router.post("/:id/cancel", userAuth, cancelOrder);
router.post("/:id/return", userAuth, requestReturn);
router.post("/:id/exchange", userAuth, requestExchange);

export default router;
