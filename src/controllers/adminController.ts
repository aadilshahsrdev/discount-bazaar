import { type Request, type Response } from "express";
import { Types } from "mongoose";
import Squad from "../models/Squad.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
  EscrowState as EscrowStateEnum,
  SquadStatus as SquadStatusEnum,
  UserRole as UserRoleEnum,
} from "../types/enums.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { captureFunds } from "../utils/safepay.js";

/* ================================================================== */
/* Squad Operations                                                   */
/* ================================================================== */

/**
 * GET /api/admin/squads
 * Admin-only. Returns all squads (all statuses) with product details
 * populated, newest first.
 */
export const adminListSquads = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const squads = await Squad.find({})
      .populate({ path: "productId", select: "title slug images category pricing" })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ data: squads });
  },
);

/**
 * GET /api/admin/squads/:id
 * Admin-only. Returns a single squad with members populated with buyer
 * details (name, phone, shippingAddress) for the dispatch manifest.
 */
export const adminGetSquad = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "A valid squad id is required." });
      return;
    }

    const squad = await Squad.findById(id)
      .populate({ path: "productId", select: "title slug images category pricing" })
      .lean();

    if (!squad) {
      res.status(404).json({ error: "Squad not found." });
      return;
    }

    // Hydrate member details from User collection
    const memberUserIds = squad.members.map((m) => m.userId);
    const users = await User.find({ _id: { $in: memberUserIds } })
      .select("name phoneNumber shippingAddress email")
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const membersWithDetails = squad.members.map((m) => {
      const u = userMap.get(m.userId.toString());
      return {
        userId: m.userId,
        joinedAt: m.joinedAt,
        vote: m.vote,
        name: u?.name ?? "Unknown",
        phoneNumber: u?.phoneNumber ?? "",
        email: u?.email ?? "",
        shippingAddress: u?.shippingAddress ?? null,
      };
    });

    res.status(200).json({ data: { ...squad, members: membersWithDetails } });
  },
);

/**
 * POST /api/admin/squads/:id/dispatch
 * Admin-only. Dispatches a Filled/Captured squad to the dropship network.
 * Flips status to Dispatched and captures all member escrow holds.
 * Returns a mocked bulk manifest of shipping addresses.
 */
export const adminDispatchSquad = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "A valid squad id is required." });
      return;
    }

    const squad = await Squad.findById(id);
    if (!squad) {
      res.status(404).json({ error: "Squad not found." });
      return;
    }

    if (squad.status !== SquadStatusEnum.Captured && squad.status !== SquadStatusEnum.Gathering) {
      res.status(409).json({ error: `Squad is in ${squad.status} state and cannot be dispatched.` });
      return;
    }

    if (squad.currentMembers < squad.targetMembers) {
      res.status(409).json({ error: "Squad has not reached its member target yet." });
      return;
    }

    // Capture escrow holds for all members
    const memberUserIds = squad.members.map((m) => m.userId);
    const transactions = await Transaction.find({
      squadId: squad._id,
      buyerId: { $in: memberUserIds },
      escrowState: EscrowStateEnum.Authorized,
    });

    for (const txn of transactions) {
      try {
        await captureFunds(txn.safepayTrackerId, txn.holdAmount);
        txn.escrowState = EscrowStateEnum.Captured;
        txn.capturedAt = new Date();
        await txn.save();
      } catch (err) {
        console.error(`[admin] capture failed for txn ${txn._id}:`, err);
      }
    }

    // Build the dropshipper manifest
    const users = await User.find({ _id: { $in: memberUserIds } })
      .select("name phoneNumber shippingAddress")
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const manifest = squad.members.map((m, idx) => {
      const u = userMap.get(m.userId.toString());
      const a = u?.shippingAddress;
      return {
        manifestIndex: idx + 1,
        buyerName: a?.fullName ?? u?.name ?? "Unknown",
        phoneNumber: a?.phoneNumber ?? u?.phoneNumber ?? "",
        province: a?.province ?? "",
        city: a?.city ?? "",
        area: a?.area ?? "",
        streetAddress: a?.streetAddress ?? "",
        landmark: a?.landmark ?? "",
        network: "HHC/YourMart",
        squadId: squad._id,
        productId: squad.productId,
      };
    });

    squad.status = SquadStatusEnum.Dispatched;
    await squad.save();

    res.status(200).json({
      message: "Squad dispatched to dropship network.",
      data: {
        squadId: squad._id,
        status: squad.status,
        membersDispatched: manifest.length,
        manifest,
      },
    });
  },
);

