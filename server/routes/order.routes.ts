import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrdersBySessionId,
} from "../controller/order.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate-limiting for order creation
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 requests per window
  message: "Too many order creation requests, please try again later.",
});

// Routes
router.post("/", createOrderLimiter, createOrder);
router.get("/", authenticate, requireAdmin, getAllOrders);
router.get("/:id", authenticate, getOrderById); 
router.get("/session/:sessionId", getOrdersBySessionId);
router.patch("/:id/status", authenticate, requireAdmin, updateOrderStatus);
router.delete("/:id", authenticate, requireAdmin, deleteOrder);

export default router;