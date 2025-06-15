import express from "express"
import { Router } from "express"
import { createOrder ,getAllOrders, getOrderById, updateOrderStatus, deleteOrder} from "../controller/order.controller.ts"
import { authenticate, requireAdmin } from "../middleware/auth.middleware.ts";

const router  = Router()

router.post('/', createOrder);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.get("/:id", getOrderById)

// router.get('/session/:sessionId', getOrderBySessionId);
router.patch('/:id/status',authenticate, requireAdmin, updateOrderStatus);

export default router