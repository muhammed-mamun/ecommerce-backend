import type { Request, Response } from "express";
import prisma from "../DB/db.config";
import { Prisma, OrderStatus } from "@prisma/client";
import { z } from "zod";
import {
  orderSchema,
  getOrderByIdSchema,
  updateOrderStatusSchema,
  getOrdersBySessionIdSchema,
} from "../schema/order.schema";

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
      res.status(400).json({ error: "Cart is empty or does not exist for this session" });
      return;
    }

    let totalOrderPrice = new Prisma.Decimal(0);
    const orderItemsData = cart.items.map((item) => {
      let unitPrice: Prisma.Decimal = new Prisma.Decimal(0);

      if (item.product) {
        unitPrice = item.product.price;
      } else if (item.package) {
        unitPrice = item.package.price;
      }

      const itemQuantity = new Prisma.Decimal(item.quantity);
      const itemSubtotal = unitPrice.mul(itemQuantity);
      totalOrderPrice = totalOrderPrice.add(itemSubtotal);

      return {
        productId: item.productId,
        packageId: item.packageId,
        quantity: item.quantity,
        price: unitPrice,
        subtotal: itemSubtotal,
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
        status: OrderStatus.PENDING,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            package: true,
            color: true,
          },
        },
      },
    });

    // Clear the cart after successful order creation
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    await prisma.cart.delete({
      where: { id: cart.id },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(409).json({ error: "Duplicate entry detected." });
      } else if (error.code === "P2025") {
        res.status(404).json({ error: "One or more items in the cart were not found." });
      } else {
        res.status(500).json({ error: `Database error: ${error.message}` });
      }
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input data", details: error.flatten() });
    } else {
      res.status(500).json({ error: "Internal server error occurred while creating order" });
    }
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              include: {
                color: true,
              },
            },
            package: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ error: "Internal server error occurred while fetching all orders" });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

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
            product: {
              include: {
                color: true,
              },
            },
            package: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found with the provided ID" });
      return;
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({ error: "Internal server error occurred while fetching order by ID" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const idValidation = getOrderByIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      res.status(400).json({ errors: idValidation.error.issues });
      return;
    }

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
        items: {
          include: {
            product: { include: { color: true } },
            package: true,
          },
        },
      },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(500).json({ error: "Internal server error occurred while updating order status" });
    }
  }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const validationResult = getOrderByIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.issues });
      return;
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      res.status(404).json({ error: "Order not found, cannot delete" });
      return;
    }

    await prisma.order.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(500).json({ error: "Internal server error occurred while deleting order" });
    }
  }
};

export const getOrdersBySessionId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const validationResult = getOrdersBySessionIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.issues });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              include: {
                color: true,
              },
            },
            package: true,
          },
        },
      },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders by session ID:", error);
    res.status(500).json({ error: "Failed to fetch orders for this session" });
  }
};