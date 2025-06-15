
//schema/product.schema.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sku: z.string().min(1),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().cuid(),
  stock: z.number().int().nonnegative(),
  colorIds: z.array(z.string().cuid()).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().cuid(),
});
