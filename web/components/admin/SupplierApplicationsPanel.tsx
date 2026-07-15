"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { fetchSupplierApplications, messageSupplier, resolveSupplierApplication } from "@/lib/api";
import type { SupplierApplication } from "@/lib/types";

export function SupplierApplicationsPanel({
  onNotify,
}: {
  onNotify: (message: string, ok: boolean) => void;
}) {
  const { token } = useAuth();
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  async function handleSendMessage(applicationId: string): Promise<void> {
    if (!token) return;
    const msg = messages[applicationId]?.trim();
    if (!msg) {
      onNotify("Please enter a message to send.", false);
      return;
    }
    setSubmitting((prev) => ({ ...prev, [`${applicationId}_msg`]: true }));
    try {
      const result = await messageSupplier(applicationId, msg, token);
      onNotify(`Message sent to ${result.sentTo}.`, true);
      setMessages((prev) => ({ ...prev, [applicationId]: "" }));
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not send the message.", false);
    } finally {
      setSubmitting((prev) => ({ ...prev, [`${applicationId}_msg`]: false }));
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-heading text-lg font-bold text-slate-900">Supplier Registrations</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review new supplier applications, approve or reject them, and send messages directly to the supplier&apos;s email or phone.
        </p>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="text-sm text-slate-500">No supplier applications found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => {
              const pending = application.verificationStatus === "Pending";
              const isExpanded = expandedId === application._id;
              return (
                <div key={application._id} className="rounded-2xl border border-slate-200 transition hover:shadow-md">
                  <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {application.supplierDetails?.companyName ?? application.name}
                        </h3>
                        <StatusPill status={application.verificationStatus} />
                      </div>
                      <p className="text-sm text-slate-500">
                        {application.phoneNumber}
                        {application.email ? ` · ${application.email}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        {application.dropshipNetworkId && (
                          <span>Network: <span className="font-medium text-slate-700">{application.dropshipNetworkId}</span></span>
                        )}
                        {application.cnicNtn && (
                          <span>CNIC/NTN: <span className="font-medium text-slate-700">{application.cnicNtn}</span></span>
                        )}
                        {application.contactNumber && application.contactNumber !== application.phoneNumber && (
                          <span>Contact: <span className="font-medium text-slate-700">{application.contactNumber}</span></span>
                        )}
                      </div>
                      {application.createdAt && (
                        <p className="text-xs text-slate-400">
                          Applied {new Date(application.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      )}
                      {application.reviewNote && (
                        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Note: {application.reviewNote}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:min-w-[300px]">
                      <textarea
                        value={notes[application._id] ?? application.reviewNote ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [application._id]: e.target.value }))}
                        placeholder="Review note (visible to supplier)..."
                        className="min-h-20 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void handleDecision(application._id, "Approved")}
                          disabled={isSubmitting[application._id] || !pending}
                          className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isSubmitting[application._id] ? "Saving…" : "Approve"}
                        </button>
                        <button
                          onClick={() => void handleDecision(application._id, "Rejected")}
                          disabled={isSubmitting[application._id] || !pending}
                          className="flex-1 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : application._id)}
                        className="flex items-center justify-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        {isExpanded ? "Hide" : "Send Message"}
                        <span className={`transition ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Message to Supplier
                            {application.email && <span className="ml-2 normal-case text-slate-400">({application.email})</span>}
                          </label>
                          <textarea
                            value={messages[application._id] ?? ""}
                            onChange={(e) => setMessages((prev) => ({ ...prev, [application._id]: e.target.value }))}
                            placeholder="Type a message to send to the supplier's email..."
                            className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => void handleSendMessage(application._id)}
                          disabled={isSubmitting[`${application._id}_msg`]}
                          className="shrink-0 rounded-full bg-oceanic px-5 py-3 text-xs font-semibold text-white transition hover:bg-oceanic-dark disabled:opacity-50"
                        >
                          {isSubmitting[`${application._id}_msg`] ? "Sending…" : "Send Message"}
                        </button>
                      </div>
                    </div>
                  )}
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
