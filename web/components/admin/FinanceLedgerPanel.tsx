"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFinanceLedger, adminFinanceOverview, type FinanceOverview, type LedgerEntry } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export function FinanceLedgerPanel() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, lg] = await Promise.all([
        adminFinanceOverview(token),
        adminFinanceLedger(token),
      ]);
      setOverview(ov);
      setLedger(lg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load financial data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const typeColors: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Ledger</h1>
        <p className="mt-1 text-sm text-slate-500">Track money moving through Safepay escrow, platform fees, and supplier payouts.</p>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading financials…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Top metric cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total Escrow Holding"
            value={overview.totalEscrowHolding}
            subtitle="Funds locked in Safepay (Gathering squads)"
            tone="oceanic"
          />
          <MetricCard
            title="Pending Supplier Payouts"
            value={overview.pendingSupplierPayouts}
            subtitle="Owed to suppliers (Dispatched squads)"
            tone="amber"
          />
          <MetricCard
            title="Total Platform Revenue"
            value={overview.totalPlatformRevenue}
            subtitle="Commission retained (10% of captured)"
            tone="mint"
          />
        </div>
      )}

      {/* Ledger table */}
      {ledger.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-800">Transaction History</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((entry, i) => (
                <tr key={i} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(entry.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{entry.transactionId}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeColors[entry.colorClass] ?? "bg-slate-100 text-slate-500"}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    PKR {entry.amount.toLocaleString("en-PK")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && ledger.length === 0 && (
        <p className="text-sm text-slate-400">No transactions yet.</p>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: number;
  subtitle: string;
  tone: "oceanic" | "amber" | "mint";
}) {
  const toneClasses = {
    oceanic: "from-oceanic to-oceanic-dark",
    amber: "from-amber-500 to-amber-600",
    mint: "from-emerald-500 to-emerald-600",
  };
  return (
    <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${toneClasses[tone]} p-5 text-white shadow-lg`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</p>
      <p className="mt-2 text-3xl font-bold">PKR {value.toLocaleString("en-PK")}</p>
      <p className="mt-2 text-xs text-white/70">{subtitle}</p>
    </div>
  );
}
