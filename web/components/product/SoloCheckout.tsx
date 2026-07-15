"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createStandardOrder } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { BuyerOtpModal } from "@/components/auth/BuyerOtpModal";

export function SoloCheckout({ product }: { product: Product }) {
  const { token } = useAuth();
  const router = useRouter();
  const [isProcessing, setProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(nextToken?: string) {
    const activeToken = nextToken ?? token;
    if (!activeToken) {
      setOpen(true);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      await createStandardOrder({ productId: product._id, token: activeToken });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Buy Solo</p>
      <p className="mt-1 text-xl font-bold text-slate-900">Buy Now — {formatPKR(product.pricing.currentRetailPrice)}</p>
      <p className="mt-2 text-sm text-slate-500">Buy immediately with a quick WhatsApp buyer verification.</p>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <button
        onClick={() => void startCheckout()}
        disabled={isProcessing}
        className="mt-4 w-full rounded-full bg-oceanic px-6 py-3 text-sm font-semibold text-white transition hover:bg-oceanic-dark disabled:opacity-60"
      >
        {isProcessing ? "Starting checkout…" : "Buy Now"}
      </button>

      <BuyerOtpModal
        open={open}
        title="Buyer verification"
        description="Confirm your WhatsApp number to continue your purchase."
        onClose={() => {
          setOpen(false);
        }}
        onVerified={({ token: authToken }) => {
          setOpen(false);
          void startCheckout(authToken);
        }}
      />
    </div>
  );
}
