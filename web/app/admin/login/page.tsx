import type { Metadata } from "next";
import { B2BLoginForm } from "@/components/auth/B2BLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | DiscountBazaar.PK",
};

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-oceanic p-12 text-white lg:flex">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
        <div className="absolute -bottom-20 right-[-30px] h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-base font-bold text-white">D</span>
            <span className="font-heading text-xl font-bold tracking-tight">
              DiscountBazaar<span className="text-mint">.PK</span>
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Admin Portal
          </div>
          <h1 className="mt-6 max-w-md font-heading text-4xl font-black leading-[0.95] tracking-tight">
            Command <span className="text-mint">Center.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
            Manage the live catalog, review supplier onboarding, resolve disputes, and keep the marketplace running smoothly.
          </p>
        </div>

        <div className="relative text-xs text-white/40">
          Restricted access. Authorized personnel only.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-offwhite px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <B2BLoginForm
            role="Admin"
            title="Admin Portal Sign In"
            subtitle="Use your internal admin credentials to access the command center."
            redirectTo="/admin"
          />
        </div>
      </div>
    </div>
  );
}
