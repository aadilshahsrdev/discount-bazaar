import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — DiscountBazaar.PK" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: July 2025</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600">
        <section>
          <h2 className="font-semibold text-slate-900">1. Information We Collect</h2>
          <p className="mt-2">
            We collect your phone number, name, and order history to operate the marketplace and
            process transactions through Safepay escrow.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">2. How We Use Your Data</h2>
          <p className="mt-2">
            Your data is used to authenticate your account, display order history, coordinate Squad
            purchases, and facilitate dispute resolution. We never sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">3. Data Storage</h2>
          <p className="mt-2">
            All data is stored securely. Payment authorizations are processed by Safepay under their
            own security and compliance standards.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">4. Your Rights</h2>
          <p className="mt-2">
            You may request deletion of your account and associated data at any time by contacting
            support.
          </p>
        </section>
      </div>
    </div>
  );
}
