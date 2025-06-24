import prisma from '../DB/db.config.ts';
import type { Request, Response } from 'express';

// Get or create cart by session ID
export const getOrCreateCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                color: true // Product now has its own color
              }
            },
            package: {
              include: {
                items: {
                  include: {
                    product: {
                      include: {
                        color: true
                      }
                    },
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  color: true
                }
              },
              package: {
                include: {
                  items: {
                    include: {
                      product: {
                        include: {
                          color: true
                        }
                      },
                     
                    }
                  }
                }
              }
            }
          }
        }
      });
    }

    res.json(cart);
  } catch (error) {
    console.error('Error getting/creating cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add item to cart
export const addItemToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { productId, packageId, quantity = 1 } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    if (!productId && !packageId) {
      res.status(400).json({ error: 'Either productId or packageId is required' });
      return;
    }

    if (productId && packageId) {
      res.status(400).json({ error: 'Cannot add both product and package in same item' });
      return;
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { sessionId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId }
      });
    }

    // Check if item already exists in cart (no colorId needed since product has its own color)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId || null,
        packageId: packageId || null
      }
    });

    let cartItem;
    if (existingItem) {
      // Update quantity if item exists
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              category: true,
              color: true
            }
          },
          package: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      color: true
                    }
                  },
                 
                }
              }
            }
          }
        }
      });
    } else {
      // Create new cart item (no colorId field needed)
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          packageId,
          quantity
        },
        include: {
          product: {
            include: {
              category: true,
              color: true
            }
          },
          package: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      color: true
                    }
                  },
                 
                }
              }
            }
          }
        }
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, itemId } = req.params;
    const { quantity } = req.body;

    if (!sessionId || !itemId) {
      res.status(400).json({ error: 'Session ID and Item ID are required' });
      return;
    }

    if (quantity < 0) {
      res.status(400).json({ error: 'Quantity cannot be negative' });
      return;
    }

    // Verify the cart item belongs to the session
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          where: { id: itemId }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await prisma.cartItem.delete({
        where: { id: itemId }
      });
      res.json({ message: 'Item removed from cart' });
      return;
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: {
            category: true,
            color: true
          }
        },
        package: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    color: true
                  }
                },
              }
            }
          }
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove item from cart
export const removeItemFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, itemId } = req.params;

    if (!sessionId || !itemId) {
      res.status(400).json({ error: 'Session ID and Item ID are required' });
      return;
    }

    // Verify the cart item belongs to the session
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          where: { id: itemId }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId }
    });

    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get cart summary (total items, total price)
export const getCartSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
            package: true
          }
        }
      }
    });

    if (!cart) {
      res.json({
        totalItems: 0,
        totalPrice: 0,
        itemCount: 0
      });
      return;
    }

    let totalItems = 0;
    let totalPrice = 0;

    cart.items.forEach(item => {
      totalItems += item.quantity;
      if (item.product) {
        totalPrice += item.product.price.toNumber() * item.quantity;
      } else if (item.package) {
        totalPrice += item.package.price.toNumber() * item.quantity;
      }
    });

    res.json({
      totalItems,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      itemCount: cart.items.length
    });
  } catch (error) {
    console.error('Error getting cart summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};