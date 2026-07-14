import { type IOrderTotals } from "../models/Order.js";

/**
 * Rounds to 2 decimal places (paisa precision) to avoid float drift across
 * Mongoose, Safepay, and courier COD manifests.
 */
export function roundPKR(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface ComputeOrderFinanceInput {
  unitPrice: number; // PKR, the locked price the buyer pays per unit
  quantity: number;
  discountRate: number; // 0–1 fraction (squad) or 0 (standard)
  shipping: number; // PKR
  platformFee: number; // PKR
  /** The 10% Safepay pre-auth hold that will be captured as the deposit. */
  depositPaid: number;
}

/**
 * Computes a locked financial snapshot for an order.
 *
 * Discount mechanics: the discount is applied to the per-unit price, so
 * `discountAmount = unitPrice * discountRate * quantity`. The discounted
 * subtotal minus shipping and platform fee is the supplier payout — the
 * supplier never receives money that wasn't authorized through Safepay.
 *
 * Zero-wallet split (SBP-compliant): the order total is partitioned into
 * `depositPaid` (the Safepay-captured 10% hold) and `codAmountDue` (the
 * balance the courier collects in cash on delivery). The invariant
 * `depositPaid + codAmountDue === total` is asserted before returning.
 */
export function computeOrderFinance(input: ComputeOrderFinanceInput): IOrderTotals {
  const { unitPrice, quantity, discountRate, shipping, platformFee, depositPaid } = input;

  if (quantity < 1) {
    throw new Error("quantity must be at least 1.");
  }
  if (discountRate < 0 || discountRate > 1) {
    throw new Error("discountRate must be between 0 and 1.");
  }

  const gross = roundPKR(unitPrice * quantity);
  const discountAmount = roundPKR(gross * discountRate);
  const subtotal = roundPKR(gross - discountAmount);
  const total = roundPKR(subtotal + shipping + platformFee);
  const supplierPayout = roundPKR(subtotal - platformFee);

  // The deposit captured from Safepay cannot exceed the order total.
  const cappedDeposit = roundPKR(Math.min(depositPaid, total));
  const codAmountDue = roundPKR(total - cappedDeposit);

  const totals: IOrderTotals = {
    unitPrice: roundPKR(unitPrice),
    quantity,
    discountRate,
    discountAmount,
    subtotal,
    shipping: roundPKR(shipping),
    platformFee: roundPKR(platformFee),
    supplierPayout,
    total,
    depositPaid: cappedDeposit,
    codAmountDue,
  };

  assertZeroWalletInvariant(totals);
  return totals;
}

/**
 * Enforces the SBP zero-wallet invariant: the Safepay-captured deposit plus
 * the courier-collected COD balance must equal the order total exactly.
 * Throws if float drift or a bad input breaks the equality.
 */
export function assertZeroWalletInvariant(totals: IOrderTotals): void {
  const sum = roundPKR(totals.depositPaid + totals.codAmountDue);
  if (sum !== totals.total) {
    throw new Error(
      `Zero-wallet invariant violated: depositPaid (${totals.depositPaid}) + codAmountDue (${totals.codAmountDue}) = ${sum} !== total (${totals.total}).`,
    );
  }
}
