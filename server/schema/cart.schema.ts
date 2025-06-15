// schema/cart.schema.ts
import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().cuid("Invalid product ID format for cart item"),
  colorId: z.string().cuid("Invalid color ID format for cart item").optional(), // Color is optional for a product
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  packageId: z.string().cuid("Invalid package ID format for cart item").optional(), // Can add a package instead of a product
}).refine(data => {
  // Ensure either productId or packageId is provided, but not both
  return (!!data.productId !== !!data.packageId);
}, {
  message: "Either productId or packageId must be provided, but not both.",
  path: ["productId", "packageId"], // Path to the fields causing the error
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
