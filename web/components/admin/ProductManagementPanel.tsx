"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  deleteAdminProduct,
  fetchAdminProducts,
  fetchSuppliers,
  updateAdminProduct,
} from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { AdminProduct, SupplierSummary } from "@/lib/types";

interface ProductFormState {
  title: string;
  description: string;
  images: string;
  category: string;
  supplierId: string;
  marketAnchorPrice: string;
  baseWholesaleCost: string;
  maxSquadDiscountPercent: string;
  depositPercentage: string;
  maxSquadMembers: string;
  dualCheckoutEnabled: boolean;
  isActive: boolean;
}

const EMPTY_FORM: ProductFormState = {
  title: "",
  description: "",
  images: "",
  category: "",
  supplierId: "",
  marketAnchorPrice: "",
  baseWholesaleCost: "",
  maxSquadDiscountPercent: "",
  depositPercentage: "10",
  maxSquadMembers: "30",
  dualCheckoutEnabled: true,
  isActive: true,
};

export function ProductManagementPanel({
  onNotify,
}: {
  onNotify: (message: string, ok: boolean) => void;
}) {
  const { token } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const selected = products.find((product) => product._id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.supplierId?.supplierDetails?.companyName ?? p.supplierId?.name ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  function syncForm(product: AdminProduct): void {
    setForm({
      title: product.title,
      description: product.description,
      images: product.images.join("\n"),
      category: product.category,
      supplierId: product.supplierId?._id ?? "",
      marketAnchorPrice: String(product.pricing.marketAnchorPrice),
      baseWholesaleCost: String(product.pricing.baseWholesaleCost),
      maxSquadDiscountPercent: String(Math.round(product.pricing.maxSquadDiscount * 100)),
      depositPercentage: String(product.deposit_percentage ?? 10),
      maxSquadMembers: String(product.maxSquadMembers),
      dualCheckoutEnabled: product.dualCheckoutEnabled,
      isActive: product.isActive,
    });
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const [productList, supplierList] = await Promise.all([fetchAdminProducts(token), fetchSuppliers(token)]);
          setProducts(productList);
          setSuppliers(supplierList);
          if (productList.length > 0) {
            setSelectedId(productList[0]._id);
            syncForm(productList[0]);
          }
        } catch (err) {
          onNotify(err instanceof Error ? err.message : "Could not load products.", false);
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [onNotify, token]);

  useEffect(() => {
    if (!selected) return;
    syncForm(selected);
  }, [selected]);

  async function handleSave(): Promise<void> {
    if (!token || !selected) return;
    setSaving(true);
    try {
      const updated = await updateAdminProduct(
        selected._id,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          images: form.images
            .split("\n")
            .map((entry) => entry.trim())
            .filter(Boolean),
          category: form.category.trim(),
          supplierId: form.supplierId,
          market_anchor_price: Number(form.marketAnchorPrice),
          base_wholesale_cost: Number(form.baseWholesaleCost),
          max_squad_discount_percent: Number(form.maxSquadDiscountPercent),
          deposit_percentage: Number(form.depositPercentage),
          maxSquadMembers: Number(form.maxSquadMembers),
          dualCheckoutEnabled: form.dualCheckoutEnabled,
          isActive: form.isActive,
        },
        token,
      );
      setProducts((prev) => prev.map((product) => (product._id === updated._id ? updated : product)));
      setSelectedId(updated._id);
      syncForm(updated);
      onNotify("Product updated successfully.", true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not update the product.", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!token || !selected) return;
    const confirmDelete = window.confirm(`Remove ${selected.title} from the live catalog?`);
    if (!confirmDelete) return;

    setSaving(true);
    try {
      await deleteAdminProduct(selected._id, token);
      setProducts((prev) => prev.filter((product) => product._id !== selected._id));
      const next = products.find((product) => product._id !== selected._id) ?? null;
      setSelectedId(next?._id ?? null);
      if (next) {
        syncForm(next);
      } else {
        setForm(EMPTY_FORM);
      }
      onNotify("Product removed from the catalog.", true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not remove the product.", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      {/* Product list */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">Product Catalog</h2>
              <p className="mt-1 text-sm text-slate-500">{products.length} products in the system</p>
            </div>
          </div>
          <div className="relative mt-3">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 focus:border-oceanic focus:bg-white focus:outline-none"
            />
          </div>
        </div>
        <div className="max-h-[680px] overflow-auto">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">{search ? "No products match your search." : "No products available."}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const active = product._id === selectedId;
                return (
                  <button
                    key={product._id}
                    onClick={() => {
                      setSelectedId(product._id);
                      syncForm(product);
                    }}
                    className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${
                      active ? "bg-oceanic/5 border-l-4 border-l-oceanic" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-slate-400">N/A</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{product.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatPKR(product.pricing.currentRetailPrice)} · {product.category}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Edit panel */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Manage Product</h2>
            <p className="mt-1 text-sm text-slate-500">Edit the selected product or remove it from the live catalog.</p>
          </div>
          {selected && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="shrink-0 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
            >
              Delete
            </button>
          )}
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="text-sm text-slate-500">Select a product from the list to edit it.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Image URLs (one per line)
              <textarea
                value={form.images}
                onChange={(e) => setForm((prev) => ({ ...prev, images: e.target.value }))}
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Category
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Supplier
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.supplierDetails?.companyName ?? supplier.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Retail Anchor" value={form.marketAnchorPrice} onChange={(value) => setForm((prev) => ({ ...prev, marketAnchorPrice: value }))} />
              <Field label="Wholesale Cost" value={form.baseWholesaleCost} onChange={(value) => setForm((prev) => ({ ...prev, baseWholesaleCost: value }))} />
              <Field label="Max Discount %" value={form.maxSquadDiscountPercent} onChange={(value) => setForm((prev) => ({ ...prev, maxSquadDiscountPercent: value }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Deposit %" value={form.depositPercentage} onChange={(value) => setForm((prev) => ({ ...prev, depositPercentage: value }))} />
              <Field label="Squad Size" value={form.maxSquadMembers} onChange={(value) => setForm((prev) => ({ ...prev, maxSquadMembers: value }))} />
              <label className="block text-sm font-medium text-slate-700">
                Visibility
                <div className="mt-2 flex h-[52px] items-center rounded-xl border border-slate-200 px-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Dual Checkout Enabled
              <div className="mt-2 flex h-[52px] items-center rounded-xl border border-slate-200 px-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.dualCheckoutEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, dualCheckoutEnabled: e.target.checked }))}
                  />
                  Allow Buy Now and Join Squad
                </label>
              </div>
            </label>

            <div className="flex items-center justify-between rounded-2xl bg-oceanic/5 px-4 py-3 text-sm text-slate-600">
              <span>Current retail price</span>
              <span className="font-semibold text-oceanic">{formatPKR(selected.pricing.currentRetailPrice)}</span>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-2xl bg-oceanic px-4 py-3 text-sm font-semibold text-white transition hover:bg-oceanic-dark disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-oceanic focus:outline-none"
      />
    </label>
  );
}
