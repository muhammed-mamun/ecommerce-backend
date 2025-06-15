import { Router } from "express";

import AuthRoutes from "./auth.routes.ts"
import ColorRoutes from "./color.routes.ts"
import ProductRoutes from "./product.routes.ts"
import CategoryRoutes from "./category.routes.ts" 
import PackageRoutes from "./package.routes.ts"
import CartRoutes from "./cart.routes.ts"
import OrderRoutes from "./order.routes.ts"
const router = Router()

router.use("/api/admin", AuthRoutes)
router.use("/api/color", ColorRoutes)
router.use("/api/category", CategoryRoutes)
router.use("/api/product", ProductRoutes)
router.use("/api/package", PackageRoutes)
router.use("/api/cart", CartRoutes)
router.use("/api/order", OrderRoutes)

export default router