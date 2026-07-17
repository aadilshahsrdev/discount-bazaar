"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateSquad,
  adminDispatchSquad,
  adminGetSquad,
  adminListSquads,
  type AdminSquadDetail,
} from "@/lib/api";
import type { Squad } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";

const EXPIRY_OPTIONS = [
  { label: "24 Hours", hours: 24 },
  { label: "48 Hours", hours: 48 },
  { label: "2 Days", hours: 48 },
  { label: "7 Days", hours: 168 },
];

export function SquadOperationsPanel({ onNotify }: { onNotify: (msg: string, ok: boolean) => void }) {
  const { token } = useAuth();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminSquadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setSquads(await adminListSquads(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load squads.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openSquad(id: string) {
    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await adminGetSquad(id, token);
      setSelected(detail);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not load squad details.", false);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDispatch() {
    if (!selected || !token) return;
    setDispatching(true);
    try {
      await adminDispatchSquad(selected._id, token);
      onNotify("Squad dispatched to dropship network.", true);
      setSelected(null);
      await load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Dispatch failed.", false);
    } finally {
      setDispatching(false);
    }
  }

  const statusColors: Record<string, string> = {
    Gathering: "bg-oceanic/10 text-oceanic",
    Voting: "bg-amber-100 text-amber-700",
    Captured: "bg-mint/20 text-oceanic-dark",
    Dispatched: "bg-slate-200 text-slate-600",
    Completed: "bg-emerald-100 text-emerald-700",
    Failed: "bg-red-100 text-red-700",
    Voided: "bg-slate-200 text-slate-500",
  };

  function timeRemaining(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / (60 * 60 * 1000));
    const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return `${h}h ${m}m`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Squad Operations</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all squads across the platform and dispatch filled squads to the dropship network.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-oceanic px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-oceanic-dark"
        >
          + Create Squad
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading squads…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && squads.length === 0 && (
        <p className="text-sm text-slate-400">No squads found.</p>
      )}

      {squads.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Time Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {squads.map((s) => {
                const p = s.productId as unknown as { title: string; pricing: { marketAnchorPrice: number; maxSquadDiscount: number } };
                return (
                  <tr key={s._id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{s.targetMembers}</td>
                    <td className="px-4 py-3 text-slate-600">{s.currentMembers}</td>
                    <td className="px-4 py-3 text-slate-600">{timeRemaining(s.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[s.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void openSquad(s._id)}
                        className="text-xs font-medium text-oceanic hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Squad Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-800">Squad Detail</h2>
              <button
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Target</p>
                  <p className="text-lg font-bold text-slate-800">{selected.targetMembers}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Joined</p>
                  <p className="text-lg font-bold text-slate-800">{selected.currentMembers}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm font-bold text-oceanic">{selected.status}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Members & Shipping Addresses</p>
                {selected.members.length === 0 ? (
                  <p className="text-sm text-slate-400">No members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.members.map((m, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800">{m.name}</p>
                          {m.vote && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.vote === "Proceed" ? "bg-mint/20 text-oceanic-dark" : "bg-red-100 text-red-700"}`}>
                              {m.vote}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{m.phoneNumber}</p>
                        {m.shippingAddress ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {m.shippingAddress.area}, {m.shippingAddress.city}, {m.shippingAddress.province}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-amber-600">No shipping address</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(selected.status === "Captured" || selected.status === "Gathering") && selected.currentMembers >= selected.targetMembers && (
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="w-full rounded-full bg-oceanic px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-oceanic-dark disabled:opacity-60"
                >
                  {dispatching ? "Dispatching…" : "Dispatch to Dropship Network (HHC/YourMart)"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Squad Modal */}
      {showCreate && (
        <CreateSquadModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={(msg) => {
            setShowCreate(false);
            onNotify(msg, true);
            void load();
          }}
          onError={(msg) => onNotify(msg, false)}
        />
      )}

    </div>
  );
}

function CreateSquadModal({
  token,
  onClose,
  onCreated,
  onError,
}: {
  token: string | null;
  onClose: () => void;
  onCreated: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [productId, setProductId] = useState("");
  const [targetMembers, setTargetMembers] = useState(30);
  const [expiryHours, setExpiryHours] = useState(24);
  const [products, setProducts] = useState<Array<{ _id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch active products list
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/products?limit=100`);
        const json = await res.json();
        setProducts(json.data ?? []);
      } catch {
        onError("Could not load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, [onError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !productId) return;
    setSubmitting(true);
    try {
      await adminCreateSquad({ productId, targetMembers, expiryHours }, token);
      onCreated("Squad created and is now live on the offers page.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not create squad.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">Create New Squad</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Product</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-oceanic"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Target Members</span>
            <input
              type="number"
              min={1}
              value={targetMembers}
              onChange={(e) => setTargetMembers(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-oceanic"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Expiry Window</span>
            <select
              value={expiryHours}
              onChange={(e) => setExpiryHours(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-oceanic"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.hours} value={o.hours}>{o.label}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={submitting || loading || !productId}
            className="w-full rounded-full bg-oceanic px-6 py-3 text-sm font-bold text-white transition hover:bg-oceanic-dark disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create & Go Live"}
          </button>
        </form>
      </div>
    </div>
  );
}
