import { Router } from "express";
import {
  createPackage,
  updatePackage,
  deletePackage,
  getPackages,
  getPackageById,
} from "../controller/package.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post("/",authenticate, requireAdmin, createPackage); // Admin creates a package
router.get("/", getPackages); // View all packages
router.get("/:id", getPackageById); // View a single package
router.put("/:id",authenticate, requireAdmin, updatePackage); // Admin updates a package
router.delete("/:id",authenticate, requireAdmin, deletePackage); // Admin deletes a package

export default router;
