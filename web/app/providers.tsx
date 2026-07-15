"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { GlobalToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <GlobalToastProvider>{children}</GlobalToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
