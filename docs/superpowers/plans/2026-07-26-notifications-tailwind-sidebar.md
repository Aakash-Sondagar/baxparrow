# Notifications + Tailwind Tokens + Sidebar Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship end-to-end in-app notifications for admins and customers, fix the admin sidebar toggle, and migrate all `apps/web` styling to Tailwind backed by design tokens.

**Architecture:** Mongo `Notification` documents written at domain event sites; REST list/count/mark-read APIs; React Query polls every 30s into a shared `NotificationBell`. Design tokens move from `tokens.ts` into CSS variables + Tailwind `@theme`. Admin sidebar becomes a single instance that fully hides/shows (desktop) or drawers (mobile).

**Tech Stack:** Express + Mongoose + Zod (`apps/api`, `packages/shared`); React 18 + Vite + TanStack Query + Tailwind CSS v4 (`apps/web`); `node:test` for pure helper tests.

## Global Constraints

- Delivery: poll only (no SSE/WebSockets); `refetchInterval: 30_000`
- Audience: admins + logged-in customers; guests get no customer bell
- Activity types: `order.new` | `order.paid` | `order.status` | `inventory.low` | `inventory.out` | `product.created` | `product.updated` | `product.deleted` | `bulk.completed` | `system`
- Low-stock threshold: **`<= 10`** (match existing `metrics` in `admin.controller.ts`); out-of-stock: `=== 0`
- Guest checkout orders: notify admins only (no customer user id)
- Tailwind scope: entire `apps/web` (admin + storefront); preserve current visual palette
- Desktop sidebar: fully hide/show (not icon-rail); persist preference in `localStorage` key `bx_admin_sidebar`
- Spec: `docs/superpowers/specs/2026-07-26-admin-notifications-tailwind-design.md`
- Do not commit unless the user explicitly asks (user rule overrides plan commit steps — skip commit steps or ask first)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `apps/web/src/styles/global.css` | Tailwind import, CSS variables, `@theme`, base |
| `apps/web/src/styles/tokens.ts` | Keep only `tile()`; re-export CSS var names if needed; remove color object usage from UI |
| `apps/web/package.json` | Add `tailwindcss` `@tailwindcss/vite` |
| `apps/web/vite.config.ts` | Register Tailwind Vite plugin |
| `apps/web/src/routes/admin/AdminLayout.tsx` | Single sidebar + toggle + admin bell slot |
| `apps/web/src/components/StoreLayout.tsx` | Store chrome + customer bell when logged in |
| `apps/web/src/features/notifications/*` | Types, API, hooks, `NotificationBell` |
| `packages/shared/src/index.ts` | `NOTIFICATION_TYPES`, optional response helpers |
| `apps/api/src/models/Notification.ts` | Mongoose model |
| `apps/api/src/services/notify.service.ts` | `notifyUsers`, `notifyAdmins`, stock crossing helper |
| `apps/api/src/controllers/notification.controller.ts` | list / unread-count / read / read-all |
| `apps/api/src/routes/index.ts` | Mount notification routes |
| Controllers: order, product, admin | Emit notifications after successful mutations |
| `apps/api/src/services/notify.service.test.ts` | `node:test` for stock-threshold helper |

---

### Task 1: Tailwind v4 + design tokens

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/styles/tokens.ts`

**Interfaces:**
- Produces: Tailwind utilities `bg-canvas`, `bg-admin-canvas`, `bg-bg`, `bg-ink`, `text-ink`, `bg-cognac`, `text-cognac`, `bg-cognac-dark`, `bg-tan`, `bg-card`, `border-border`, `bg-subtle`, `text-text`, `text-text2`, `text-text3`, `text-muted`, `text-muted2`, `text-green`, `bg-green-bg`, `text-amber`, `text-danger`, `font-display`, `font-body`, `font-mono`; `tile(n)` still exported from `tokens.ts`

- [ ] **Step 1: Install Tailwind packages in `apps/web`**

Run from repo root:

```bash
pnpm --filter @baxparrow/web add -D tailwindcss @tailwindcss/vite
```

Expected: packages appear in `apps/web/package.json` `devDependencies`.

- [ ] **Step 2: Register Vite plugin**

Replace `apps/web/vite.config.ts` with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@baxparrow/shared": fileURLToPath(new URL("../../packages/shared/src", import.meta.url)),
    },
  },
  server: { port: 5173 },
});
```

