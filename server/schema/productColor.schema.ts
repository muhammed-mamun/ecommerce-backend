import { z } from "zod";

export const productColorSchema = z.object({
  productId: z.string().cuid(),
  colorId: z.string().cuid(),
});
