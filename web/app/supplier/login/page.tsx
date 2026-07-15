import type { Metadata } from "next";
import Link from "next/link";
import { B2BLoginForm } from "@/components/auth/B2BLoginForm";

export const metadata: Metadata = {
  title: "Supplier Login | DiscountBazaar.PK",
};

export default function SupplierLoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f4c81] p-12 text-white lg:flex">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
        <div className="absolute -bottom-20 right-[-30px] h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-base font-bold text-white">D</span>
            <span className="font-heading text-xl font-bold tracking-tight">
              DiscountBazaar<span className="text-mint">.PK</span>
            </span>
          </Link>
        </div>

        <div className="relative">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Supplier Portal
          </div>
          <h1 className="mt-6 max-w-md font-heading text-4xl font-black leading-[0.95] tracking-tight">
            Supplier <span className="text-mint">Portal.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
            Propose deals, manage manifests, and track payouts — all from a single dashboard built for B2B suppliers.
          </p>
        </div>

        <div className="relative text-xs text-white/40">
          Don&apos;t have an account?{" "}
          <Link href="/supplier/register" className="font-medium text-mint hover:underline">
            Apply here
          </Link>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-offwhite px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <B2BLoginForm
            role="Supplier"
            title="Supplier Portal Sign In"
            subtitle="Use your supplier credentials to access proposals and manifests."
            redirectTo="/supplier"
          />
        </div>
      </div>
    </div>
  );
}
