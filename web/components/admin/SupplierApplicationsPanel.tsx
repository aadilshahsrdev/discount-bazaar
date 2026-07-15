"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { fetchSupplierApplications, resolveSupplierApplication } from "@/lib/api";
import type { SupplierApplication } from "@/lib/types";

export function SupplierApplicationsPanel({
  onNotify,
}: {
  onNotify: (message: string, ok: boolean) => void;
}) {
  const { token } = useAuth();
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          setApplications(await fetchSupplierApplications(token));
        } catch (err) {
          onNotify(err instanceof Error ? err.message : "Could not load supplier applications.", false);
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [onNotify, token]);

  async function handleDecision(applicationId: string, decision: "Approved" | "Rejected"): Promise<void> {
    if (!token) return;
    setSubmitting((prev) => ({ ...prev, [applicationId]: true }));
    try {
      await resolveSupplierApplication(
        applicationId,
        { decision, reviewNote: notes[applicationId] ?? "" },
        token,
      );
      setApplications((prev) =>
        prev.map((application) =>
          application._id === applicationId
            ? { ...application, verificationStatus: decision, reviewNote: notes[applicationId] ?? undefined }
            : application,
        ),
      );
      onNotify(`Supplier application ${decision.toLowerCase()}.`, true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not resolve the supplier application.", false);
    } finally {
      setSubmitting((prev) => ({ ...prev, [applicationId]: false }));
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-heading text-lg font-bold text-slate-900">Supplier Registrations</h2>
        <p className="mt-1 text-sm text-slate-500">Review new supplier applications, approve them, or reject them with a note.</p>
      </div>

      <div className="p-5">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading supplier applications…</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-500">No supplier applications found.</p>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => {
              const pending = application.verificationStatus === "Pending";
              return (
                <div key={application._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{application.supplierDetails?.companyName ?? application.name}</h3>
                        <StatusPill status={application.verificationStatus} />
                      </div>
                      <p className="text-sm text-slate-500">{application.phoneNumber}{application.email ? ` · ${application.email}` : ""}</p>
                      <p className="text-sm text-slate-500">Network ID: {application.dropshipNetworkId ?? "N/A"}</p>
                      <p className="text-sm text-slate-500">CNIC / NTN: {application.cnicNtn ?? "N/A"}</p>
                      {application.reviewNote && (
                        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Note: {application.reviewNote}</p>
                      )}
                    </div>
                    <div className="min-w-[320px] space-y-3">
                      <textarea
                        value={notes[application._id] ?? application.reviewNote ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [application._id]: e.target.value }))}
                        placeholder="Write a note for the supplier application..."
                        className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void handleDecision(application._id, "Approved")}
                          disabled={isSubmitting[application._id] || !pending}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isSubmitting[application._id] ? "Saving…" : "Approve"}
                        </button>
                        <button
                          onClick={() => void handleDecision(application._id, "Rejected")}
                          disabled={isSubmitting[application._id] || !pending}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: SupplierApplication["verificationStatus"] }) {
  const classes =
    status === "Approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Rejected"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{status}</span>;
}