- [ ] **Step 3: Rewrite `global.css` with tokens + `@theme`**

Replace `apps/web/src/styles/global.css` with:

```css
@import "tailwindcss";

:root {
  --color-bg: #f7f4ef;
  --color-canvas: #ede8e0;
  --color-admin-canvas: #f4f1ec;
  --color-ink: #1c1917;
  --color-cognac: #a94d28;
  --color-cognac-dark: #8f3f20;
  --color-tan: #e8b58c;
  --color-card: #ffffff;
  --color-border: #e7e2d9;
  --color-subtle: #faf7f2;
  --color-text: #292524;
  --color-text2: #44403c;
  --color-text3: #57534e;
  --color-muted: #78716c;
  --color-muted2: #a8a29e;
  --color-green: #3f7d5b;
  --color-green-bg: #eaf3ed;
  --color-amber: #b4772a;
  --color-danger: #b4523a;
  --font-display: "Archivo", sans-serif;
  --font-body: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "Space Mono", monospace;
}

@theme {
  --color-bg: var(--color-bg);
  --color-canvas: var(--color-canvas);
  --color-admin-canvas: var(--color-admin-canvas);
  --color-ink: var(--color-ink);
  --color-cognac: var(--color-cognac);
  --color-cognac-dark: var(--color-cognac-dark);
  --color-tan: var(--color-tan);
  --color-card: var(--color-card);
  --color-border: var(--color-border);
  --color-subtle: var(--color-subtle);
  --color-text: var(--color-text);
  --color-text2: var(--color-text2);
  --color-text3: var(--color-text3);
  --color-muted: var(--color-muted);
  --color-muted2: var(--color-muted2);
  --color-green: var(--color-green);
  --color-green-bg: var(--color-green-bg);
  --color-amber: var(--color-amber);
  --color-danger: var(--color-danger);
  --font-family-display: var(--font-display);
  --font-family-body: var(--font-body);
  --font-family-mono: var(--font-mono);
}

@layer base {
  * {
    box-sizing: border-box;
  }
  html,
  body {
    margin: 0;
    padding: 0;
  }
  body {
    font-family: var(--font-body);
    color: var(--color-ink);
    background: var(--color-canvas);
    -webkit-font-smoothing: antialiased;
  }
  a {
    color: var(--color-cognac);
    text-decoration: none;
  }
  a:hover {
    color: var(--color-cognac-dark);
  }
  button,
  input,
  textarea,
  select {
    font-family: inherit;
  }
}

@keyframes bxfade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@utility animate-bxfade {
  animation: bxfade 0.3s ease;
}
```

- [ ] **Step 4: Slim `tokens.ts` to `tile` only**

Replace `apps/web/src/styles/tokens.ts` with:

```ts
/** Product placeholder gradients — not expressible as static Tailwind utilities. */
export const tile = (n: number) => {
  const pal = [
    ["#E7D8C6", "#DFCCB5"],
    ["#DDE2E0", "#D2D8D6"],
    ["#EEE0CE", "#E6D5BF"],
    ["#E7CDB6", "#DDBFA3"],
    ["#DDE6DD", "#D0DBCF"],
    ["#DBDEE6", "#CED3DE"],
    ["#F0E6CC", "#EADCB8"],
    ["#DEDCD8", "#D3D0CB"],
    ["#EEDCDA", "#E5CDCB"],
  ];
  const [a, b] = pal[n % pal.length];
  return `repeating-linear-gradient(135deg,${a},${a} 12px,${b} 12px,${b} 24px)`;
};
```

Note: later tasks remove all `import { t } from ...tokens` usages. After this step alone, the app may temporarily break until layouts are converted — proceed immediately to Task 2–5 in the same session, or keep a temporary re-export of `t` until conversions finish. Preferred: keep temporary compatibility export during migration:

