import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { type SquadStatus, SquadStatus as SquadStatusEnum } from "../types/enums.js";

/* ------------------------------------------------------------------ */
/* Squad member                                                       */
/* ------------------------------------------------------------------ */

export interface ISquadMember {
  userId: Types.ObjectId;
  joinedAt: Date;
  depositTransactionId: Types.ObjectId; // the 10% hold transaction
  vote?: "Proceed" | "OptOut";
}

const SquadMemberSchema = new Schema<ISquadMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now, required: true },
    depositTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    vote: { type: String, enum: ["Proceed", "OptOut"] },
  },
  { _id: false },
);

/* ------------------------------------------------------------------ */
/* Squad                                                              */
/* ------------------------------------------------------------------ */

export interface ISquad extends Document {
  productId: Types.ObjectId;
  targetMembers: number; // typically 30
  currentMembers: number;
  members: Types.DocumentArray<ISquadMember>;
  expiresAt: Date; // 24-hour lock window
  status: SquadStatus;
  finalDiscountRate?: number; // 0–1, locked at capture
  capturedAt?: Date;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SquadSchema = new Schema<ISquad>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    targetMembers: { type: Number, required: true, min: 1, default: 30 },
    currentMembers: { type: Number, default: 0, min: 0, required: true },
    members: { type: [SquadMemberSchema], default: [] },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(SquadStatusEnum),
      default: SquadStatusEnum.Gathering,
      required: true,
      index: true,
    },
    finalDiscountRate: { type: Number, min: 0, max: 1 },
    capturedAt: { type: Date },
    voidedAt: { type: Date },
  },
  { timestamps: true },
);

// Compound index for the "active squads near expiry" job feed.
SquadSchema.index({ status: 1, expiresAt: 1 });

export const Squad: Model<ISquad> = mongoose.model<ISquad>("Squad", SquadSchema);
export default Squad;
