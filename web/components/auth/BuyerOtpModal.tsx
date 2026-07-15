"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { sendWhatsappOtp, verifyWhatsappOtp } from "@/lib/api";

interface BuyerOtpModalProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onVerified: (result: { token: string; user: { id: string; phoneNumber: string; name: string; role: string } }) => void;
}

type Step = "phone" | "otp";

export function BuyerOtpModal({ open, title, description, onClose, onVerified }: BuyerOtpModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setName("");
    setError(null);
    setDevOtp(null);
    setSubmitting(false);
  }

  async function handleSendOtp() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await sendWhatsappOtp(phoneNumber);
      if (result.devOtp) setDevOtp(result.devOtp);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyWhatsappOtp(phoneNumber, otp, name);
      login(result.token, result.user as Parameters<typeof login>[1]);
      onVerified(result);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === "phone" ? (
          <div className="space-y-3">
            <p className="rounded-2xl bg-oceanic/5 px-4 py-3 text-sm text-slate-600">
              This WhatsApp flow is for buyers only. Admin and supplier users should use the dedicated B2B login pages.
            </p>
            <input
              type="tel"
              placeholder="+923001234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={isSubmitting || !phoneNumber}
              className="w-full rounded-xl bg-oceanic px-4 py-3 text-sm font-semibold text-white transition hover:bg-oceanic-dark disabled:opacity-50"
            >
              {isSubmitting ? "Sending…" : "Send code"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Enter the code sent to <span className="font-medium text-slate-700">{phoneNumber}</span>.
            </p>
            {devOtp && (
              <div className="rounded-lg bg-mint/15 px-3 py-2 text-sm text-mint-dark">
                Demo OTP: <span className="font-bold tracking-wider">{devOtp}</span>
              </div>
            )}
            <input
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
            />
            <input
              type="text"
              placeholder="Your name (first time only)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={isSubmitting || !otp}
              className="w-full rounded-xl bg-oceanic px-4 py-3 text-sm font-semibold text-white transition hover:bg-oceanic-dark disabled:opacity-50"
            >
              {isSubmitting ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              onClick={() => {
                reset();
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
            >
              Use a different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
