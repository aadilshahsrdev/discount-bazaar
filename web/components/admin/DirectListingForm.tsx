"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { fetchSuppliers, uploadProductWithMedia, type MediaUploadPayload } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { SupplierSummary } from "@/lib/types";

interface MediaSlot {
  id: number;
  mode: "url" | "file";
  url: string;
  file: File | null;
  preview: string | null;
  isVideo: boolean;
}

function createEmptySlot(id: number): MediaSlot {
  return { id, mode: "url", url: "", file: null, preview: null, isVideo: false };
}

function isVideoFile(filename: string): boolean {
  return /\.(mp4|webm|ogg|mov)$/i.test(filename);
}

export function DirectListingForm({ onSubmitted }: { onSubmitted: (message: string, ok: boolean) => void }) {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [anchorPrice, setAnchorPrice] = useState("");
  const [wholesaleCost, setWholesaleCost] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [depositPct, setDepositPct] = useState("10");
  const [isSubmitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<MediaSlot[]>(() =>
    Array.from({ length: 4 }, (_, i) => createEmptySlot(i)),
  );

  useEffect(() => {
    if (!token) return;
    fetchSuppliers(token)
      .then((list) => {
        setSuppliers(list);
        if (list.length > 0) setSupplierId(list[0]._id);
      })
      .catch(() => setSuppliers([]));
  }, [token]);

  const anchor = Number(anchorPrice) || 0;
  const wholesale = Number(wholesaleCost) || 0;
  const discount = Number(discountPct) || 0;
  const deposit = Number(depositPct) || 10;
  const squadSellingPrice = anchor * (1 - discount / 100);

  function updateSlot(id: number, patch: Partial<MediaSlot>): void {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleFileSelect(id: number, file: File | null): void {
    if (!file) {
      updateSlot(id, { file: null, preview: null, isVideo: false });
      return;
    }
    const preview = isVideoFile(file.name) ? "" : URL.createObjectURL(file);
    updateSlot(id, {
      file,
      preview,
      isVideo: isVideoFile(file.name),
      mode: "file",
    });
  }

  function handleUrlChange(id: number, url: string): void {
    updateSlot(id, {
      url,
      isVideo: isVideoFile(url),
      mode: "url",
    });
  }

  async function handleSubmit() {
    if (!token) return;
    if (!supplierId) {
      onSubmitted("Select a supplier to attribute this listing to.", false);
      return;
    }
    if (!title.trim() || !category.trim() || !description.trim()) {
      onSubmitted("Title, category, and description are required.", false);
      return;
    }
    if (anchor <= 0 || wholesale <= 0) {
      onSubmitted("Retail anchor price and wholesale cost must be greater than 0.", false);
      return;
    }
    if (deposit < 0 || deposit > 100) {
      onSubmitted("Deposit percentage must be between 0 and 100.", false);
      return;
    }

    const imageUrls = slots.filter((s) => s.mode === "url" && s.url.trim()).map((s) => s.url.trim());
    const mediaFiles = slots.filter((s) => s.mode === "file" && s.file).map((s) => s.file!);

    if (imageUrls.length + mediaFiles.length > 4) {
      onSubmitted("Maximum 4 media items allowed.", false);
      return;
    }

    setSubmitting(true);
    try {
      const payload: MediaUploadPayload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        supplierId,
        market_anchor_price: anchor,
        base_wholesale_cost: wholesale,
        max_squad_discount_percent: discount,
        deposit_percentage: deposit,
        imageUrls,
        mediaFiles,
      };
      await uploadProductWithMedia(payload, token);
      onSubmitted("Product published directly to the catalog.", true);
      setTitle("");
      setCategory("");
      setDescription("");
      setAnchorPrice("");
      setWholesaleCost("");
      setDiscountPct("");
      setDepositPct("10");
      setSlots(Array.from({ length: 4 }, (_, i) => createEmptySlot(i)));
    } catch (err) {
      onSubmitted(err instanceof Error ? err.message : "Failed to publish product.", false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Attribute to Supplier</span>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
          {suppliers.length === 0 && <option value="">No suppliers found</option>}
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.supplierDetails?.companyName ?? s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Product Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Category</span>
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-20" />
      </label>

      {/* Media slots */}
      <div>
        <span className="mb-2 block text-xs font-medium text-slate-600">
          Product Media (up to 4 images or videos)
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {slots.map((slot) => (
            <MediaSlotInput
              key={slot.id}
              slot={slot}
              onModeChange={(mode) => updateSlot(slot.id, { mode, file: null, preview: null })}
              onUrlChange={(url) => handleUrlChange(slot.id, url)}
              onFileSelect={(file) => handleFileSelect(slot.id, file)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Retail Anchor (PKR)</span>
          <input type="number" value={anchorPrice} onChange={(e) => setAnchorPrice(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Wholesale Cost (PKR)</span>
          <input type="number" value={wholesaleCost} onChange={(e) => setWholesaleCost(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Max Discount (%)</span>
          <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className="input" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Upfront Deposit (%)</span>
        <input
          type="number"
          min="0"
          max="100"
          value={depositPct}
          onChange={(e) => setDepositPct(e.target.value)}
          className="input"
        />
      </label>

      <div className="rounded-xl bg-oceanic/5 p-3 text-center text-xs text-slate-600">
        Squad Selling Price at max discount: <span className="font-bold text-oceanic">{formatPKR(squadSellingPrice)}</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full rounded-lg bg-oceanic py-2.5 text-sm font-semibold text-white hover:bg-oceanic-dark disabled:opacity-60"
      >
        {isSubmitting ? "Publishing…" : "Publish to Catalog"}
      </button>
    </div>
  );
}

function MediaSlotInput({
  slot,
  onModeChange,
  onUrlChange,
  onFileSelect,
}: {
  slot: MediaSlot;
  onModeChange: (mode: "url" | "file") => void;
  onUrlChange: (url: string) => void;
  onFileSelect: (file: File | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-slate-200 p-2">
      {/* Preview */}
      <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-slate-50">
        {slot.mode === "file" && slot.file ? (
          slot.isVideo ? (
            <div className="grid h-full w-full place-items-center text-slate-400">
              <div className="text-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-6 w-6">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <p className="mt-1 text-[10px]">{slot.file.name.slice(0, 12)}</p>
              </div>
            </div>
          ) : slot.preview ? (
            <img src={slot.preview} alt="Preview" className="h-full w-full object-cover" />
          ) : null
        ) : slot.mode === "url" && slot.url.trim() ? (
          slot.isVideo ? (
            <div className="grid h-full w-full place-items-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          ) : (
            <img src={slot.url} alt="Preview" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="grid h-full w-full place-items-center text-[10px] text-slate-300">Empty</div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="mb-1.5 flex gap-1">
        <button
          type="button"
          onClick={() => onModeChange("url")}
          className={`flex-1 rounded-md py-1 text-[10px] font-medium ${
            slot.mode === "url" ? "bg-oceanic text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => onModeChange("file")}
          className={`flex-1 rounded-md py-1 text-[10px] font-medium ${
            slot.mode === "file" ? "bg-oceanic text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          Upload
        </button>
      </div>

      {/* Input */}
      {slot.mode === "url" ? (
        <input
          type="text"
          value={slot.url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] focus:border-oceanic focus:outline-none"
        />
      ) : (
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
          className="w-full text-[10px] text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-[10px] file:font-medium"
        />
      )}
    </div>
  );
}
