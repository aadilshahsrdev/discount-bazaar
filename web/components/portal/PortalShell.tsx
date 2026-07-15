"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import type { ReactNode } from "react";

export interface PortalTab {
  id: string;
  label: string;
  icon?: string;
}

interface PortalShellProps {
  title: string;
  subtitle: string;
  tabs: PortalTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export function PortalShell({ title, subtitle, tabs, activeTab, onTabChange, children }: PortalShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col bg-oceanic text-white shadow-2xl">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/" className="font-heading text-lg font-bold tracking-tight">
            DiscountBazaar<span className="text-mint">.PK</span>
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">{title}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon && <span className="text-base leading-none">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold uppercase">
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-white/50">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-4 w-full rounded-lg border border-white/20 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">
                {tabs.find((t) => t.id === activeTab)?.label ?? title}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xs font-medium text-slate-500 transition hover:text-oceanic"
              >
                View Storefront
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-oceanic/10 text-xs font-bold text-oceanic">
                  {user?.name?.charAt(0) ?? "?"}
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
