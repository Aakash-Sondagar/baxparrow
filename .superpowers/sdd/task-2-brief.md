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
// NotificationBell wired in Task 9 â€” temporary placeholder button until then
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

1. Desktop â‰¥1024px: click hamburger â†’ sidebar fully disappears; click again â†’ returns; refresh keeps preference
2. Narrow viewport: hamburger opens drawer + overlay; X / overlay / nav link closes it

Expected: no second ghost sidebar; close button visible on mobile.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add apps/web/src/routes/admin/AdminLayout.tsx
git commit -m "fix(admin): single sidebar toggle with Tailwind layout"
```

---




## Extra constraints
- DO NOT commit (no git / user rule).
- If Tailwind classes like z-90/py-5.5 don't work, use arbitrary values z-[90]/py-[22px] as plan notes.

