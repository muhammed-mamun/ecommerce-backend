// schema/cart.schema.ts
import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().cuid("Invalid product ID format for cart item").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  packageId: z.string().cuid("Invalid package ID format for cart item").optional(),
}).refine(data => {
  return (!!data.productId !== !!data.packageId);
}, {
  message: "Either productId or packageId must be provided, but not both.",
  path: ["productId", "packageId"],
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});