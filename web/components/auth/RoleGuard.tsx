"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useGlobalToast } from "@/components/ui/Toast";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

/**
 * Client-side role gate for the Supplier/Admin portals. Waits for the auth
 * hydration check before deciding, then redirects anyone without the
 * required role — a signed-out visitor to "/", a Buyer (or wrong-role user)
 * to their own "/dashboard".
 */
export function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const { pushToast } = useGlobalToast();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      pushToast(`Unauthorized: You need ${role} access.`, "error");
      window.setTimeout(() => router.replace("/"), 150);
      return;
    }
    if (user.role !== role) {
      pushToast(`Unauthorized: You need ${role} access.`, "error");
      window.setTimeout(() => router.replace("/"), 150);
      return;
    }
  }, [isHydrated, pushToast, router, role, user]);

  if (!isHydrated || !user || user.role !== role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-oceanic border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
