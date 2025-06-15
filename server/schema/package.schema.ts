import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  imageUrl: z.string().url().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().min(1),
        colorId: z.string().cuid().optional(),
      })
    )
    .min(1),
});
