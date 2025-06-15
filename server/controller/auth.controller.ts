// AuthController.ts
import prisma from "../DB/db.config.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  try {
    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ message: "JWT secret is not defined" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use HTTPS in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 * 30 // 7 days
      });

    res.json({ 
      accessToken: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};