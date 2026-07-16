"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { createStandardOrder, initiateEscrowCheckout, simulateEscrowAuthorization } from "@/lib/api";
import { formatPKR, squadCurrentPrice } from "@/lib/format";
import type { Product, Squad } from "@/lib/types";
import { BuyerOtpModal } from "@/components/auth/BuyerOtpModal";

export function DualCheckout({ product, activeSquad }: { product: Product; activeSquad: Squad | null }) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<"buy" | "squad" | null>(null);
  const [isProcessing, setProcessing] = useState(false);
  const [buyerModalOpen, setBuyerModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { marketAnchorPrice, maxSquadDiscount } = product.pricing;
  const targetMembers = activeSquad?.targetMembers ?? product.maxSquadMembers;
  const currentMembers = activeSquad?.currentMembers ?? 0;
  const squadPrice = squadCurrentPrice(marketAnchorPrice, maxSquadDiscount, currentMembers, targetMembers);
  const lowestSquadPrice = marketAnchorPrice * (1 - maxSquadDiscount);
  const depositPercentage = product.deposit_percentage ?? 10;
  const deposit = Math.round(marketAnchorPrice * (depositPercentage / 100));
  const remaining = Math.max(0, Math.round(squadPrice - deposit));
  const progress = Math.min(100, Math.round((currentMembers / targetMembers) * 100));

  async function runBuyNow(activeToken?: string) {
    const resolvedToken = activeToken ?? token;
    if (!resolvedToken) {
      setPendingAction("buy");
      setBuyerModalOpen(true);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      await createStandardOrder({ productId: product._id, token: resolvedToken });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the Buy Now checkout.");
      setProcessing(false);
    }
  }

  async function runJoinSquad(activeToken?: string, buyerId?: string) {
    const resolvedToken = activeToken ?? token;
    if (!resolvedToken) {
      setPendingAction("squad");
      setBuyerModalOpen(true);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      const checkout = await initiateEscrowCheckout(product._id, activeSquad?._id, resolvedToken);
      await simulateEscrowAuthorization({
        trackerId: checkout.trackerId,
        amount: checkout.holdAmount,
        productId: checkout.productId,
        squadId: checkout.squadId,
        buyerId: buyerId ?? user?.id ?? "",
        token: resolvedToken,
      });
      router.push("/dashboard?success=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the Squad checkout.");
      setProcessing(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {/* Card 1 — Buy Now */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Buy Solo</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            Buy Now — {formatPKR(product.pricing.currentRetailPrice)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Ships immediately at standard retail price.</p>
        </div>
        <button
          onClick={() => void runBuyNow()}
          disabled={isProcessing}
          className="mt-4 w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-60"
        >
          {isProcessing && pendingAction === "buy" ? "Starting checkout…" : "Buy Now"}
        </button>
      </div>

      {/* Card 2 — Join Squad */}
      <div className="flex flex-col justify-between rounded-2xl border-2 border-oceanic bg-oceanic/5 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-oceanic">Buy as a Squad</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-oceanic-dark">{formatPKR(lowestSquadPrice)}</p>
            <span className="text-sm text-slate-400 line-through">{formatPKR(marketAnchorPrice)}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-mint-dark">
            Get up to {Math.round(maxSquadDiscount * 100)}% off — as low as {formatPKR(lowestSquadPrice)}
          </p>

          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-mint" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-oceanic-dark/80">
              {activeSquad ? `${currentMembers}/${targetMembers} joined` : "Be the first to start this Squad"}
            </p>
          </div>

          <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">Secure 24-Hour Hold</p>
            <p className="mt-1">
              {formatPKR(deposit)} today · {formatPKR(remaining)} on delivery
            </p>
          </div>

          <p className="mt-3 rounded-xl border border-oceanic/20 bg-white px-4 py-3 text-xs font-medium text-slate-700">
            Joining this Squad requires a quick WhatsApp verification and a secure {depositPercentage}% upfront deposit to lock in your wholesale price.
          </p>
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <button
          onClick={() => void runJoinSquad()}
          disabled={isProcessing}
          className="mt-4 w-full rounded-full bg-oceanic px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-oceanic-dark disabled:opacity-60"
        >
          {isProcessing && pendingAction === "squad" ? "Starting your hold…" : "Join this Squad"}
        </button>
      </div>

      <BuyerOtpModal
        open={buyerModalOpen}
        title="Buyer verification"
        description="Confirm your WhatsApp number to continue with checkout."
        onClose={() => {
          setBuyerModalOpen(false);
          setPendingAction(null);
        }}
        onVerified={({ token: authToken, user: authUser }) => {
          setBuyerModalOpen(false);
          if (pendingAction === "buy") {
            void runBuyNow(authToken);
          }
          if (pendingAction === "squad") {
            void runJoinSquad(authToken, authUser.id);
          }
          setPendingAction(null);
        }}
      />
    </div>
  );
}
