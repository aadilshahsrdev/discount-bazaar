import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support — DiscountBazaar.PK" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Support</h1>
      <p className="mt-4 text-slate-600">
        We&apos;re here to help. If you have questions about an order, a Squad pledge, or a refund,
        reach out and our team will assist you.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">WhatsApp Support</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chat with us directly on WhatsApp for the fastest response.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Order Issues</h2>
          <p className="mt-1 text-sm text-slate-500">
            View your order history and dispute status from your dashboard.
          </p>
          <Link href="/dashboard" className="mt-2 inline-block text-sm font-medium text-oceanic hover:underline">
            Go to Dashboard →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Squad Questions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Learn how Squads work, including the 24-hour hold, voting, and capture process.
          </p>
        </div>
      </div>
    </div>
  );
}