```ts
/** @deprecated Remove after Tailwind migration completes */
export const t = {
  bg: "var(--color-bg)",
  canvas: "var(--color-canvas)",
  adminCanvas: "var(--color-admin-canvas)",
  ink: "var(--color-ink)",
  cognac: "var(--color-cognac)",
  cognacDark: "var(--color-cognac-dark)",
  tan: "var(--color-tan)",
  card: "var(--color-card)",
  border: "var(--color-border)",
  subtle: "var(--color-subtle)",
  text: "var(--color-text)",
  text2: "var(--color-text2)",
  text3: "var(--color-text3)",
  muted: "var(--color-muted)",
  muted2: "var(--color-muted2)",
  green: "var(--color-green)",
  greenBg: "var(--color-green-bg)",
  amber: "var(--color-amber)",
  danger: "var(--color-danger)",
  displayFont: "var(--font-display)",
  bodyFont: "var(--font-body)",
  monoFont: "var(--font-mono)",
};
```

Delete the deprecated `t` object only after zero imports remain (end of Task 5).

- [ ] **Step 5: Smoke-check Vite starts**

Run: `pnpm --filter @baxparrow/web dev`  
Expected: server on `:5173` without Tailwind/Vite plugin errors. Stop after confirm.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/vite.config.ts apps/web/src/styles/global.css apps/web/src/styles/tokens.ts
git commit -m "chore(web): add Tailwind v4 and CSS design tokens"
```

---

### Task 2: AdminLayout Tailwind + working sidebar toggle

**Files:**
- Modify: `apps/web/src/routes/admin/AdminLayout.tsx`

**Interfaces:**
- Consumes: Tailwind token utilities from Task 1
- Produces: working `sidebarOpen` toggle; slot ready for `<NotificationBell />` (Task 9 can drop in)

- [ ] **Step 1: Rewrite `AdminLayout.tsx` with single sidebar**

Replace file contents with:

```tsx
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, FolderTree, Upload, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
// NotificationBell wired in Task 9 — temporary placeholder button until then
import { Bell } from "lucide-react";

const NAV = [
  ["/admin/dashboard", "Dashboard", LayoutDashboard],
  ["/admin/products", "Products", Package],
  ["/admin/orders", "Orders", ShoppingCart],
  ["/admin/categories", "Categories", FolderTree],
  ["/admin/products/bulk", "Bulk upload", Upload],
] as const;

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  categories: "Categories",
  bulk: "Bulk upload",
  new: "Add product",
};

const SIDEBAR_KEY = "bx_admin_sidebar";

export function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const key = loc.pathname.split("/").pop() || "dashboard";

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === null) return true;
    return stored === "1";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  // On mobile, start closed when crossing below lg
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (!mq.matches) setSidebarOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/admin");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
      isActive ? "bg-[#3A3229] font-semibold text-bg" : "font-medium text-[#CDC4BA]"
    }`;

  const sidebar = (
    <aside className="flex h-full w-[236px] shrink-0 flex-col bg-ink px-4 py-5.5 text-[#CDC4BA]">
      <div className="mb-5.5 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-tan font-display text-base font-extrabold text-ink">
            B
          </span>
          <div>
            <div className="font-display text-base font-extrabold text-bg">Baxparrow</div>
            <div className="font-mono text-[11px] text-[#8A8178]">ADMIN</div>
          </div>
        </div>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-1 text-[#CDC4BA] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      {NAV.map(([to, label, Icon]) => (
        <NavLink key={to} to={to} end onClick={() => {
          if (window.matchMedia("(max-width: 1023px)").matches) setSidebarOpen(false);
        }} className={linkClass}>
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#2E2A25] px-2.5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3A3229] font-display font-bold text-tan">
            {initial}
          </span>
          <div className="min-w-0 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">
            <div className="overflow-hidden font-semibold text-ellipsis text-bg">{user?.name || "Admin"}</div>
            <div className="overflow-hidden text-[11px] text-ellipsis text-[#8A8178]">{user?.email || "Store owner"}</div>
          </div>
        </div>
        <button
          type="button"
          title="Log out"
          onClick={handleLogout}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1.5 text-[#CDC4BA]"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="relative flex min-h-screen bg-admin-canvas">
      {/* Desktop sidebar */}
      <div className={`hidden shrink-0 lg:block ${sidebarOpen ? "" : "lg:hidden"}`}>
        {sidebar}
      </div>

      {/* Mobile overlay + drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-90 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-100 transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3.5 border-b border-border bg-card px-5 py-3.5">
          <button
            type="button"
            title="Toggle Menu"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex cursor-pointer items-center border-0 bg-transparent p-1 text-ink"
            aria-expanded={sidebarOpen}
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>
          <h1 className="m-0 font-display text-xl font-bold text-ink">{TITLES[key] ?? "Admin"}</h1>
          <div className="ml-auto flex items-center gap-3">
            {/* TASK 9: replace with <NotificationBell /> */}
            <button type="button" className="relative cursor-pointer border-0 bg-transparent" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
```

