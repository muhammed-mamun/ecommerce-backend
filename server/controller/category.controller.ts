//controller/category.controller.ts
import type { Request, Response } from "express";
import prisma from "../DB/db.config.ts";
import { createCategorySchema , updateCategorySchema} from "../schema/category.schema.ts";
// Create a new category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const result = createCategorySchema.safeParse(req.body);
  if (!result.success) {
     res.status(400).json({ errors: result.error.errors });
     return
  }

  try {
    const category = await prisma.category.create({
      data: result.data,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Get a single category by ID
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
       res.status(404).json({ error: "Category not found" });
       return
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

// Get all categories
export const getAllCategories = async (_: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const result = updateCategorySchema.safeParse({ ...req.body, id: req.params.id });

  if (!result.success) {
     res.status(400).json({ errors: result.error.errors });
     return
  }

  try {
    const updated = await prisma.category.update({
      where: { id: result.data.id },
      data: {
        name: result.data.name,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await prisma.category.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
};
