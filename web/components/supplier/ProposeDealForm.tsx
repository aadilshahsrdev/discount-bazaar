/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { proposeProduct, uploadProductWithMedia } from "@/lib/api";
import { formatPKR } from "@/lib/format";

interface FormState {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  marketAnchorPrice: string;
  baseWholesaleCost: string;
  maxDiscountPercent: string;
  maxSquadMembers: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  category: "",
  description: "",
  imageUrl: "",
  marketAnchorPrice: "",
  baseWholesaleCost: "",
  maxDiscountPercent: "",
  maxSquadMembers: "30",
};

const STEPS = ["Product Details", "Pricing", "Review & Submit"] as const;
const MAX_MEDIA = 4;

type MediaPreview = { url: string; file: File; isVideo: boolean };

export function ProposeDealForm({ onSubmitted }: { onSubmitted: (message: string, ok: boolean) => void }) {
  const { user, token } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const anchor = Number(form.marketAnchorPrice) || 0;
  const wholesale = Number(form.baseWholesaleCost) || 0;
  const discountPct = Number(form.maxDiscountPercent) || 0;
  const squadSellingPrice = anchor * (1 - discountPct / 100);
  const margin = squadSellingPrice - wholesale;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_MEDIA - media.length;
    const toAdd = files.slice(0, remaining);

    const previews: MediaPreview[] = toAdd.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isVideo: file.type.startsWith("video/"),
    }));

    setMedia((prev) => [...prev, ...previews]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!form.title.trim()) return "Product title is required.";
      if (!form.category.trim()) return "Category is required.";
      if (!form.description.trim() || form.description.trim().length < 10)
        return "Description must be at least 10 characters.";
    }
    if (current === 1) {
      if (!form.marketAnchorPrice || anchor <= 0) return "Retail anchor price must be greater than 0.";
      if (!form.baseWholesaleCost || wholesale <= 0) return "Base wholesale cost must be greater than 0.";
      if (wholesale > anchor) return "Wholesale cost cannot exceed the retail anchor price.";
      if (!form.maxDiscountPercent || discountPct < 0 || discountPct > 100)
        return "Max discount must be between 0 and 100.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setValidationError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!token) return;
    setSubmitting(true);
    try {
      const hasFiles = media.length > 0;
      const urlImages = form.imageUrl.trim() ? [form.imageUrl.trim()] : [];

      if (hasFiles) {
        await uploadProductWithMedia(
          {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category.trim(),
            supplierId: user?.id ?? "",
            market_anchor_price: anchor,
            base_wholesale_cost: wholesale,
            max_squad_discount_percent: discountPct,
            maxSquadMembers: Number(form.maxSquadMembers) || 30,
            imageUrls: urlImages,
            mediaFiles: media.map((m) => m.file),
          },
          token,
        );
      } else {
        await proposeProduct(
          {
            title: form.title.trim(),
            description: form.description.trim(),
            images: urlImages,
            category: form.category.trim(),
            market_anchor_price: anchor,
            base_wholesale_cost: wholesale,
            max_squad_discount_percent: discountPct,
            maxSquadMembers: Number(form.maxSquadMembers) || 30,
          },
          token,
        );
      }

      onSubmitted("Proposal submitted — an admin will review it shortly.", true);
      setForm(EMPTY_FORM);
      setMedia([]);
      setStep(0);
    } catch (err) {
      onSubmitted(err instanceof Error ? err.message : "Failed to submit proposal.", false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-1 sm:gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                i <= step ? "bg-oceanic text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {i + 1}
            </div>
            <span className={`hidden text-xs font-medium sm:inline ${i <= step ? "text-slate-900" : "text-slate-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-slate-200 sm:w-8" />}
          </div>
        ))}
      </div>

      {validationError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{validationError}</div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Field label="Product Title">
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="input"
              placeholder="e.g. Sony WH-1000XM4 Wireless Headphones"
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="input"
              placeholder="e.g. Electronics"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input min-h-24"
              placeholder="Key specs and selling points for buyers."
            />
          </Field>

          {/* Media upload — up to 4 images/videos */}
          <Field label="Product Images / Videos (up to 4)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {media.map((m, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {m.isVideo ? (
                    <video src={m.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={m.url} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                    {m.isVideo && (
                      <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-red-500 shadow-sm transition hover:bg-white"
                    aria-label="Remove media"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}

              {media.length < MAX_MEDIA && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-oceanic hover:text-oceanic"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[10px] font-medium">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="mt-2 text-xs text-slate-400">
              Upload up to {MAX_MEDIA} images or short videos. Supported: JPG, PNG, WebP, MP4, WebM.
            </p>
          </Field>

          <Field label="Or paste an image URL (optional)">
            <input
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Retail Anchor Price (PKR)">
            <input
              type="number"
              value={form.marketAnchorPrice}
              onChange={(e) => update("marketAnchorPrice", e.target.value)}
              className="input"
              placeholder="82500"
            />
          </Field>
          <Field label="Base Wholesale Cost (PKR)">
            <input
              type="number"
              value={form.baseWholesaleCost}
              onChange={(e) => update("baseWholesaleCost", e.target.value)}
              className="input"
              placeholder="58000"
            />
          </Field>
          <Field label="Max Squad Discount (%)">
            <input
              type="number"
              value={form.maxDiscountPercent}
              onChange={(e) => update("maxDiscountPercent", e.target.value)}
              className="input"
              placeholder="24"
            />
          </Field>
          <Field label="Target Squad Size">
            <input
              type="number"
              value={form.maxSquadMembers}
              onChange={(e) => update("maxSquadMembers", e.target.value)}
              className="input"
            />
          </Field>

          <SummaryCard anchor={anchor} squadSellingPrice={squadSellingPrice} margin={margin} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 text-sm">
            <p className="font-semibold text-slate-900">{form.title || "Untitled product"}</p>
            <p className="text-slate-500">{form.category}</p>
            <p className="mt-2 text-slate-600">{form.description}</p>
          </div>

          {media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((m, i) => (
                <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                  {m.isVideo ? (
                    <video src={m.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={m.url} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <SummaryCard anchor={anchor} squadSellingPrice={squadSellingPrice} margin={margin} />
          <p className="text-xs text-slate-400">
            Submitting sends this proposal to the Admin Proposal Queue. It will not appear on the storefront until
            approved.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={goNext} className="rounded-lg bg-oceanic px-5 py-2 text-sm font-semibold text-white hover:bg-oceanic-dark">
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-mint px-5 py-2 text-sm font-semibold text-oceanic-dark hover:bg-mint-dark disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Proposal"}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ anchor, squadSellingPrice, margin }: { anchor: number; squadSellingPrice: number; margin: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl bg-oceanic/5 p-3 text-center sm:gap-3 sm:p-4">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]">Retail Price</p>
        <p className="mt-1 font-heading text-xs font-bold text-slate-900 sm:text-sm">{formatPKR(anchor)}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]">Squad Price</p>
        <p className="mt-1 font-heading text-xs font-bold text-oceanic sm:text-sm">{formatPKR(squadSellingPrice)}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]">Your Margin</p>
        <p className={`mt-1 font-heading text-xs font-bold sm:text-sm ${margin >= 0 ? "text-mint-dark" : "text-red-600"}`}>
          {formatPKR(margin)}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
