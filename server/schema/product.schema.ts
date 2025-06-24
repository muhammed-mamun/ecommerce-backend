import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  discount: z.number().min(0).max(100).optional().default(0),
  sku: z.string().min(1),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().cuid(),
  colorId: z.string().cuid(), 
});


export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().cuid(), 
});