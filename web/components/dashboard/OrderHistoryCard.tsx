/* eslint-disable @next/next/no-img-element */
"use client";

import { formatPKR } from "@/lib/format";
import { useIsMounted } from "@/lib/useIsMounted";
import type { Order } from "@/lib/types";
import { OrderTimeline } from "./OrderTimeline";

export function OrderHistoryCard({ order }: { order: Order }) {
  const mounted = useIsMounted();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-16">
          {order.productId.images[0] && (
            <img src={order.productId.images[0]} alt={order.productId.title} className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium text-slate-800">{order.productId.title}</p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {order.purchaseType === "Squad" ? "Squad order" : "Solo order"}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">{formatPKR(order.totals.total)}</p>
          <p className="text-xs text-slate-400">
            {mounted ? new Date(order.createdAt).toLocaleDateString("en-PK") : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <OrderTimeline status={order.logisticsStatus} />
      </div>
    </div>
  );
}
