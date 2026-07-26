### Task 3: StoreLayout Tailwind migration

**Files:**
- Modify: `apps/web/src/components/StoreLayout.tsx`

**Interfaces:**
- Consumes: token utilities; `useAuth` for customer bell gate (Task 9)
- Produces: Tailwind store chrome matching current look

- [ ] **Step 1: Rewrite `StoreLayout.tsx`**

```tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Bell } from "lucide-react";
import { useCart } from "../features/cart/CartContext";
import { useAuth } from "../features/auth/AuthContext";

export function StoreLayout() {
  const { count } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-cognac px-4 py-2 text-center text-[13px] font-semibold text-[#FBEEE4]">
        Monsoon Sale Â· Flat 20% off Travel &amp; Office ranges Â· Free shipping over â‚¹999
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/92 backdrop-blur-[8px]">
        <div className="mx-auto flex max-w-[1240px] items-center gap-7 px-7 py-4">
          <Link to="/" className="flex items-center gap-2.5 text-ink hover:text-ink">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-ink font-display text-lg font-extrabold text-tan">
              B
            </span>
            <span className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-ink">Baxparrow</span>
          </Link>
          <nav className="flex gap-[22px] text-sm font-medium">
            {["Shop All", "Travel", "Office", "Leather"].map((x) => (
              <NavLink key={x} to="/shop" className="text-text2 hover:text-cognac">
                {x}
              </NavLink>
            ))}
            <NavLink to="/shop" className="font-semibold text-cognac">
              Wholesale
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => nav("/search")}
              className="flex min-w-[200px] cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2 text-[13px] text-muted2"
            >
              <Search size={15} /> Search 1,000+ bagsâ€¦
            </button>
            {user && (
              <button type="button" className="relative cursor-pointer border-0 bg-transparent text-text2" aria-label="Notifications">
                {/* TASK 9: replace with <NotificationBell /> */}
                <Bell size={20} />
              </button>
            )}
            <button type="button" className="cursor-pointer border-0 bg-transparent text-text2">
              <Heart size={20} />
            </button>
            <button
              type="button"
              onClick={() => nav("/cart")}
              className="relative cursor-pointer border-0 bg-transparent text-ink"
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
      <main className="animate-bxfade">
        <Outlet />
      </main>
      <footer className="mt-5 bg-ink text-[#CDC4BA]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-[1.6fr_1fr_1fr_1fr] gap-9 px-7 pt-12 pb-8">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-tan font-display font-extrabold text-ink">
                B
              </span>
              <span className="font-display text-xl font-extrabold text-bg">Baxparrow</span>
            </div>
            <p className="m-0 max-w-[280px] text-[13.5px] leading-[1.6]">
              Manufacturer &amp; wholesaler of bags â€” Byculla, Mumbai. Carry with confidence.
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
        <div className="border-t border-[#2E2A25] px-7 py-4.5 text-center font-mono text-[12.5px] text-[#8A8178]">
          Â© 2026 Baxparrow Â· Made in Mumbai Â· Payments secured by Razorpay
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Visual spot-check home**

Open `/` â€” header, promo bar, footer match prior look; no inline `t.` imports.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add apps/web/src/components/StoreLayout.tsx
git commit -m "refactor(store): migrate StoreLayout to Tailwind tokens"
```

---


## Extra
- DO NOT commit.

