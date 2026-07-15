import { Router } from "express";
import { getSupplierApplications, getSuppliers, resolveSupplierApplication } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Admin-only — pick a supplier to attribute a direct listing to.
router.get("/suppliers", requireAuth, requireRole("Admin"), getSuppliers);

// Admin-only — review supplier applications.
router.get("/supplier-applications", requireAuth, requireRole("Admin"), getSupplierApplications);
router.patch("/supplier-applications/:id/decision", requireAuth, requireRole("Admin"), resolveSupplierApplication);

export default router;
