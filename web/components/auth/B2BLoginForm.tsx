"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { loginB2B } from "@/lib/api";

interface B2BLoginFormProps {
  role: "Admin" | "Supplier";
  title: string;
  subtitle: string;
  redirectTo: string;
}

export function B2BLoginForm({ role, title, subtitle, redirectTo }: B2BLoginFormProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginB2B(identifier, password, role);
      login(result.token, result.user as Parameters<typeof login>[1]);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oceanic">{role} Access</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Email or Phone
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={role === "Admin" ? "admin@discountbazaar.pk or +923000000001" : "supplier@discountbazaar.pk or +923000000002"}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-oceanic px-4 py-3 text-sm font-semibold text-white transition hover:bg-oceanic-dark disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        This portal uses B2B credentials only. Buyer WhatsApp login is not available here.
      </p>
    </div>
  );
}
