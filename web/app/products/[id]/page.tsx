import { notFound } from "next/navigation";
import { fetchActiveSquadForProduct, fetchProductById } from "@/lib/api";
import { DualCheckout } from "@/components/product/DualCheckout";
import { ProductGallery } from "@/components/product/ProductGallery";
import type { Product } from "@/lib/types";
import { SoloCheckout } from "@/components/product/SoloCheckout";

function SoloOnlyCheckout({ product }: { product: Product }) {
  return <SoloCheckout product={product} />;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await fetchProductById(id).catch(() => null);
  if (!product) notFound();

  const activeSquad = product.dualCheckoutEnabled ? await fetchActiveSquadForProduct(product._id) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} alt={product.title} />

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-oceanic">{product.category}</span>
          <h1 className="mt-2 font-heading text-2xl font-bold text-slate-900">{product.title}</h1>
          <p className="mt-3 text-sm text-slate-500">{product.description}</p>

          {product.dualCheckoutEnabled ? (
            <DualCheckout product={product} activeSquad={activeSquad} />
          ) : (
            <SoloOnlyCheckout product={product} />
          )}
        </div>
      </div>
    </div>
  );
}
