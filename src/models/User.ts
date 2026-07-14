import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { type UserRole, UserRole as UserRoleEnum } from "../types/enums.js";

/* ------------------------------------------------------------------ */
/* Embedded supplier details                                          */
/* ------------------------------------------------------------------ */

export interface ISupplierDetails {
  companyName: string;
  ntn?: string; // National Tax Number (Pakistan)
  contactPerson: string;
  bankAccountTitle?: string;
  bankIban?: string;
  rating: number; // 0–5, maintained by admin QC
  isActive: boolean;
  catalogs: Types.Array<Types.ObjectId>; // product refs the supplier owns
}

const SupplierDetailsSchema = new Schema<ISupplierDetails>(
  {
    companyName: { type: String, required: true, trim: true },
    ntn: { type: String, trim: true, uppercase: true },
    contactPerson: { type: String, required: true, trim: true },
    bankAccountTitle: { type: String, trim: true },
    bankIban: { type: String, trim: true, uppercase: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
    catalogs: { type: [Schema.Types.ObjectId], default: [] },
  },
  { _id: false, timestamps: false },
);

/* ------------------------------------------------------------------ */
/* User                                                               */
/* ------------------------------------------------------------------ */

export interface IUser extends Document {
  phoneNumber: string; // E.164, unique
  role: UserRole;
  name: string;
  whatsappOtp?: string;
  otpExpiresAt?: Date;
  supplierDetails?: ISupplierDetails;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRoleEnum),
      default: UserRoleEnum.Buyer,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    // Transient — never returned to clients.
    whatsappOtp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    supplierDetails: {
      type: SupplierDetailsSchema,
      required: function (this: IUser): boolean {
        return this.role === UserRoleEnum.Supplier;
      },
    },
  },
  { timestamps: true },
);

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