/**
 * POST /api/admin/squads/create
 * Admin-only. Admin adds any active product to a new squad with a
 * dynamically set expiry window (24h, 48h, 7d, etc.). The squad goes
 * live immediately and appears on the offers page.
 */
interface CreateSquadBody {
  productId?: string;
  targetMembers?: number;
  expiryHours?: number;
}

export const adminCreateSquad = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { productId, targetMembers, expiryHours } = req.body as CreateSquadBody;

    if (!productId || !Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: "A valid productId is required." });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    if (!product.isActive || product.approvalStatus !== "Approved") {
      res.status(409).json({ error: "Product must be active and approved to start a squad." });
      return;
    }

    const members = Math.max(1, Number(targetMembers) || product.maxSquadMembers || 30);
    const hours = Math.max(1, Number(expiryHours) || 24);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Prevent duplicate active squads for the same product
    const existing = await Squad.findOne({
      productId: product._id,
      status: SquadStatusEnum.Gathering,
    });
    if (existing) {
      res.status(409).json({ error: "An active (Gathering) squad already exists for this product." });
      return;
    }

    const squad = await Squad.create({
      productId: product._id,
      targetMembers: members,
      currentMembers: 0,
      members: [],
      expiresAt,
      status: SquadStatusEnum.Gathering,
    });

    res.status(201).json({
      message: "Squad created and is now live on the offers page.",
      data: {
        _id: squad._id,
        productId: squad.productId,
        targetMembers: squad.targetMembers,
        expiresAt: squad.expiresAt,
        status: squad.status,
      },
    });
  },
);

/* ================================================================== */
/* Financial Ledger                                                   */
/* ================================================================== */

/**
 * GET /api/admin/finance/overview
 * Admin-only. Returns top-level financial metric cards:
 *   - Total Escrow Holding (Authorized, not yet captured)
 *   - Pending Supplier Payouts (Captured, not yet paid out)
 *   - Total Platform Revenue (commission retained = 10% of captured)
 */
export const adminFinanceOverview = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const [escrowHoldAgg, pendingPayoutAgg, capturedAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { escrowState: EscrowStateEnum.Authorized } },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
      Transaction.aggregate([
        { $match: { escrowState: EscrowStateEnum.Captured } },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
      Transaction.aggregate([
        { $match: { escrowState: EscrowStateEnum.Captured } },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
    ]);

    const totalEscrowHolding = escrowHoldAgg[0]?.total ?? 0;
    const pendingSupplierPayouts = (pendingPayoutAgg[0]?.total ?? 0) * 0.9;
    const totalPlatformRevenue = (capturedAgg[0]?.total ?? 0) * 0.1;

    res.status(200).json({
      data: {
        totalEscrowHolding: Math.round(totalEscrowHolding),
        pendingSupplierPayouts: Math.round(pendingSupplierPayouts),
        totalPlatformRevenue: Math.round(totalPlatformRevenue),
      },
    });
  },
);

/**
 * GET /api/admin/finance/ledger
 * Admin-only. Returns a transaction history ledger mapping every
 * financial event, color-coded by type.
 */