Note on Tailwind v4: if `z-90` / `z-100` / `py-5.5` are not generated, use `z-[90]`, `z-[100]`, `py-[22px]` instead.

- [ ] **Step 2: Manually verify toggle**

Run web app, open `/admin/dashboard` (logged in as admin):

1. Desktop ≥1024px: click hamburger → sidebar fully disappears; click again → returns; refresh keeps preference
2. Narrow viewport: hamburger opens drawer + overlay; X / overlay / nav link closes it

Expected: no second ghost sidebar; close button visible on mobile.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add apps/web/src/routes/admin/AdminLayout.tsx
git commit -m "fix(admin): single sidebar toggle with Tailwind layout"
```

---

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
        Monsoon Sale · Flat 20% off Travel &amp; Office ranges · Free shipping over ₹999
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
              <Search size={15} /> Search 1,000+ bags…
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
        <div className="border-t border-[#2E2A25] px-7 py-4.5 text-center font-mono text-[12.5px] text-[#8A8178]">
          © 2026 Baxparrow · Made in Mumbai · Payments secured by Razorpay
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Visual spot-check home**

Open `/` — header, promo bar, footer match prior look; no inline `t.` imports.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add apps/web/src/components/StoreLayout.tsx
git commit -m "refactor(store): migrate StoreLayout to Tailwind tokens"
```

---

### Task 4: Convert remaining admin pages to Tailwind

**Files:**
- Modify: `apps/web/src/routes/admin/Dashboard.tsx`
- Modify: `apps/web/src/routes/admin/Products.tsx`
- Modify: `apps/web/src/routes/admin/ProductForm.tsx`
- Modify: `apps/web/src/routes/admin/Orders.tsx`
- Modify: `apps/web/src/routes/admin/Categories.tsx`
- Modify: `apps/web/src/routes/admin/BulkUpload.tsx`
- Modify: `apps/web/src/routes/admin/AdminLogin.tsx`
- Modify: `apps/web/src/routes/admin/ProtectedAdmin.tsx` (only if it has styles)

**Interfaces:**
- Consumes: token utilities; no `t.` color/font imports

**Conversion map (apply everywhere):**

| Old | New |
|-----|-----|
| `t.adminCanvas` / `t.bg` / `t.canvas` | `bg-admin-canvas` / `bg-bg` / `bg-canvas` |
| `t.ink` | `text-ink` / `bg-ink` |
| `t.cognac` | `text-cognac` / `bg-cognac` |
| `t.card` + border | `bg-card border border-border rounded-[14px]` |
| `t.displayFont` | `font-display` |
| `t.monoFont` | `font-mono` |
| `t.green` / `t.amber` | `text-green` / `text-amber` |
| inline padding/flex | Tailwind spacing/flex utilities |

- [ ] **Step 1: Convert `Dashboard.tsx` first as the reference**

Remove `import { t } from ...`. Replace every `style={{...}}` with className utilities using the map above. Keep Recharts colors as hex props if the chart API requires strings (`#A94D28`, `#E7E2D9`).

- [ ] **Step 2: Convert remaining admin route files the same way**

For each file listed above: delete `t` import (if present), replace inline styles with utilities. Keep behavior unchanged.

- [ ] **Step 3: Grep for leftover admin inline tokens**

Run:

```bash
rg "from [\"'].*styles/tokens|style=\{\{" apps/web/src/routes/admin -n
```

Expected: no `tokens` imports except possibly none; `style={{` only for dynamic chart/widths if unavoidable — prefer Tailwind arbitrary values.

- [ ] **Step 4: Spot-check admin pages**

