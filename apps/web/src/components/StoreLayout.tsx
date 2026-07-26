import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "../features/cart/CartContext";
import { useAuth } from "../features/auth/AuthContext";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { api } from "../lib/api";
import { SmoothScroll } from "./SmoothScroll";

const NAV = [
  { label: "Shop All", to: "/shop" },
  { label: "Travel", to: "/shop?category=Travel%20Bags" },
  { label: "Office", to: "/shop?category=Office%20Bags" },
  { label: "Leather", to: "/shop?category=Leather%20Bags" },
] as const;

type PublicSettings = {
  promoEnabled: boolean;
  promoText: string;
};

export function StoreLayout() {
  const { count } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);

  const navActive = (to: string) => {
    const want = new URL(to, "http://local");
    if (location.pathname !== want.pathname) return false;
    const wantCat = want.searchParams.get("category");
    const haveCat = new URLSearchParams(location.search).get("category");
    if (!wantCat) return !haveCat;
    return haveCat === wantCat;
  };
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/settings")).data as PublicSettings,
    staleTime: 60_000,
  });

  const showPromo =
    !settings || (settings.promoEnabled && (settings.promoText ?? "").trim().length > 0);
  const promoText =
    settings?.promoText?.trim() ||
    "Monsoon Sale · Flat 20% off Travel & Office ranges · Free shipping over ₹999";

  return (
    <SmoothScroll>
    <div className="min-h-screen bg-bg">
      {showPromo && (
        <div className="bg-cognac px-4 py-2 text-center text-[12px] font-semibold text-[#FBEEE4] sm:text-[13px]">
          {promoText}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/92 backdrop-blur-[8px]">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-3 sm:gap-7 sm:px-7 sm:py-4">
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-1 text-ink md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center gap-2.5 text-ink hover:text-ink">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-ink font-display text-lg font-extrabold text-tan">
              B
            </span>
            <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-[22px]">
              Baxparrow
            </span>
          </Link>
          <nav className="ml-2 hidden gap-[22px] text-sm font-medium md:flex">
            {NAV.map((x) => (
              <Link
                key={x.label}
                to={x.to}
                className={`transition-colors duration-200 hover:text-cognac ${
                  navActive(x.to) ? "font-semibold text-cognac" : "text-text2"
                }`}
              >
                {x.label}
              </Link>
            ))}
            <NavLink to="/contact" className="font-semibold text-cognac">
              Wholesale
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3.5">
            <button
              type="button"
              onClick={() => nav("/search")}
              className="hidden cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2 text-[13px] text-muted2 transition-colors duration-200 hover:border-cognac/40 sm:flex sm:min-w-[200px]"
            >
              <Search size={15} /> Search 1,000+ bags…
            </button>
            <button
              type="button"
              onClick={() => nav("/search")}
              className="cursor-pointer border-0 bg-transparent p-1 text-text2 sm:hidden"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            {user && <NotificationBell scope="customer" />}
            <button
              type="button"
              onClick={() => nav("/cart")}
              className="relative cursor-pointer border-0 bg-transparent p-1 text-ink"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2 grid h-[17px] min-w-[17px] place-items-center rounded-lg bg-cognac px-1 font-mono text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 md:hidden ${
          mobileNav ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileNav(false)}
        aria-hidden
      />
      <div
        className={`fixed inset-y-0 left-0 z-[60] flex w-[280px] max-w-[85vw] flex-col bg-card p-5 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          mobileNav ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!mobileNav}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-lg font-extrabold text-ink">Menu</span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-1"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((x) => (
            <NavLink
              key={x.label}
              to={x.to}
              onClick={() => setMobileNav(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-text2 transition-colors duration-200 hover:bg-subtle"
            >
              {x.label}
            </NavLink>
          ))}
          <NavLink
            to="/contact"
            onClick={() => setMobileNav(false)}
            className="rounded-lg px-3 py-3 text-sm font-semibold text-cognac"
          >
            Wholesale
          </NavLink>
          <NavLink
            to="/search"
            onClick={() => setMobileNav(false)}
            className="rounded-lg px-3 py-3 text-sm font-medium text-text2 transition-colors duration-200 hover:bg-subtle"
          >
            Search
          </NavLink>
        </nav>
      </div>

      <main className="animate-bxfade">
        <Outlet />
      </main>
      <footer className="mt-5 bg-ink text-[#CDC4BA]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 pt-10 pb-8 sm:grid-cols-2 sm:px-7 sm:pt-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-9">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-tan font-display font-extrabold text-ink">
                B
              </span>
              <span className="font-display text-xl font-extrabold text-bg">Baxparrow</span>
            </div>
            <p className="m-0 max-w-[280px] text-[13.5px] leading-[1.6]">
              Manufacturer &amp; wholesaler of bags — Byculla, Mumbai. Carry with confidence.
            </p>
          </div>
          {(
            [
              ["Shop", ["Backpacks", "Office & Laptop", "Travel & Luggage", "Leather"]],
              ["Company", ["About", "Wholesale", "Track order", "Contact"]],
              ["Support", ["Shipping", "Returns", "Warranty", "FAQ"]],
            ] as const
          ).map(([h, items]) => (
            <div key={h}>
              <div className="mb-3 text-sm font-bold text-bg">{h}</div>
              <div className="flex flex-col gap-2 text-[13.5px]">
                {items.map((i) => (
                  <span key={i}>{i}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#2E2A25] px-4 py-4 text-center font-mono text-[12px] text-[#8A8178] sm:px-7 sm:text-[12.5px]">
          © 2026 Baxparrow · Made in Mumbai · Payments secured by Razorpay
        </div>
      </footer>
    </div>
    </SmoothScroll>
  );
}
