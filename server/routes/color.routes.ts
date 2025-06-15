import { Router } from "express";
import {
  createColor,
  getColor,
  getColors,
  updateColor,
  deleteColor,
} from "../controller/color.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/", authenticate, requireAdmin, createColor);
router.get("/", getColors);
router.get("/:id", getColor);
router.put("/:id", authenticate, requireAdmin, updateColor);
router.delete("/:id", authenticate, requireAdmin, deleteColor);

export default router;