Visit dashboard, products, orders, categories, bulk, login — layout intact.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add apps/web/src/routes/admin
git commit -m "refactor(admin): migrate admin pages to Tailwind"
```

---

### Task 5: Convert storefront pages + shared components

**Files:**
- Modify: `apps/web/src/routes/store/Home.tsx`
- Modify: `apps/web/src/routes/store/Listing.tsx`
- Modify: `apps/web/src/routes/store/Product.tsx`
- Modify: `apps/web/src/routes/store/Cart.tsx`
- Modify: `apps/web/src/routes/store/Checkout.tsx`
- Modify: `apps/web/src/routes/store/Confirm.tsx`
- Modify: `apps/web/src/routes/store/Search.tsx`
- Modify: `apps/web/src/routes/store/Track.tsx`
- Modify: `apps/web/src/components/ProductCard.tsx`
- Modify: `apps/web/src/routes/admin/AdminLogin.tsx` if missed
- Modify: `apps/web/src/styles/tokens.ts` — remove deprecated `t` when unused

**Interfaces:**
- Consumes: `tile()` from `tokens.ts` for placeholders only

- [ ] **Step 1: Convert `ProductCard.tsx` and `Home.tsx`**

Use `tile(n)` via `style={{ backgroundImage: tile(i) }}` only for the gradient placeholder (allowed exception). All other styling via Tailwind.

- [ ] **Step 2: Convert remaining store routes**

Same conversion map as Task 4.

- [ ] **Step 3: Remove deprecated `t` from `tokens.ts`**

Confirm zero imports:

```bash
rg "\bt\b.*tokens|from [\"'].*tokens[\"']" apps/web/src -n
```

Expected: only `tile` imports. Then delete the deprecated `t` object from `tokens.ts`, leaving only `tile`.

- [ ] **Step 4: Build web**

Run: `pnpm --filter @baxparrow/web build`  
Expected: `tsc && vite build` succeeds.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add apps/web/src
git commit -m "refactor(web): finish Tailwind migration for storefront"
```

---

### Task 6: Shared types + notify service + model

**Files:**
- Modify: `packages/shared/src/index.ts`
- Create: `apps/api/src/models/Notification.ts`
- Create: `apps/api/src/services/notify.service.ts`
- Create: `apps/api/src/services/notify.service.test.ts`

**Interfaces:**
- Produces:
  - `NOTIFICATION_TYPES` const + `NotificationType` type in shared
  - `stockCrossing(prev: number, next: number): "inventory.out" | "inventory.low" | null`
  - `notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void>`
  - `notifyAdmins(payload: NotifyPayload): Promise<void>`
  - `LOW_STOCK_THRESHOLD = 10`

- [ ] **Step 1: Write failing test for stock crossing**

Create `apps/api/src/services/notify.service.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stockCrossing } from "./notify.service.js";

describe("stockCrossing", () => {
  it("emits inventory.out when crossing to 0", () => {
    assert.equal(stockCrossing(3, 0), "inventory.out");
  });
  it("emits inventory.low when crossing into <=10 from above", () => {
    assert.equal(stockCrossing(15, 8), "inventory.low");
  });
  it("returns null when staying low without hitting 0", () => {
    assert.equal(stockCrossing(8, 5), null);
  });
  it("returns null when increasing stock", () => {
    assert.equal(stockCrossing(2, 20), null);
  });
  it("prefers out over low when landing on 0 from above threshold", () => {
    assert.equal(stockCrossing(15, 0), "inventory.out");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run from `apps/api`:

```bash
pnpm exec tsx --test src/services/notify.service.test.ts
```

Expected: FAIL — cannot find module / `stockCrossing` not exported.

- [ ] **Step 3: Add shared notification types**

Append to `packages/shared/src/index.ts`:

```ts
export const NOTIFICATION_TYPES = [
  "order.new",
  "order.paid",
  "order.status",
  "inventory.low",
  "inventory.out",
  "product.created",
  "product.updated",
  "product.deleted",
  "bulk.completed",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
```

- [ ] **Step 4: Create model + service**

`apps/api/src/models/Notification.ts`:

```ts
import { Schema, model, Types } from "mongoose";
import { NOTIFICATION_TYPES } from "@baxparrow/shared";

const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String },
    meta: { type: Schema.Types.Mixed },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

