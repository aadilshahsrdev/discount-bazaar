import { type Request, type Response } from "express";
import { Types } from "mongoose";
import Dispute from "../models/Dispute.js";
import Order from "../models/Order.js";
import {
  DisputeStatus as DisputeStatusEnum,
  type DisputeIssueType,
  OrderLogisticsStatus as LogisticsEnum,
} from "../types/enums.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ------------------------------------------------------------------ */
/* Step 3.2 — createDispute (Buyer)                                   */
/* ------------------------------------------------------------------ */

interface CreateDisputeBody {
  orderId?: string;
  issueType?: DisputeIssueType;
  description?: string;
  evidenceUrls?: string[];
}

/**
 * POST /api/disputes
 * Protected (Buyer). Opens a dispute on a delivered order. Validates that the
 * order belongs to the authenticated buyer and is in Delivered status before
 * creating the Dispute document.
 */
export const createDispute = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const buyerId = req.user?.userId;
    const { orderId, issueType, description, evidenceUrls } = req.body as CreateDisputeBody;

    if (!buyerId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ error: "A valid orderId is required." });
      return;
    }
    if (!issueType) {
      res.status(400).json({ error: "issueType is required." });
      return;
    }
    if (!description || description.trim().length < 10) {
      res.status(400).json({ error: "description must be at least 10 characters." });
      return;
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    if (order.buyerId.toString() !== buyerId) {
      res.status(403).json({ error: "This order does not belong to you." });
      return;
    }
    if (order.logisticsStatus !== LogisticsEnum.Delivered) {
      res.status(409).json({ error: "A dispute can only be opened on a delivered order." });
      return;
    }

    // One open dispute per order — avoid duplicate tickets.
    const existingOpen = await Dispute.findOne({
      orderId: order._id,
      status: { $in: [DisputeStatusEnum.Open, DisputeStatusEnum.UnderReview] },
    })
      .lean()
      .select("_id");
    if (existingOpen) {
      res.status(409).json({ error: "An open dispute already exists for this order." });
      return;
    }

    const dispute = await Dispute.create({
      orderId: order._id,
      buyerId: order.buyerId,
      supplierId: order.supplierId,
      issueType,
      description: description.trim(),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
      status: DisputeStatusEnum.Open,
    });

    res.status(201).json({
      message: "Dispute opened.",
      data: { disputeId: dispute._id, orderId: order._id, status: dispute.status },
    });
  },
);

/* ------------------------------------------------------------------ */
/* Step 3.3 — getAdminDisputes (Admin)                                */
/* ------------------------------------------------------------------ */

interface GetAdminDisputesQuery {
  status?: string;
  page?: string;
  limit?: string;
}

/**
 * GET /api/disputes
 * Protected (Admin). Returns a paginated list of open/under-review dispute
 * tickets for the admin command center, optionally filtered by status.
 */
export const getAdminDisputes = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { status, page, limit } = req.query as GetAdminDisputesQuery;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Default to open tickets only unless the admin requests otherwise.
    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: [DisputeStatusEnum.Open, DisputeStatusEnum.UnderReview] };
    }

    const [items, total] = await Promise.all([
      Dispute.find(filter)
        .populate({ path: "orderId", select: "purchaseType totals logisticsStatus" })
        .populate({ path: "buyerId", select: "phoneNumber fullName" })
        .populate({ path: "supplierId", select: "phoneNumber fullName" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Dispute.countDocuments(filter),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  },
);
