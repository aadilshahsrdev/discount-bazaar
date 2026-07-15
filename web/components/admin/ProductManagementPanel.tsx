"use client";

import { useEffect, useState } from "react";
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

  const selected = products.find((product) => product._id === selectedId) ?? null;

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
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Product Catalog</h2>
          <p className="mt-1 text-sm text-slate-500">Inspect, update, or remove products published in the system.</p>
        </div>
        <div className="max-h-[680px] overflow-auto">
          {isLoading ? (
            <div className="px-5 py-6 text-sm text-slate-400">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">No products available.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((product) => {
                  const active = product._id === selectedId;
                  return (
                    <tr key={product._id} className={active ? "bg-oceanic/5" : undefined}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{product.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatPKR(product.pricing.currentRetailPrice)} · {product.deposit_percentage}% deposit
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {product.supplierId?.supplierDetails?.companyName ?? product.supplierId?.name ?? "Unknown"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedId(product._id);
                            syncForm(product);
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-oceanic hover:text-oceanic"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Manage Product</h2>
            <p className="mt-1 text-sm text-slate-500">Edit the selected product or remove it from the live catalog.</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={!selected || isSaving}
            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            Delete
          </button>
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            Select a product from the list to edit it.
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
