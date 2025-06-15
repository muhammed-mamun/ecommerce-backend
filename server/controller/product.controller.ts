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
    // Extract colorIds from validated data
    const { colorIds, ...productData } = result.data;

    // Create the product first
    const product = await prisma.product.create({
      data: {
        ...productData,
        price: new Prisma.Decimal(productData.price)
      }
    });

    // Handle color relations if colorIds exist
    if (colorIds && colorIds.length > 0) {
      await prisma.productColor.createMany({
        data: colorIds.map(colorId => ({
          productId: product.id,
          colorId,
        })),
      });
    }

    // Fetch the complete product with relations for response
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        colors: {
          include: { color: true }
        }
      }
    });

    res.status(201).json(completeProduct);

  } catch (error) {
    console.error('Error creating product:', error);
    
    // More detailed error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          res.status(409).json({ 
            error: "Product with this SKU already exists",
            field: error.meta?.target 
          });
          return;
        case 'P2003':
          res.status(400).json({ 
            error: "Invalid foreign key - check categoryId or colorIds",
            field: error.meta?.field_name 
          });
          return;
        default:
          res.status(500).json({ 
            error: "Database error", 
            details: error.message 
          });
          return;
      }
    }
    
    res.status(500).json({ 
      error: "Failed to create product",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;

  // Simple ID validation
  if (!id) {
    res.status(400).json({ error: "Product ID is required" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        colors: {
          include: { color: true }
        }
      }
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: "Failed to fetch product",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllProducts = async (_: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        colors: {
          include: { color: true }
        }
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: "Failed to fetch products",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const result = updateProductSchema.safeParse({ ...req.body, id: req.params.id });
  
  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }

  try {
    const { colorIds, ...updateData } = result.data;

    // Update the product
    const updated = await prisma.product.update({
      where: { id: result.data.id },
      data: {
        ...updateData,
        price: updateData.price ? new Prisma.Decimal(updateData.price) : undefined,
      }
    });

    // Handle color updates if provided
    if (colorIds !== undefined) {
      // Remove existing color relations
      await prisma.productColor.deleteMany({
        where: { productId: result.data.id }
      });

      // Add new color relations
      if (colorIds.length > 0) {
        await prisma.productColor.createMany({
          data: colorIds.map(colorId => ({
            productId: result.data.id,
            colorId,
          })),
        });
      }
    }

    // Fetch updated product with relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: result.data.id },
      include: {
        category: true,
        colors: {
          include: { color: true }
        }
      }
    });

    res.json(completeProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          res.status(404).json({ error: "Product not found" });
          return;
        case 'P2002':
          res.status(409).json({ 
            error: "Product with this SKU already exists",
            field: error.meta?.target 
          });
          return;
        case 'P2003':
          res.status(400).json({ 
            error: "Invalid foreign key - check categoryId or colorIds",
            field: error.meta?.field_name 
          });
          return;
      }
    }
    
    res.status(500).json({ 
      error: "Failed to update product",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // First delete related ProductColor records
    await prisma.productColor.deleteMany({
      where: { productId: id }
    });

    // Then delete the product
    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    
    res.status(500).json({ 
      error: "Failed to delete product",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};