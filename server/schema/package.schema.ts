import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal number"),
  imageUrl: z.string().url("Invalid URL format").optional(),
  stock: z.number().int().min(0).default(0),
  items: z
    .array(
      z.object({
        productId: z.string().cuid("Invalid product ID format"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Package must contain at least one item"),
});