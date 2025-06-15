import type { Request, Response } from "express";
import { createPackageSchema } from "../schema/package.schema.ts";
import prisma from "../DB/db.config.ts";
import { Prisma } from "@prisma/client";

// Create a new package
export const createPackage = async (req: Request, res: Response): Promise<void> => {
  const result = createPackageSchema.safeParse(req.body);
  if (!result.success) {
     res.status(400).json({ error: result.error.format() });
     return
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
            color: item.colorId ? { connect: { id: item.colorId } } : undefined,
          })),
        },
      },
      include: {
        items: { include: { product: true, color: true } },
      },
    });

    res.status(201).json(newPackage);
  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({ error: "Failed to create package" });
  }
};

// Update a package
export const updatePackage = async (req: Request, res: Response):Promise<void> => {
  const { id } = req.params;

  const result = createPackageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.format() });
    return
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
            color: item.colorId ? { connect: { id: item.colorId } } : undefined,
          })),
        },
      },
      include: {
        items: { include: { product: true, color: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({ error: "Failed to update package" });
  }
};

// Delete a package
export const deletePackage = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.packageItem.deleteMany({ where: { packageId: id } });
    await prisma.package.delete({ where: { id } });
    res.status(200).json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Delete package error:", error);
    res.status(500).json({ error: "Failed to delete package" });
  }
};

// Get all packages
export const getPackages = async (_req: Request, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        items: { include: { product: true, color: true } },
      },
    });
    res.json(packages);
  } catch (error) {
    console.error("Fetch packages error:", error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
};

// Get single package
export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, color: true } },
      },
    });

    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return
    }

    res.json(pkg);
  } catch (error) {
    console.error("Get package by ID error:", error);
    res.status(500).json({ error: "Failed to get package" });
  }
};
