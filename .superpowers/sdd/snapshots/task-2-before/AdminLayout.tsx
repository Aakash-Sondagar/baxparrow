import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, FolderTree, Upload, Bell, LogOut, Menu, X } from "lucide-react";
import { t } from "../../styles/tokens";
import { useAuth } from "../../features/auth/AuthContext";

const NAV = [
  ["/admin/dashboard", "Dashboard", LayoutDashboard],
  ["/admin/products", "Products", Package],
  ["/admin/orders", "Orders", ShoppingCart],
  ["/admin/categories", "Categories", FolderTree],
  ["/admin/products/bulk", "Bulk upload", Upload],
];

const TITLES: Record<string, string> = { dashboard: "Dashboard", products: "Products", orders: "Orders", categories: "Categories", bulk: "Bulk upload", new: "Add product" };

export function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const key = loc.pathname.split("/").pop() || "dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/admin");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  const sidebarContent = (
    <aside style={{ width: 236, background: t.ink, color: "#CDC4BA", padding: "22px 16px", display: "flex", flexDirection: "column", flexShrink: 0, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: t.tan, color: t.ink, fontFamily: t.displayFont, fontWeight: 800, display: "grid", placeItems: "center" }}>B</span>
          <div><div style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 16, color: t.bg }}>Baxparrow</div><div style={{ fontSize: 11, color: "#8A8178", fontFamily: t.monoFont }}>ADMIN</div></div>
        </div>
        <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "#CDC4BA", cursor: "pointer", display: "none" }} className="mobile-close">
          <X size={20} />
        </button>
      </div>
      {NAV.map(([to, label, Icon]: any) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={() => setMobileOpen(false)}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 11,
            borderRadius: 9,
            padding: "11px 12px",
            marginBottom: 3,
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            background: isActive ? "#3A3229" : "none",
            color: isActive ? t.bg : "#CDC4BA"
          })}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
      <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: "1px solid #2E2A25", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#3A3229", color: t.tan, display: "grid", placeItems: "center", fontWeight: 700, fontFamily: t.displayFont, flexShrink: 0 }}>{initial}</span>
          <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <div style={{ color: t.bg, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Admin"}</div>
            <div style={{ color: "#8A8178", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "Store owner"}</div>
          </div>
        </div>
        <button onClick={handleLogout} title="Log out" style={{ background: "none", border: "none", color: "#CDC4BA", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.adminCanvas, position: "relative" }}>
      {/* Desktop Sidebar */}
      <div style={{ display: "flex" }} className="desktop-sidebar">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 90 }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease"
        }}
        className="mobile-drawer"
      >
        {sidebarContent}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ background: "#fff", borderBottom: `1px solid ${t.border}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.ink, padding: 4, display: "flex", alignItems: "center" }}
            title="Toggle Menu"
          >
            <Menu size={22} />
          </button>
          <h1 style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 20, margin: 0 }}>{TITLES[key] ?? "Admin"}</h1>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* <div style={{ background: t.adminCanvas, border: `1px solid ${t.border}`, borderRadius: 9, padding: "7px 12px", fontSize: 13, color: t.muted2, maxWidth: 160 }}>⌕ Search…</div> */}
            <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}><Bell size={18} /><span style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: t.cognac }} /></button>
            {/* <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: t.adminCanvas, border: `1px solid ${t.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: t.ink, cursor: "pointer" }}>
              <LogOut size={15} />
              <span className="logout-text">Logout</span>
            </button> */}
          </div>
        </header>
        <div style={{ padding: "20px", overflow: "auto", flex: 1 }}><Outlet /></div>
      </div>
    </div>
  );
}
