import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../DB/db.config.ts";

// Zod schemas for validation
const hexCodeSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex code format. Use #RRGGBB or #RGB")
  .transform(val => val.toUpperCase());

const createColorSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  hexCode: hexCodeSchema,
});

const updateColorSchema = z.object({
  name: z.string()
    .min(1, "Name cannot be empty")
    .max(50, "Name must be less than 50 characters")
    .trim()
    .optional(),
  hexCode: hexCodeSchema.optional(),
});

const querySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  search: z.string().max(100).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100).optional().default("50")
});

const paramsSchema = z.object({
  id: z.string().cuid("Invalid color ID format")
});

// Middleware function for validation
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// GET /colors - list all colors with filtering and pagination
export const getColors = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const validatedQuery = querySchema.parse(req.query);
    const { active, search, page, limit } = validatedQuery;
    
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (active !== undefined) {
      whereClause.isActive = active === 'true';
    }
    
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get colors with product count
    const [colors, totalCount] = await Promise.all([
      prisma.color.findMany({
        where: whereClause,
        orderBy: [
          { name: 'asc' }
        ],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              products: true,
              orderItems: true
            }
          }
        }
      }),
      prisma.color.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: colors,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    return
  } catch (error) {
    console.error('Error fetching colors:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error fetching colors", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /colors/:id - get single color with details
export const getColor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate params
    const { id } = paramsSchema.parse(req.params);
    
    const color = await prisma.color.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            orderItems: true
          }
        }
      }
    });

    if (!color) {
       res.status(404).json({
        success: false,
        message: "Color not found"
      });
      return
    }

    res.json({
      success: true,
      data: color
    });
  } catch (error) {
    console.error('Error fetching color:', error);
    
    if (error instanceof z.ZodError) {
       res.status(400).json({
        success: false,
        message: "Invalid color ID",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error fetching color", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /colors - create new color with validation
export const createColor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createColorSchema.parse(req.body);
    const { name, hexCode } = validatedData;

    const color = await prisma.color.create({
      data: { 
        name, 
        hexCode,
      },
    });
    
    res.status(201).json({
      success: true,
      message: "Color created successfully",
      data: color
    });
  } catch (error) {
    console.error('Error creating color:', error);
    
    if (error instanceof z.ZodError) {
       res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return
    }
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = error as any;
      const field = meta.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        message: `Color ${field} already exists`
      });
      return
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error creating color", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// PUT /colors/:id - update existing color
export const updateColor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate params and body
    const { id } = paramsSchema.parse(req.params);
    const validatedData = updateColorSchema.parse(req.body);

    // Check if color exists
    const existingColor = await prisma.color.findUnique({
      where: { id }
    });

    if (!existingColor) {
        res.status(404).json({
        success: false,
        message: "Color not found"
      });
      return
    }

    const updated = await prisma.color.update({
      where: { id },
      data: validatedData,
    });
    
    res.json({
      success: true,
      message: "Color updated successfully",
      data: updated
    });
  } catch (error) {
    console.error('Error updating color:', error);
    
    if (error instanceof z.ZodError) {
       res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return
    }
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = error as any;
      const field = meta.meta?.target?.[0] || 'field';
       res.status(409).json({
        success: false,
        message: `Color ${field} already exists`
      });
      return
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error updating color", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// DELETE /colors/:id - safe delete with usage checking
export const deleteColor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate params
    const { id } = paramsSchema.parse(req.params);
    
    // Validate query for force parameter
    const forceSchema = z.object({
      force: z.enum(["true", "false"]).optional()
    });
    const { force } = forceSchema.parse(req.query);
    
    // Check if color exists and get usage count
    const existingColor = await prisma.color.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            orderItems: true
          }
        }
      }
    });

    if (!existingColor) {
        res.status(404).json({
        success: false,
        message: "Color not found"
      });
      return
    }

    // Check if color is being used
    const isInUse = existingColor._count.products > 0 || 
                    existingColor._count.orderItems > 0;

    if (isInUse && force !== 'true') {
        res.status(400).json({
        success: false,
        message: "Cannot delete color that is in use. Set isActive=false instead or use ?force=true",
        data: {
          productsUsing: existingColor._count.products,
          orderItemsUsing: existingColor._count.orderItems
        }
      });
      return
    }

    // If force=true or not in use, delete completely
    await prisma.color.delete({ where: { id } });
    
    res.status(200).json({
      success: true,
      message: "Color deleted successfully"
    });
    
  } catch (error) {
    console.error('Error deleting color:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error deleting color", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
  }
};

// PATCH /colors/:id/toggle - toggle active status
export const toggleColorStatus = async (req: Request, res: Response) => {
  try {
    // Validate params
    const { id } = paramsSchema.parse(req.params);
    
    const existingColor = await prisma.color.findUnique({
      where: { id }
    });

    if (!existingColor) {
      return res.status(404).json({
        success: false,
        message: "Color not found"
      });
    }

  } catch (error) {
    console.error('Error toggling color status:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid color ID",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error toggling color status", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export validation middleware for use in routes
export const validateCreateColor = validateRequest(createColorSchema);
export const validateUpdateColor = validateRequest(updateColorSchema);