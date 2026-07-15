import type { Metadata } from "next";
import { B2BLoginForm } from "@/components/auth/B2BLoginForm";

export const metadata: Metadata = {
  title: "Supplier Login | DiscountBazaar.PK",
};

export default function SupplierLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-12 sm:px-6">
      <B2BLoginForm
        role="Supplier"
        title="Supplier Portal Sign In"
        subtitle="Use your supplier credentials to access proposals and manifests."
        redirectTo="/supplier"
      />
    </div>
  );
}