export const Notification = model("Notification", notificationSchema);
```

`apps/api/src/services/notify.service.ts`:

```ts
import { Types } from "mongoose";
import type { NotificationType } from "@baxparrow/shared";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

export const LOW_STOCK_THRESHOLD = 10;

export type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
};

/** Pure helper: emit only on threshold crossing to avoid spam. */
export function stockCrossing(prev: number, next: number): "inventory.out" | "inventory.low" | null {
  if (next === 0 && prev > 0) return "inventory.out";
  if (next > 0 && next <= LOW_STOCK_THRESHOLD && prev > LOW_STOCK_THRESHOLD) return "inventory.low";
  return null;
}

export async function notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  await Notification.insertMany(
    unique.map((id) => ({
      user: new Types.ObjectId(id),
      ...payload,
      readAt: null,
    }))
  );
}

export async function notifyAdmins(payload: NotifyPayload): Promise<void> {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await notifyUsers(
    admins.map((a) => String(a._id)),
    payload
  );
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
pnpm exec tsx --test src/services/notify.service.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add packages/shared/src/index.ts apps/api/src/models/Notification.ts apps/api/src/services/notify.service.ts apps/api/src/services/notify.service.test.ts
git commit -m "feat(api): add Notification model and notify helpers"
```

---

### Task 7: Notification HTTP API

**Files:**
- Create: `apps/api/src/controllers/notification.controller.ts`
- Modify: `apps/api/src/routes/index.ts`

**Interfaces:**
- Consumes: `Notification` model; `auth` middleware
- Produces:
  - `GET /notifications` → `{ items: NotificationDoc[] }`
  - `GET /notifications/unread-count` → `{ count: number }`
  - `PATCH /notifications/:id/read` → updated doc or 404
  - `POST /notifications/read-all` → `{ ok: true }`

- [ ] **Step 1: Implement controller**

```ts
import type { Response } from "express";
import type { AuthReq } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

export async function list(req: AuthReq, res: Response) {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const items = await Notification.find({ user: req.user!.id })
    .sort("-createdAt")
    .limit(limit);
  res.json({ items });
}

export async function unreadCount(req: AuthReq, res: Response) {
  const count = await Notification.countDocuments({ user: req.user!.id, readAt: null });
  res.json({ count });
}

export async function markRead(req: AuthReq, res: Response) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { readAt: new Date() },
    { new: true }
  );
  if (!n) return res.status(404).json({ error: "Not found" });
  res.json(n);
}

export async function markAllRead(req: AuthReq, res: Response) {
  await Notification.updateMany(
    { user: req.user!.id, readAt: null },
    { readAt: new Date() }
  );
  res.json({ ok: true });
}
```

- [ ] **Step 2: Mount routes in `apps/api/src/routes/index.ts`**

Add import:

```ts
import * as N from "../controllers/notification.controller.js";
```

Add before `export default r`:

```ts
// notifications (any authenticated role)
r.get("/notifications", auth, N.list);
r.get("/notifications/unread-count", auth, N.unreadCount);
r.patch("/notifications/:id/read", auth, N.markRead);
r.post("/notifications/read-all", auth, N.markAllRead);
```

- [ ] **Step 3: Manual API smoke (with admin JWT)**

With API running and a valid Bearer token:

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/v1/notifications/unread-count
```

Expected: `{"count":0}` (or a number).

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add apps/api/src/controllers/notification.controller.ts apps/api/src/routes/index.ts
git commit -m "feat(api): notification list and read endpoints"
```

---

### Task 8: Emit notifications from domain controllers

**Files:**
- Modify: `apps/api/src/controllers/order.controller.ts`
- Modify: `apps/api/src/controllers/admin.controller.ts`
- Modify: `apps/api/src/controllers/product.controller.ts`

**Interfaces:**
- Consumes: `notifyAdmins`, `notifyUsers`, `stockCrossing` from `notify.service.ts`

- [ ] **Step 1: Emit on order create + payment verify**

In `createOrder`, after `Order.create` succeeds, before `res.status(201)`:

```ts
import { notifyAdmins, notifyUsers } from "../services/notify.service.js";

