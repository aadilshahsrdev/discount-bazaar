"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PortalShell } from "@/components/portal/PortalShell";
import { ProposeDealForm } from "@/components/supplier/ProposeDealForm";
import { OrderManifestTable } from "@/components/supplier/OrderManifestTable";
import { ToastStack, useToasts } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthContext";
import { fetchSupplierManifests } from "@/lib/api";
import type { ManifestOrder } from "@/lib/types";

type Tab = "propose" | "manifests";

function UnderReviewScreen() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Application Under Review
        </div>

        <h1 className="mt-4 font-heading text-3xl font-bold text-slate-900">We are reviewing your supplier application</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Your application to become a verified supplier is currently under review by our team. You will receive access to your dashboard once your business details are verified.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <InfoCard title="Business Details" value="Submitted" />
          <InfoCard title="Verification" value="Pending" />
          <InfoCard title="Portal Access" value="Locked" />
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          This page is read-only while your application is in review. Once approved, your full supplier tools will appear automatically.
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SupplierPortal() {
  const { user, token } = useAuth();
  const { toasts, pushToast, dismissToast } = useToasts();
  const [tab, setTab] = useState<Tab>("propose");
  const [orders, setOrders] = useState<ManifestOrder[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const verificationStatus = user?.verificationStatus ?? "Approved";
  const isPending = verificationStatus === "Pending";

  const loadManifests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchSupplierManifests(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load order manifests.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isPending && tab === "manifests") void loadManifests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isPending, tab, loadManifests]);

  if (isPending) {
    return <UnderReviewScreen />;
  }

  return (
    <PortalShell
      title="Supplier Portal"
      subtitle="Supplier account"
      tabs={[
        { id: "propose", label: "Propose Deal" },
        { id: "manifests", label: "Order Manifests" },
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as Tab)}
    >
      {tab === "propose" ? (
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Propose a Deal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit a new product for admin review — it goes live once approved.
          </p>
          <div className="mt-6">
            <ProposeDealForm onSubmitted={(message, ok) => pushToast(message, ok ? "success" : "error")} />
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Order Manifests</h1>
          <p className="mt-1 text-sm text-slate-500">Orders ready for dispatch from your catalog.</p>
          <div className="mt-6">
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <OrderManifestTable
                orders={orders}
                onUpdated={(updated) => setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))}
                onNotify={(message, ok) => pushToast(message, ok ? "success" : "error")}
              />
            )}
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PortalShell>
  );
}

export default function SupplierPage() {
  return (
    <RoleGuard role="Supplier">
      <SupplierPortal />
    </RoleGuard>
  );
}
