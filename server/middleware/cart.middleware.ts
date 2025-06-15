// middleware/cartMiddleware.js
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
/**
 * Middleware to generate session ID for cart if not provided
 * This can be used on frontend to ensure every user has a unique session
 */

export const generateSessionId = (req: Request, res: Response, next:NextFunction) => {
  if (!req.headers['x-session-id']) {
    req.headers['x-session-id'] = uuidv4();
  }
  next();
};

/**
 * Middleware to validate cart item data
 */
export const validateCartItem = (req: Request, res: Response, next:NextFunction) => {
  const { productId, packageId, quantity } = req.body;
  
  // Check if either productId or packageId is provided
  if (!productId && !packageId) {
    return res.status(400).json({ 
      error: 'Either productId or packageId must be provided' 
    });
  }
  
  // Check if both are provided (not allowed)
  if (productId && packageId) {
    return res.status(400).json({ 
      error: 'Cannot provide both productId and packageId' 
    });
  }
  
  // Validate quantity
  if (quantity !== undefined && (quantity < 1 || !Number.isInteger(quantity))) {
    return res.status(400).json({ 
      error: 'Quantity must be a positive integer' 
    });
  }
  
  next();
};

/**
 * Middleware to validate session ID format
 */
export const validateSessionId = (req: Request, res: Response, next:NextFunction) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  // Basic validation - should be at least 10 characters
  if (sessionId.length < 10) {
    return res.status(400).json({ error: 'Invalid session ID format' });
  }
  
  next();
};

/**
 * Middleware to clean up old carts (can be used in a cron job)
 */
export const cleanupOldCarts = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const prisma = new PrismaClient();
    
    // Delete carts older than 30 days with no items
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.cart.deleteMany({
      where: {
        updatedAt: {
          lt: thirtyDaysAgo
        },
        items: {
          none: {}
        }
      }
    });
    
    next();
  } catch (error) {
    console.error('Error cleaning up old carts:', error);
    next(); // Continue even if cleanup fails
  }
};

