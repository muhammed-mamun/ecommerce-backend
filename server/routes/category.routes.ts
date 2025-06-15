import { Router } from "express";
import { createCategory, getCategory, getAllCategories, updateCategory, deleteCategory } from "../controller/category.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.ts";

const router = Router()


router.post("/", authenticate, requireAdmin, createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategory);
router.put("/:id", authenticate, requireAdmin, updateCategory);
router.delete("/:id", authenticate, requireAdmin, deleteCategory);


export default router