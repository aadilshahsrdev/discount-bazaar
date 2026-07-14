import { Router } from "express";
import { createDispute, getAdminDisputes } from "../controllers/disputeController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Protected (Buyer) — open a dispute on a delivered order.
router.post("/", requireAuth, createDispute);

// Protected (Admin) — view open dispute tickets.
router.get("/", requireAuth, requireRole("Admin"), getAdminDisputes);

export default router;
