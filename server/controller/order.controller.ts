import type { Request, Response } from 'express';
import prisma from '../DB/db.config'; 
import { OrderStatus } from '@prisma/client'; 
import { z } from 'zod'; 
import { orderSchema, getOrderByIdSchema, updateOrderStatusSchema } from '../schema/order.schema';


export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, name, phone, address } = req.body;

    // Validate request body
    const validationResult = orderSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.issues });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
            package: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty or does not exist for this session' });
      return;
    }

    let totalOrderPrice = 0;
    const orderItemsData = cart.items.map(item => {
      let unitPrice: number = 0;

      if (item.product) {
        unitPrice = parseFloat(item.product.price.toString());
      } else if (item.package) {
        unitPrice = parseFloat(item.package.price.toString());
      }

      const itemSubtotal = unitPrice * item.quantity;
      totalOrderPrice += itemSubtotal;

      return {
        productId: item.productId,
        packageId: item.packageId,
        colorId: item.colorId,
        quantity: item.quantity,
        price: unitPrice, // Price per unit at the time of order
        subtotal: itemSubtotal, // Total for this specific order item (price * quantity)
      };
    });

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        name,
        phone,
        address,
        sessionId,
        total: totalOrderPrice,
        status: OrderStatus.PENDING, // Initial status for a new order
        items: {
          create: orderItemsData, // Create all associated order items
        },
      },
      include: {
        items: true, // Include the created order items in the response
      },
    });

    // Clear the cart items for the session after the order is successfully placed
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.status(201).json(order); // Respond with the created order
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error occurred while creating order' });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: { // Include order items for each order
          include: {
            product: true, // Include details of the related product
            package: true, // Include details of the related package
            color: true,   // Include details of the selected color
          }
        },
      },
      orderBy: {
        createdAt: 'desc', // Sort orders by creation date, newest first
      },
    });
    res.status(200).json(orders); // Respond with the list of orders
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Internal server error occurred while fetching all orders' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }= req.params; // Get the order ID from URL parameters

    // Validate the ID format
    const validationResult = getOrderByIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.issues });
      return;
    }

    const order = await prisma.order.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            package: true,
            color: true,
          }
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found with the provided ID' });
      return;
    }
    res.status(200).json(order); // Respond with the found order
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Internal server error occurred while fetching order by ID' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Order ID from URL parameters
        const { status } = req.body; // New status from request body

        // Validate the order ID
        const idValidation = getOrderByIdSchema.safeParse(req.params);
        if (!idValidation.success) {
            res.status(400).json({ errors: idValidation.error.issues });
            return;
        }

        // Validate the new status against the OrderStatus enum
        const statusValidation = updateOrderStatusSchema.safeParse(req.body);
        if (!statusValidation.success) {
            res.status(400).json({ errors: statusValidation.error.issues });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: statusValidation.data.status,
            },
            include: {
                items: true,
            },
        });

        res.status(200).json(updatedOrder); // Respond with the updated order
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error occurred while updating order status' });
    }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Order ID from URL parameters

        // Validate the order ID
        const validationResult = getOrderByIdSchema.safeParse(req.params);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.issues });
            return;
        }

        // Check if the order exists before attempting to delete to provide a more specific error
        const existingOrder = await prisma.order.findUnique({
            where: { id },
        });

        if (!existingOrder) {
            res.status(404).json({ error: 'Order not found, cannot delete' });
            return;
        }

        await prisma.order.delete({
            where: { id },
        });

        res.status(204).send(); // 204 No Content indicates successful deletion with no body
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal server error occurred while deleting order' });
    }
};