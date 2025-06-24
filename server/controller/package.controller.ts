import type { Request, Response } from "express";
import { createPackageSchema } from "../schema/package.schema.ts";
import prisma from "../DB/db.config.ts";
import { Prisma } from "@prisma/client";

// Create a new package
export const createPackage = async (req: Request, res: Response): Promise<void> => {
  const result = createPackageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.format() });
    return;
  }

  const { name, description, price, imageUrl, items } = result.data;

  try {
    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price: new Prisma.Decimal(price),
        imageUrl,
        items: {
          create: items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            // Removed colorId since products have their own fixed color
          })),
        },
      },
      include: {
        items: { 
          include: { 
            product: {
              include: {
                color: true, // Get the product's fixed color
                category: true
              }
            }
          } 
        },
      },
    });

    res.status(201).json(newPackage);
  } catch (error) {
    console.error("Create package error:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(409).json({
          error: `Duplicate field: ${error.meta?.target}`,
          field: error.meta?.target,
        });
        return;
      }
      if (error.code === "P2025") {
        res.status(404).json({ error: "One or more products not found" });
        return;
      }
    }
    
    res.status(500).json({ 
      error: "Failed to create package",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Update a package
export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = createPackageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.format() });
    return;
  }

  const { name, description, price, imageUrl, items } = result.data;

  try {
    // Delete old items first to avoid duplicates
    await prisma.packageItem.deleteMany({ where: { packageId: id } });

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name,
        description,
        price: new Prisma.Decimal(price),
        imageUrl,
        items: {
          create: items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            // Removed colorId since products have their own fixed color
          })),
        },
      },
      include: {
        items: { 
          include: { 
            product: {
              include: {
                color: true,
                category: true
              }
            }
          } 
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update package error:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Package not found" });
        return;
      }
    }
    
    res.status(500).json({ 
      error: "Failed to update package",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Delete a package
export const deletePackage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.package.delete({ 
      where: { id } 
    }); // PackageItems will be deleted automatically due to cascade

    res.status(200).json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Delete package error:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Package not found" });
        return;
      }
    }
    
    res.status(500).json({ 
      error: "Failed to delete package",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get all packages
export const getPackages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        items: { 
          include: { 
            product: {
              include: {
                color: true,
                category: true
              }
            }
          } 
        },
      },
    });
    res.json(packages);
  } catch (error) {
    console.error("Fetch packages error:", error);
    res.status(500).json({ 
      error: "Failed to fetch packages",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get single package
export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Package ID is required" });
    return;
  }

  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        items: { 
          include: { 
            product: {
              include: {
                color: true, // Get the product's fixed color
                category: true
              }
            }
          } 
        },
      },
    });

    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }

    res.json(pkg);
  } catch (error) {
    console.error("Get package by ID error:", error);
    res.status(500).json({ 
      error: "Failed to get package",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};