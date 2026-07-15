"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { WhatsAppLoginModal } from "./WhatsAppLoginModal";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Offers", href: "/squads" },
  { label: "Become a Supplier", href: "/supplier/register" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-oceanic text-sm font-bold text-white">
              D
            </span>
            <span className="font-heading text-lg font-bold text-slate-900">
              DiscountBazaar<span className="text-oceanic">.PK</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-oceanic"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search — centered, flexible width */}
          <form onSubmit={handleSearch} className="mx-auto hidden w-full max-w-xs lg:flex">
            <div className="relative w-full">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search products or Squads..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 focus:border-oceanic focus:bg-white focus:outline-none"
              />
            </div>
          </form>

          {/* Cart + Auth */}
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/products" className="relative text-slate-600 hover:text-oceanic" aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
                <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-mint text-[10px] font-bold text-oceanic-dark">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={user.role === "Admin" ? "/admin" : user.role === "Supplier" ? "/supplier" : "/dashboard"}
                  className="hidden text-sm font-medium text-slate-600 hover:text-oceanic sm:inline"
                >
                  {user.role === "Admin" ? "Admin Console" : user.role === "Supplier" ? "Supplier Portal" : "Dashboard"}
                </Link>
                <button
                  onClick={logout}
                  className="rounded-full border border-oceanic px-4 py-1.5 text-sm font-medium text-oceanic transition hover:bg-oceanic hover:text-white"
                >
                  {user.name.split(" ")[0]} · Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <WhatsAppLoginModal />
    </>
  );
}