// after order created:
await notifyAdmins({
  type: "order.new",
  title: "New order",
  body: `Order ${orderNo} placed · ₹${amounts.total}`,
  href: "/admin/orders",
  meta: { orderNo },
});
if (req.user?.id) {
  await notifyUsers([req.user.id], {
    type: "order.new",
    title: "Order placed",
    body: `We received order ${orderNo}`,
    href: `/track/${orderNo}`,
    meta: { orderNo },
  });
}
```

In `verifyPayment`, after `order.save()`:

```ts
await notifyAdmins({
  type: "order.paid",
  title: "Payment received",
  body: `Order ${order.orderNo} paid · ₹${order.amounts?.total ?? 0}`,
  href: "/admin/orders",
  meta: { orderNo: order.orderNo },
});
if (order.user) {
  await notifyUsers([String(order.user)], {
    type: "order.paid",
    title: "Payment confirmed",
    body: `Payment for ${order.orderNo} is confirmed`,
    href: `/track/${order.orderNo}`,
    meta: { orderNo: order.orderNo },
  });
}
```

- [ ] **Step 2: Emit on status change**

In `updateOrderStatus` after save:

```ts
import { notifyAdmins, notifyUsers } from "../services/notify.service.js";

await notifyAdmins({
  type: "order.status",
  title: "Order status updated",
  body: `${order.orderNo} → ${order.status}`,
  href: "/admin/orders",
  meta: { orderNo: order.orderNo, status: order.status },
});
if (order.user) {
  await notifyUsers([String(order.user)], {
    type: "order.status",
    title: "Order update",
    body: `Your order ${order.orderNo} is now ${order.status}`,
    href: `/track/${order.orderNo}`,
    meta: { orderNo: order.orderNo, status: order.status },
  });
}
```

- [ ] **Step 3: Emit on product CRUD + stock crossings**

In `create` after create:

```ts
await notifyAdmins({
  type: "product.created",
  title: "Product created",
  body: p.name,
  href: "/admin/products",
  meta: { productId: String(p._id) },
});
```

In `update`: load previous stock before update; after update call `stockCrossing(prevStock, p.stock ?? 0)` and if non-null notify admins with that type; always emit `product.updated`.

```ts
const prev = await Product.findById(req.params.id);
const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
if (!p) return res.status(404).json({ error: "Not found" });
await notifyAdmins({
  type: "product.updated",
  title: "Product updated",
  body: p.name,
  href: "/admin/products",
  meta: { productId: String(p._id) },
});
const cross = stockCrossing(prev?.stock ?? 0, p.stock ?? 0);
if (cross) {
  await notifyAdmins({
    type: cross,
    title: cross === "inventory.out" ? "Out of stock" : "Low stock",
    body: `${p.name} · stock ${p.stock}`,
    href: "/admin/products",
    meta: { productId: String(p._id), stock: p.stock },
  });
}
res.json(p);
```

In `remove` before delete (or after fetch):

```ts
const p = await Product.findByIdAndDelete(req.params.id);
if (p) {
  await notifyAdmins({
    type: "product.deleted",
    title: "Product deleted",
    body: p.name,
    href: "/admin/products",
    meta: { productId: String(p._id) },
  });
}
res.status(204).end();
```

- [ ] **Step 4: Emit on bulk import**

In `bulkImport` after successful `insertMany`, using `req.user!.id`:

```ts
await notifyUsers([req.user!.id], {
  type: "bulk.completed",
  title: "Bulk upload complete",
  body: `Imported ${docs.length} products`,
  href: "/admin/products",
  meta: { imported: docs.length },
});
```

Ensure `bulkImport` uses `AuthReq` so `req.user` is typed (cast or change signature).

- [ ] **Step 5: Manual verify emit**

Create a product via admin API → `GET /notifications` as admin shows `product.created`.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add apps/api/src/controllers
git commit -m "feat(api): emit notifications from order, product, bulk flows"
```

---

### Task 9: Frontend NotificationBell + hooks

