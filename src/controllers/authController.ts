import { type Request, type Response } from "express";
import User from "../models/User.js";
import { UserRole as UserRoleEnum } from "../types/enums.js";
import { generateOtp, hashPassword, signToken, verifyPassword } from "../utils/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

interface SendOtpBody {
  phoneNumber?: string;
}

interface VerifyOtpBody {
  phoneNumber?: string;
  otp?: string;
  name?: string;
}

interface B2BLoginBody {
  identifier?: string;
  password?: string;
  role?: "Admin" | "Supplier";
}

interface SupplierRegisterBody {
  businessName?: string;
  dropshipNetworkId?: string;
  contactNumber?: string;
  cnicNtn?: string;
  email?: string;
}

/**
 * POST /api/auth/whatsapp/send
 * Generates a WhatsApp OTP, persists it (hashed-by-select) on the prospective
 * user record, and mocks the SMS-gateway send by logging to the console.
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber } = req.body as SendOtpBody;
  if (!phoneNumber || !/^\+?\d{10,15}$/.test(phoneNumber)) {
    res.status(400).json({ error: "A valid phoneNumber is required." });
    return;
  }

  const existing = await User.findOne({ phoneNumber }).lean();
  if (existing && existing.role !== UserRoleEnum.Buyer) {
    res.status(403).json({ error: "WhatsApp login is reserved for buyers. Use the B2B login pages." });
    return;
  }

  const { code, expiresAt } = generateOtp();

  // Upsert a lightweight record purely to carry the OTP between send and verify.
  await User.updateOne(
    { phoneNumber },
    { $set: { whatsappOtp: code, otpExpiresAt: expiresAt } },
    { upsert: true },
  );

  // Mock SMS gateway — replace with real WhatsApp API when available.
  console.info(`[otp] -> ${phoneNumber}: ${code} (expires ${expiresAt.toISOString()})`);

  // In development, return the code so the frontend can display it for testing.
  const isDev = process.env.NODE_ENV !== "production";
  res.status(200).json({
    message: "OTP sent via WhatsApp.",
    ...(isDev ? { devOtp: code } : {}),
  });
});

/**
 * POST /api/auth/whatsapp/verify
 * Validates the OTP. If the user doesn't exist yet (first verification),
 * creates one with the default Buyer role. Returns a signed JWT.
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber, otp, name } = req.body as VerifyOtpBody;
  if (!phoneNumber || !otp) {
    res.status(400).json({ error: "phoneNumber and otp are required." });
    return;
  }

  const user = await User.findOne({ phoneNumber }).select("+whatsappOtp +otpExpiresAt");
  if (!user || !user.whatsappOtp || !user.otpExpiresAt) {
    res.status(400).json({ error: "No active OTP for this phone number. Request a new one." });
    return;
  }
  if (user.role !== UserRoleEnum.Buyer) {
    res.status(403).json({ error: "WhatsApp login is reserved for buyers. Use the B2B login pages." });
    return;
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "OTP expired. Request a new one." });
    return;
  }
  if (user.whatsappOtp !== otp) {
    res.status(400).json({ error: "Invalid OTP." });
    return;
  }

  // First-time verification → materialise the Buyer account if not yet set up.
  if (!user.name) {
    user.name = name?.trim() || "New Buyer";
    user.role = user.role || UserRoleEnum.Buyer;
  }

  // Clear the OTP fields so they can't be replayed.
  user.whatsappOtp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
  });

  res.status(200).json({
    message: "Authentication successful.",
    token,
    user: {
      id: user._id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
    },
  });
});

export const loginB2B = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { identifier, password, role } = req.body as B2BLoginBody;
  if (!identifier || !password || !role) {
    res.status(400).json({ error: "identifier, password, and role are required." });
    return;
  }

  console.info(`[auth] B2B login attempt role=${role} identifier=${identifier.trim()}`);

  if (role !== UserRoleEnum.Admin && role !== UserRoleEnum.Supplier) {
    res.status(400).json({ error: "role must be Admin or Supplier." });
    return;
  }

  const normalized = identifier.trim().toLowerCase();
  const lookup = normalized.includes("@") ? { email: normalized } : { phoneNumber: identifier.trim() };

  const user = await User.findOne({ ...lookup, role }).select(
    "+passwordHash +passwordSalt",
  );
  if (!user || !user.passwordHash || !user.passwordSalt) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }
  const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.status(200).json({
    message: "Authentication successful.",
    token,
    user: {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
  });
});

export const registerSupplierApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { businessName, dropshipNetworkId, contactNumber, cnicNtn, email } = req.body as SupplierRegisterBody;
  if (!businessName || !dropshipNetworkId || !contactNumber || !cnicNtn) {
    res.status(400).json({ error: "businessName, dropshipNetworkId, contactNumber, and cnicNtn are required." });
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "email must be a valid email address." });
    return;
  }
  if (!/^\+?\d{10,15}$/.test(contactNumber)) {
    res.status(400).json({ error: "contactNumber must be a valid phone number." });
    return;
  }

  const exists = await User.findOne({ $or: [{ phoneNumber: contactNumber }, { dropshipNetworkId }] }).lean();
  if (exists) {
    res.status(409).json({ error: "A supplier application already exists for this contact or network ID." });
    return;
  }

  const passwordSeed = `${businessName.trim()}-${contactNumber.trim()}-${Date.now()}`;
  const { salt, hash } = await hashPassword(passwordSeed);

  const user = await User.create({
    phoneNumber: contactNumber.trim(),
    email: email?.trim() || undefined,
    role: UserRoleEnum.Supplier,
    name: businessName.trim(),
    businessName: businessName.trim(),
    dropshipNetworkId: dropshipNetworkId.trim(),
    contactNumber: contactNumber.trim(),
    cnicNtn: cnicNtn.trim(),
    verificationStatus: "Pending",
    passwordHash: hash,
    passwordSalt: salt,
    supplierDetails: {
      companyName: businessName.trim(),
      contactPerson: businessName.trim(),
      rating: 0,
      isActive: false,
      catalogs: [],
    },
  });

  res.status(201).json({
    message: "Supplier application submitted. An admin will review it shortly.",
    data: {
      userId: user._id.toString(),
      verificationStatus: user.verificationStatus,
    },
  });
});
