import { Router } from "express";
import {
  createStandardOrder,
  getBuyerOrders,
  getSupplierManifests,
} from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Protected — buyer creates a standard "Buy Now" order.
router.post("/", requireAuth, createStandardOrder);

// Protected — buyer's order history.
router.get("/me", requireAuth, getBuyerOrders);

// Protected (Supplier) — pending-dispatch manifest for the supplier's products.
router.get("/manifest", requireAuth, requireRole("Supplier"), getSupplierManifests);

export default router;
