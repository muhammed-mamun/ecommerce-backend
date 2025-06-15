import express from 'express'
import type { Request, Response, NextFunction } from 'express';
const router = express.Router();

import {
  getOrCreateCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
  getCartSummary
} from '../controller/cart.controller.js';


const validateSessionId = (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  if (!sessionId || sessionId.length < 10) {
     res.status(400).json({ error: 'Invalid session ID format' });
     return
  }
  next();
};


router.get('/:sessionId', validateSessionId, getOrCreateCart);
router.post('/:sessionId/items', validateSessionId, addItemToCart);
router.put('/:sessionId/items/:itemId', validateSessionId, updateCartItem);
router.delete('/:sessionId/items/:itemId', validateSessionId, removeItemFromCart);
router.delete('/:sessionId', validateSessionId, clearCart);
router.get('/:sessionId/summary', validateSessionId, getCartSummary);

export default router;