import { Router } from "express";
import {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from "../controller/product.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/", authenticate, requireAdmin, createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);
router.get("/category/:categoryId", getProductsByCategory)

export default router;
