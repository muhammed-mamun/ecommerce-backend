import type { Request, Response } from "express";
import prisma from "../DB/db.config.ts";
import { Prisma } from "@prisma/client";
import { createProductSchema, updateProductSchema } from "../schema/product.schema.ts";

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const result = createProductSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }

  try {
    const data = result.data;

    const product = await prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
        discount: data.discount ?? 0,
      },
      include: {
        category: true,
        color: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(409).json({
          error: `Duplicate field: ${error.meta?.target}`,
          field: error.meta?.target,
        });
        return;
      }
    }

    res.status(500).json({
      error: "Failed to create product",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ✅ Get Single Product
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;

  if (!id) {
    res.status(400).json({ error: "Product ID is required" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        color: true,
      },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      error: "Failed to fetch product",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ✅ Get All Products
export const getAllProducts = async (_: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        color: true,
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      error: "Failed to fetch products",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ✅ Update Product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const result = updateProductSchema.safeParse({ ...req.body, id: req.params.id });

  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }

  try {
    const data = result.data;

    const updatedProduct = await prisma.product.update({
      where: { id: data.id },
      data: {
        ...data,
        price: data.price !== undefined ? new Prisma.Decimal(data.price) : undefined,
        discount: data.discount,
        stock: data.stock,
      },
      include: {
        category: true,
        color: true,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2025":
          res.status(404).json({ error: "Product not found" });
          return;
        case "P2002":
          res.status(409).json({
            error: `Duplicate field: ${error.meta?.target}`,
            field: error.meta?.target,
          });
          return;
        case "P2003":
          res.status(400).json({
            error: "Invalid foreign key",
            field: error.meta?.field_name,
          });
          return;
      }
    }

    res.status(500).json({
      error: "Failed to update product",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ✅ Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(500).json({
      error: "Failed to delete product",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ✅ Get Products by Category
export const getProductsByCategory = async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId;

  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
      },
      include: {
        category: true,
        color: true,
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