**Files:**
- Create: `apps/web/src/features/notifications/types.ts`
- Create: `apps/web/src/features/notifications/api.ts`
- Create: `apps/web/src/features/notifications/hooks.ts`
- Create: `apps/web/src/features/notifications/NotificationBell.tsx`
- Modify: `apps/web/src/routes/admin/AdminLayout.tsx`
- Modify: `apps/web/src/components/StoreLayout.tsx`

**Interfaces:**
- Consumes: `GET/PATCH/POST` notification APIs; `api` axios client
- Produces: `<NotificationBell />` with unread badge, dropdown, mark read / mark all

- [ ] **Step 1: Add API + hooks**

`types.ts`:

```ts
export type BxNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};
```

`api.ts`:

```ts
import { api } from "../../lib/api";
import type { BxNotification } from "./types";

export const fetchNotifications = async (limit = 20) => {
  const { data } = await api.get<{ items: BxNotification[] }>("/notifications", { params: { limit } });
  return data.items;
};

export const fetchUnreadCount = async () => {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  return data.count;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await api.patch<BxNotification>(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  await api.post("/notifications/read-all");
};
```

`hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";

const POLL_MS = 30_000;

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(20),
    enabled,
    refetchInterval: POLL_MS,
  });
}

export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    enabled,
    refetchInterval: POLL_MS,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
```

- [ ] **Step 2: Build `NotificationBell.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "./hooks";
import type { BxNotification } from "./types";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: items = [] } = useNotifications(true);
  const { data: count = 0 } = useUnreadCount(true);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onItem = async (n: BxNotification) => {
    if (!n.readAt) {
      try {
        await markRead.mutateAsync(n._id);
      } catch {
        /* fail soft */
      }
    }
    setOpen(false);
    if (n.href) navigate(n.href);
  };

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className="relative cursor-pointer border-0 bg-transparent text-ink"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-cognac" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-[14px] border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <span className="font-display text-sm font-bold text-ink">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent text-xs font-semibold text-cognac"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[360px] overflow-auto p-0 m-0 list-none">
            {items.length === 0 && (
              <li className="px-3.5 py-8 text-center text-sm text-muted">No notifications yet</li>
            )}
            {items.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => onItem(n)}
                  className={`flex w-full cursor-pointer flex-col gap-0.5 border-0 border-b border-border px-3.5 py-3 text-left ${
                    n.readAt ? "bg-card" : "bg-subtle"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{n.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted2">{timeAgo(n.createdAt)}</span>
                  </div>
                  <span className="text-[13px] text-text3">{n.body}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into layouts**

In `AdminLayout.tsx`: replace Bell placeholder with `import { NotificationBell } from "../../features/notifications/NotificationBell"` and `<NotificationBell />`.

In `StoreLayout.tsx`: when `user` is truthy, render `<NotificationBell />` instead of placeholder (use size-compatible wrapper; Bell inside already uses size 18 — acceptable for store).

- [ ] **Step 4: E2E manual checklist**

1. As admin: create product → bell badge appears within 30s (or refetch on open)
2. Click item → marks read, navigates
3. Mark all read → badge clears
4. As customer (logged in): place/pay order → customer sees order notifications; admin sees admin copies
5. Guest checkout → only admin notified

- [ ] **Step 5: Final builds**

```bash
pnpm --filter @baxparrow/api build
pnpm --filter @baxparrow/web build
```

Expected: both succeed.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add apps/web/src/features/notifications apps/web/src/routes/admin/AdminLayout.tsx apps/web/src/components/StoreLayout.tsx
git commit -m "feat(web): NotificationBell with polling for admin and store"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Mongo Notification model + types | 6 |
| REST list / unread / read / read-all | 7 |
| Emit order/product/bulk/inventory | 8 |
| Poll 30s + shared bell admin+customer | 9 |
| Guest = admins only | 8 (order create/pay) |
| Low stock ≤10, crossing only | 6 + 8 |
| Tailwind entire web app | 1–5 |
| CSS design tokens | 1 |
| Single sidebar full hide + localStorage | 2 |
| No email/SSE | respected (non-goals) |

**Placeholder scan:** none intentional.  
**Type consistency:** `NotifyPayload`, `stockCrossing` return union, API paths `/notifications*` match frontend `api.ts`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-26-notifications-tailwind-sidebar.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints  

Which approach?
