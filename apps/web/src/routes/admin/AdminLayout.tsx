import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, FolderTree, Upload, LogOut, Menu, X, Settings2,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { NotificationBell } from "../../features/notifications/NotificationBell";

const NAV = [
  ["/admin/dashboard", "Dashboard", LayoutDashboard],
  ["/admin/products", "Products", Package],
  ["/admin/orders", "Orders", ShoppingCart],
  ["/admin/categories", "Categories", FolderTree],
  ["/admin/products/bulk", "Bulk upload", Upload],
  ["/admin/settings", "UI settings", Settings2],
] as const;

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  categories: "Categories",
  bulk: "Bulk upload",
  new: "Add product",
  edit: "Edit product",
  settings: "UI settings",
};

const SIDEBAR_KEY = "bx_admin_sidebar";
const SIDEBAR_W = 236;

export function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const key = loc.pathname.split("/").pop() || "dashboard";

  const [desktopOpen, setDesktopOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === null) return true;
    return stored === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLg, setIsLg] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setIsLg(mq.matches);
      if (!mq.matches) setMobileOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggleSidebar = () => {
    if (isLg) {
      const next = !desktopOpen;
      setDesktopOpen(next);
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    } else {
      setMobileOpen((v) => !v);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";
  const sidebarVisible = isLg ? desktopOpen : mobileOpen;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
      isActive ? "bg-[#3A3229] font-semibold text-bg" : "font-medium text-[#CDC4BA] hover:bg-[#2A2520]"
    }`;

  const sidebar = (
    <aside className="flex h-full w-[236px] shrink-0 flex-col bg-ink px-4 py-[22px] text-[#CDC4BA]">
      <div className="mb-[22px] flex items-center justify-between px-2 pt-1">
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
          className="cursor-pointer border-0 bg-transparent p-1 text-[#CDC4BA] transition-opacity duration-200 lg:hidden"
          onClick={closeMobile}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      {NAV.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={() => {
            if (!isLg) closeMobile();
          }}
          className={linkClass}
        >
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
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1.5 text-[#CDC4BA] transition-colors duration-200 hover:text-bg"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="relative min-h-screen bg-admin-canvas">
      {/* Fixed sidebar — desktop always mounted; mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-[100] transition-[transform,visibility] duration-300 ease-out ${
          sidebarVisible
            ? "visible translate-x-0"
            : "invisible pointer-events-none -translate-x-full"
        }`}
        aria-hidden={!sidebarVisible}
      >
        {sidebar}
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-black/50 transition-opacity duration-300 lg:pointer-events-none lg:invisible ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobile}
        aria-hidden
      />

      <div
        className="flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-out"
        style={{ marginLeft: isLg && desktopOpen ? SIDEBAR_W : 0 }}
      >
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-border bg-card/95 px-4 py-3.5 backdrop-blur-sm sm:gap-3.5 sm:px-5">
          <button
            type="button"
            title="Toggle Menu"
            onClick={toggleSidebar}
            className="flex cursor-pointer items-center rounded-md border-0 bg-transparent p-1 text-ink transition-colors duration-200 hover:bg-subtle"
            aria-expanded={sidebarVisible}
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>
          <h1 className="m-0 font-display text-lg font-bold text-ink sm:text-xl">{TITLES[key] ?? "Admin"}</h1>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell scope="admin" />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