export const adminFinanceLedger = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const transactions = await Transaction.find({})
      .populate({ path: "squadId", select: "_id" })
      .populate({ path: "productId", select: "title" })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const ledger = transactions.map((txn) => {
      let type: string;
      let colorClass: string;
      switch (txn.escrowState) {
        case EscrowStateEnum.Authorized:
          type = "Escrow Hold";
          colorClass = "gray";
          break;
        case EscrowStateEnum.Captured:
          type = "Escrow Capture";
          colorClass = "green";
          break;
        case EscrowStateEnum.Voided:
          type = "Escrow Void/Refund";
          colorClass = "red";
          break;
        default:
          type = txn.escrowState;
          colorClass = "gray";
      }

      return {
        date: txn.createdAt,
        transactionId: txn.safepayTrackerId,
        squadId: txn.squadId?._id ?? null,
        productName: (txn.productId as unknown as { title?: string })?.title ?? "—",
        type,
        colorClass,
        amount: txn.holdAmount,
        commission: Math.round(txn.holdAmount * 0.1 * 100) / 100,
      };
    });

    res.status(200).json({ data: ledger });
  },
);

/* ================================================================== */
/* Customer Directory                                                 */
/* ================================================================== */

/**
 * GET /api/admin/customers
 * Admin-only. Returns all buyers with active pledge count and lifetime
 * spend via aggregation.
 */
export const adminListCustomers = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const buyers = await User.find({ role: UserRoleEnum.Buyer })
      .select("name email phoneNumber shippingAddress isSuspended createdAt")
      .lean();

    const buyerIds = buyers.map((b) => b._id);

    // Aggregate active pledges (Authorized transactions) and lifetime spend
    const [pledgeAgg, spendAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { buyerId: { $in: buyerIds }, escrowState: EscrowStateEnum.Authorized } },
        { $group: { _id: "$buyerId", activePledges: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { buyerId: { $in: buyerIds } } },
        { $group: { _id: "$buyerId", lifetimeSpend: { $sum: "$holdAmount" } } },
      ]),
    ]);

    const pledgeMap = new Map(pledgeAgg.map((p) => [p._id.toString(), p.activePledges]));
    const spendMap = new Map(spendAgg.map((s) => [s._id.toString(), s.lifetimeSpend]));

    const customers = buyers.map((b) => ({
      _id: b._id,
      name: b.name,
      email: b.email ?? "",
      phoneNumber: b.phoneNumber,
      activePledges: pledgeMap.get(b._id.toString()) ?? 0,
      lifetimeSpend: Math.round(spendMap.get(b._id.toString()) ?? 0),
      accountStatus: b.isSuspended ? "Suspended" : "Active",
      isSuspended: b.isSuspended ?? false,
      shippingAddress: b.shippingAddress ?? null,
      createdAt: b.createdAt,
    }));

    res.status(200).json({ data: customers });
  },
);

/**
 * GET /api/admin/customers/:id
 * Admin-only. Returns a single buyer's profile — saved addresses and
 * exact order/transaction history.
 */
export const adminGetCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "A valid customer id is required." });
      return;
    }

    const user = await User.findById(id)
      .select("name email phoneNumber shippingAddress isSuspended role createdAt")
      .lean();

    if (!user) {
      res.status(404).json({ error: "Customer not found." });
      return;
    }

    const orders = await Transaction.find({ buyerId: user._id })
      .populate({ path: "productId", select: "title" })
      .populate({ path: "squadId", select: "_id" })
      .sort({ createdAt: -1 })
      .lean();

    const orderHistory = orders.map((o) => ({
      _id: o._id,
      date: o.createdAt,
      productName: (o.productId as unknown as { title?: string })?.title ?? "—",
      squadId: o.squadId?._id ?? null,
      amount: o.holdAmount,
      escrowState: o.escrowState,
    }));

    res.status(200).json({
      data: {
        ...user,
        orderHistory,
      },
    });
  },
);

/**
 * PUT /api/admin/customers/:id/suspend
 * Admin-only. Toggles a buyer's suspended status to block/prevent login.
 */
export const adminToggleSuspendCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "A valid customer id is required." });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    if (user.role !== UserRoleEnum.Buyer) {
      res.status(403).json({ error: "Suspension only applies to buyer accounts." });
      return;
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
      message: user.isSuspended ? "Buyer suspended." : "Buyer reinstated.",
      data: { _id: user._id, isSuspended: user.isSuspended },
    });
  },
);
