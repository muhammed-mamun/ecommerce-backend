import { z } from "zod";

export const colorSchema = z.object({
  name: z.string().min(1),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
