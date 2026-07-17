"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminGetCustomer,
  adminListCustomers,
  adminToggleSuspendCustomer,
  type AdminCustomer,
  type AdminCustomerDetail,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export function CustomerDirectoryPanel({ onNotify }: { onNotify: (msg: string, ok: boolean) => void }) {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminCustomerDetail | null>(null);
  const [actionOpen, setActionOpen] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setCustomers(await adminListCustomers(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openCustomer(id: string) {
    if (!token) return;
    setLoadingDetail(true);
    setActionOpen(null);
    try {
      const detail = await adminGetCustomer(id, token);
      setSelected(detail);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not load customer profile.", false);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleToggleSuspend(c: AdminCustomer) {
    if (!token) return;
    setActionOpen(null);
    try {
      const result = await adminToggleSuspendCustomer(c._id, token);
      onNotify(result.isSuspended ? "Buyer suspended." : "Buyer reinstated.", true);
      await load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Action failed.", false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
        <p className="mt-1 text-sm text-slate-500">Manage buyers, handle disputes, and maintain platform integrity.</p>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading customers…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && customers.length === 0 && (
        <p className="text-sm text-slate-400">No buyers registered yet.</p>
      )}

      {customers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Active Pledges</th>
                <th className="px-4 py-3">Lifetime Spent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c._id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{c.activePledges}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">PKR {c.lifetimeSpend.toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.accountStatus === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {c.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActionOpen(actionOpen === c._id ? null : c._id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-oceanic hover:text-oceanic"
                      >
                        Actions ▾
                      </button>
                      {actionOpen === c._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionOpen(null)} />
                          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                            <button
                              onClick={() => void openCustomer(c._id)}
                              className="block w-full px-4 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                            >
                              View Profile
                            </button>
                            <a
                              href={`https://wa.me/${c.phoneNumber.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActionOpen(null)}
                              className="block w-full px-4 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                            >
                              Ping via WhatsApp
                            </a>
                            <button
                              onClick={() => void handleToggleSuspend(c)}
                              className="block w-full px-4 py-2 text-left text-xs font-medium transition hover:bg-slate-50"
                              style={{ color: c.isSuspended ? "#059669" : "#dc2626" }}
                            >
                              {c.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">Customer Profile</h2>
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="text-sm font-medium text-slate-800">{selected.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm font-medium text-slate-800">{selected.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm font-medium text-slate-800">{selected.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${selected.isSuspended ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {selected.isSuspended ? "Suspended" : "Active"}
                  </span>
                </div>
              </div>

              {/* Saved Addresses */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Saved Delivery Address</p>
                {selected.shippingAddress ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-medium">{selected.shippingAddress.fullName}</p>
                    <p>{selected.shippingAddress.streetAddress}</p>
                    <p>{selected.shippingAddress.area}, {selected.shippingAddress.city}, {selected.shippingAddress.province}</p>
                    {selected.shippingAddress.landmark && <p className="text-xs text-slate-500">Landmark: {selected.shippingAddress.landmark}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No saved address.</p>
                )}
              </div>

              {/* Order History */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Order History</p>
                {selected.orderHistory.length === 0 ? (
                  <p className="text-sm text-slate-400">No transactions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.orderHistory.map((o) => (
                      <div key={o._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{o.productName}</p>
                          <p className="text-xs text-slate-500">{new Date(o.date).toLocaleDateString("en-PK")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-800">PKR {o.amount.toLocaleString("en-PK")}</p>
                          <span className="text-xs text-slate-500">{o.escrowState}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
          <p className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 shadow-lg">Loading…</p>
        </div>
      )}
    </div>
  );
}
