import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const orderSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"), 
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Phone number is too short"),
  address: z.string().min(1, "Address is required"),
});

export const orderItemSchema = z.object({
  orderId: z.string().cuid(),
  productId: z.string().cuid().optional(),
  packageId: z.string().cuid().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().multipleOf(0.01).min(0, "Price must be non-negative"),
  subtotal: z.number().multipleOf(0.01).min(0, "Subtotal must be non-negative"),
});

export const getOrderByIdSchema = z.object({
  id: z.string().cuid("Invalid order ID format"),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

// Add new schema for sessionId validation
export const getOrdersBySessionIdSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, "Invalid sessionId format"),
});