import { Router } from "express";
import { loginB2B, registerSupplierApplication, sendOtp, verifyOtp } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/whatsapp/send  — request an OTP
router.post("/whatsapp/send", sendOtp);

// POST /api/auth/whatsapp/verify — verify OTP and receive JWT
router.post("/whatsapp/verify", verifyOtp);

// POST /api/auth/b2b/login — admin/supplier login
router.post("/b2b/login", loginB2B);

// POST /api/auth/supplier/register — public supplier application form
router.post("/supplier/register", registerSupplierApplication);

export default router;
