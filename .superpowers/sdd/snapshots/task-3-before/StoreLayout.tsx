import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag } from "lucide-react";
import { t } from "../styles/tokens";
import { useCart } from "../features/cart/CartContext";
export function StoreLayout() {
  const { count } = useCart();
  const nav = useNavigate();
  return (
    <div style={{ background: t.bg, minHeight: "100vh" }}>
      <div style={{ background: t.cognac, color: "#FBEEE4", textAlign: "center", padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
        Monsoon Sale · Flat 20% off Travel &amp; Office ranges · Free shipping over ₹999
      </div>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(247,244,239,.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 28px", display: "flex", alignItems: "center", gap: 28 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: t.ink, color: t.tan, fontFamily: t.displayFont, fontWeight: 800, fontSize: 18, display: "grid", placeItems: "center" }}>B</span>
            <span style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 22, letterSpacing: "-.02em", color: t.ink }}>Baxparrow</span>
          </Link>
          <nav style={{ display: "flex", gap: 22, fontSize: 14, fontWeight: 500 }}>
            {["Shop All","Travel","Office","Leather"].map(x =>
              <NavLink key={x} to="/shop" style={{ color: t.text2 }}>{x}</NavLink>)}
            <NavLink to="/shop" style={{ color: t.cognac, fontWeight: 600 }}>Wholesale</NavLink>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => nav("/search")} style={{ display: "flex", alignItems: "center", gap: 8, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "9px 14px", color: t.muted2, fontSize: 13, cursor: "pointer", minWidth: 200 }}>
              <Search size={15} /> Search 1,000+ bags…
            </button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: t.text2 }}><Heart size={20} /></button>
            <button onClick={() => nav("/cart")} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: t.ink }}>
              <ShoppingBag size={20} />
              {count > 0 && <span style={{ position: "absolute", top: -6, right: -8, background: t.cognac, color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, borderRadius: 9, display: "grid", placeItems: "center", padding: "0 4px", fontFamily: t.monoFont }}>{count}</span>}
            </button>
          </div>
        </div>
      </header>
      <main style={{ animation: "bxfade .3s ease" }}><Outlet /></main>
      <footer style={{ background: t.ink, color: "#CDC4BA", marginTop: 20 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 28px 32px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 36 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: t.tan, color: t.ink, fontFamily: t.displayFont, fontWeight: 800, display: "grid", placeItems: "center" }}>B</span>
              <span style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 20, color: t.bg }}>Baxparrow</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>Manufacturer &amp; wholesaler of bags — Byculla, Mumbai. Carry with confidence.</p>
          </div>
          {[["Shop",["Backpacks","Office & Laptop","Travel & Luggage","Leather"]],["Company",["About","Wholesale","Track order","Contact"]],["Support",["Shipping","Returns","Warranty","FAQ"]]].map(([h, items]: any) =>
            <div key={h}><div style={{ color: t.bg, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5 }}>{items.map((i: string) => <span key={i}>{i}</span>)}</div></div>)}
        </div>
        <div style={{ borderTop: "1px solid #2E2A25", padding: "18px 28px", textAlign: "center", fontSize: 12.5, color: "#8A8178", fontFamily: t.monoFont }}>© 2026 Baxparrow · Made in Mumbai · Payments secured by Razorpay</div>
      </footer>
    </div>
  );
}
