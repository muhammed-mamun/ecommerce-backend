//schema/category.schema.ts
import { z } from "zod";

// Base schema for both creation and update
export const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1),
  isActive: z.boolean().optional(),
});

// For creating a category (same as base)
export const createCategorySchema = categorySchema;

// For updating a category (requires an ID)
export const updateCategorySchema = categorySchema.extend({
  id: z.string().min(1, "Invalid category ID"),
});
