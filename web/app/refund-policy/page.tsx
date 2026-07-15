import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy — DiscountBazaar.PK" };

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Refund Policy</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: July 2025</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600">
        <section>
          <h2 className="font-semibold text-slate-900">Squad Deposits</h2>
          <p className="mt-2">
            When you join a Squad, a 10% deposit is authorized (not charged) through Safepay. If the
            Squad does not reach its target within 24 hours, you enter a voting phase where you may
            opt out to instantly release your hold. No refund is needed — the funds were never captured.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">Order Disputes</h2>
          <p className="mt-2">
            If you receive a damaged or incorrect item, you may open a dispute from your dashboard
            after delivery. Our team reviews each dispute and may issue a full or partial refund.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">Cash on Delivery</h2>
          <p className="mt-2">
            The remaining balance is paid as cash on delivery (COD). If you refuse the package at
            delivery, the order is marked as returned and your deposit is refunded within 5–7
            business days.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">Need Help?</h2>
          <p className="mt-2">
            For any refund-related questions, please contact our support team.
          </p>
          <Link href="/support" className="mt-2 inline-block font-medium text-oceanic hover:underline">
            Go to Support →
          </Link>
        </section>
      </div>
    </div>
  );
}
