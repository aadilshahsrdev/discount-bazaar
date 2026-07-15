import User from "../models/User.js";
import { UserRole as UserRoleEnum } from "../types/enums.js";
import { hashPassword } from "./auth.js";

async function upsertAccount(params: {
  phoneNumber: string;
  email: string;
  role: UserRoleEnum;
  name: string;
  password: string;
  verificationStatus: "Pending" | "Approved" | "Rejected";
  supplierDetails?: {
    companyName: string;
    contactPerson: string;
    rating: number;
    isActive: boolean;
    catalogs: never[];
  };
}): Promise<void> {
  const { salt, hash } = await hashPassword(params.password);
  await User.updateOne(
    { phoneNumber: params.phoneNumber },
    {
      $set: {
        email: params.email,
        role: params.role,
        name: params.name,
        verificationStatus: params.verificationStatus,
        passwordHash: hash,
        passwordSalt: salt,
        ...(params.supplierDetails ? { supplierDetails: params.supplierDetails } : {}),
      },
      $setOnInsert: { phoneNumber: params.phoneNumber },
    },
    { upsert: true },
  );
}

export async function ensureDemoAccounts(): Promise<void> {
  await upsertAccount({
    phoneNumber: "+923000000001",
    email: "admin@discountbazaar.pk",
    role: UserRoleEnum.Admin,
    name: "DiscountBazaar Admin",
    password: "Admin@12345",
    verificationStatus: "Approved",
  });

  await upsertAccount({
    phoneNumber: "+923000000002",
    email: "supplier@discountbazaar.pk",
    role: UserRoleEnum.Supplier,
    name: "HHC Wholesale Supplier",
    password: "Supplier@12345",
    verificationStatus: "Approved",
    supplierDetails: {
      companyName: "HHC Distribution Co.",
      contactPerson: "Ahmed Raza",
      rating: 4.6,
      isActive: true,
      catalogs: [],
    },
  });
}