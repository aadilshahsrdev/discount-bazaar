"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PortalShell } from "@/components/portal/PortalShell";
import { ProposalQueueTable } from "@/components/admin/ProposalQueueTable";
import { DirectListingForm } from "@/components/admin/DirectListingForm";
import { DisputeLedgerTable } from "@/components/admin/DisputeLedgerTable";
import { ProductManagementPanel } from "@/components/admin/ProductManagementPanel";
import { SupplierApplicationsPanel } from "@/components/admin/SupplierApplicationsPanel";
import { ToastStack, useToasts } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthContext";
import { fetchDisputes, fetchPendingProducts } from "@/lib/api";
import type { Dispute, PendingProduct } from "@/lib/types";

type Tab = "overview" | "products" | "applications" | "queue" | "listing" | "ledger";

function AdminPortal() {
  const { token } = useAuth();
  const { toasts, pushToast, dismissToast } = useToasts();
  const [tab, setTab] = useState<Tab>("queue");
  const [pending, setPending] = useState<PendingProduct[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setPending(await fetchPendingProducts(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the proposal queue.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadDisputes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setDisputes(await fetchDisputes(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load disputes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tab === "queue") void loadQueue();
      if (tab === "ledger") void loadDisputes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tab, loadQueue, loadDisputes]);

  return (
    <PortalShell
      title="Admin Command Center"
      subtitle="Administrator"
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "products", label: "Products" },
        { id: "applications", label: "Supplier Registrations" },
        { id: "queue", label: "Proposal Queue" },
        { id: "listing", label: "Direct Listing" },
        { id: "ledger", label: "Conflict Resolution & Ledger" },
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as Tab)}
    >
      <div className="font-heading">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-oceanic to-oceanic-dark p-8 text-white shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Premium Admin Console</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
                Manage the live catalog, review supplier onboarding, and keep disputes under control.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/80">
                This dashboard is isolated from the public storefront. Use it to approve supplier applications, edit products, and handle operational exceptions.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Catalog Control" description="Add, edit, or delete products from the dashboard." />
              <StatCard title="Supplier Review" description="Approve or reject applications before they gain portal access." />
              <StatCard title="Operations" description="Monitor disputes, direct listings, and proposal approvals." />
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Products</h1>
              <p className="mt-1 font-body text-sm text-slate-500">Review every product in the catalog, then edit or remove them from the live storefront.</p>
            </div>
            <ProductManagementPanel onNotify={(message, ok) => pushToast(message, ok ? "success" : "error")} />
          </div>
        )}

        {tab === "applications" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Supplier Registrations</h1>
              <p className="mt-1 font-body text-sm text-slate-500">Review business applications, leave notes, and approve or reject the onboarding request.</p>
            </div>
            <SupplierApplicationsPanel onNotify={(message, ok) => pushToast(message, ok ? "success" : "error")} />
          </div>
        )}

        {tab === "queue" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Proposal Queue</h1>
            <p className="mt-1 font-body text-sm text-slate-500">Review supplier-submitted products before they go live.</p>
            <div className="mt-6 font-body">
              {isLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : (
                <ProposalQueueTable
                  products={pending}
                  onResolved={(id) => setPending((prev) => prev.filter((p) => p._id !== id))}
                  onNotify={(message, ok) => pushToast(message, ok ? "success" : "error")}
                />
              )}
            </div>
          </div>
        )}

        {tab === "listing" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Direct Listing</h1>
            <p className="mt-1 font-body text-sm text-slate-500">Bypass suppliers and inject inventory directly.</p>
            <div className="mt-6 font-body">
              <DirectListingForm onSubmitted={(message, ok) => pushToast(message, ok ? "success" : "error")} />
            </div>
          </div>
        )}

        {tab === "ledger" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Conflict Resolution & Ledger</h1>
            <p className="mt-1 font-body text-sm text-slate-500">Active buyer complaints awaiting resolution.</p>
            <div className="mt-6 font-body">
              {isLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : (
                <DisputeLedgerTable
                  disputes={disputes}
                  onResolved={(id) => setDisputes((prev) => prev.filter((d) => d._id !== id))}
                  onNotify={(message, ok) => pushToast(message, ok ? "success" : "error")}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PortalShell>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard role="Admin">
      <AdminPortal />
    </RoleGuard>
  );
}

function StatCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oceanic">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
