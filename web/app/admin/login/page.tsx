import type { Metadata } from "next";
import { B2BLoginForm } from "@/components/auth/B2BLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | DiscountBazaar.PK",
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-12 sm:px-6">
      <B2BLoginForm
        role="Admin"
        title="Admin Portal Sign In"
        subtitle="Use your internal admin credentials to access the command center."
        redirectTo="/admin"
      />
    </div>
  );
}
