import { Router } from "express";
import {
  adminForceCapture,
  adminForceVoid,
  initiateCheckout,
  safepayWebhook,
  simulateAuthorization,
} from "../controllers/escrowController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Public webhook — Safepay calls this, no JWT. Signature verified.
router.post("/webhook", safepayWebhook);

// Protected — buyer initiates a 10% deposit checkout.
router.post("/checkout", requireAuth, initiateCheckout);

// Protected — frontend simulates the Safepay authorization webhook for
// development/testing. No signature check (caller is our own frontend).
router.post("/simulate", requireAuth, simulateAuthorization);

// Admin-only escrow overrides.
router.post("/admin/:id/capture", requireAuth, requireRole("Admin"), adminForceCapture);
router.post("/admin/:id/void", requireAuth, requireRole("Admin"), adminForceVoid);

export default router;
