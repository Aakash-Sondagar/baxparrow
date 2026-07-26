import { Link, useNavigate } from "react-router-dom";
import { t } from "../../styles/tokens";
import { useProducts } from "../../features/products/hooks";
import { ProductCard } from "../../components/ProductCard";
const CATS = [["School Bags","SCHOOL",128],["Office Bags","OFFICE",96],["Handbags","HANDBAG",142],["Leather Bags","LEATHER",74],["Sport Bags","SPORT",88],["Suitcases","LUGGAGE",61],["Beach Bags","BEACH",43],["Travel Bags","TRAVEL",110]];
const TRUST = [["Made in Mumbai","Own manufacturing unit"],["1-year warranty","On all bags"],["Free shipping","On orders over ₹999"],["7-day returns","No questions asked"]];
import { tile } from "../../styles/tokens";
export default function Home() {
  const nav = useNavigate();
  const { data } = useProducts({ limit: "8" });
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "linear-gradient(120deg,#241E19,#3A2D23)", color: t.bg, minHeight: 440, display: "flex" }}>
        <div style={{ flex: 1, padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 560 }}>
          <span style={{ fontFamily: t.monoFont, fontSize: 12, letterSpacing: ".2em", color: t.tan, marginBottom: 18 }}>EST. MUMBAI · SINCE 2019</span>
          <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 56, lineHeight: 1.02, letterSpacing: "-.03em", margin: "0 0 20px" }}>Carry with confidence.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#D8CFC5", margin: "0 0 32px" }}>Handcrafted school, office, travel &amp; leather bags — made in India, built to last. Shop retail or order in bulk for your team.</p>
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={() => nav("/shop")} style={{ background: t.tan, color: t.ink, border: "none", borderRadius: 11, padding: "15px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Shop the collection</button>
            <button onClick={() => nav("/shop")} style={{ background: "transparent", color: t.bg, border: "1px solid rgba(247,244,239,.35)", borderRadius: 11, padding: "15px 26px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Wholesale enquiry</button>
          </div>
        </div>
        <div style={{ flex: 1, background: "repeating-linear-gradient(135deg,#4A3A2D,#4A3A2D 14px,#43342825 14px,#433428 28px)", display: "grid", placeItems: "center" }}>
          <span style={{ fontFamily: t.monoFont, fontSize: 12, color: "#C9B39E" }}>[ hero bag lifestyle shot ]</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 16 }}>
        {TRUST.map(([title, sub]) => <div key={title} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 13, padding: "18px 20px" }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 15 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>{sub}</div></div>)}
      </div>
      <section style={{ padding: "36px 0 8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 26, letterSpacing: "-.02em", margin: 0 }}>Shop by category</h2>
          <Link to="/shop" style={{ fontSize: 14, fontWeight: 600 }}>View all →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {CATS.map(([name, tag, count], i) => <button key={name} onClick={() => nav("/shop")} style={{ position: "relative", border: `1px solid ${t.border}`, borderRadius: 15, overflow: "hidden", cursor: "pointer", aspectRatio: "1/.82", background: tile(i), display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16, textAlign: "left" }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 10, color: "#9C8B7A", position: "absolute", top: 12, left: 14 }}>[ {tag} ]</span>
            <span style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 16, color: "#26201B" }}>{name}</span>
            <span style={{ fontSize: 12, color: "#6E655C" }}>{count} styles</span></button>)}
        </div>
      </section>
      <section style={{ padding: "36px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 26, letterSpacing: "-.02em", margin: 0 }}>Bestsellers this week</h2>
          <Link to="/shop" style={{ fontSize: 14, fontWeight: 600 }}>Shop all →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {(data?.items ?? []).map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}
        </div>
      </section>
      <section style={{ marginBottom: 40 }}>
        <div style={{ background: t.ink, color: t.bg, borderRadius: 20, padding: "48px 52px", display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 12, letterSpacing: ".18em", color: t.tan }}>B2B / WHOLESALE</span>
            <h2 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 34, letterSpacing: "-.02em", margin: "12px 0" }}>Kitting out a school, office or store?</h2>
            <p style={{ fontSize: 16, color: "#CDC4BA", margin: "0 0 24px", maxWidth: 520 }}>Custom branding, tiered pricing from MOQ 50, and dedicated dispatch. Get a quote within 24 hours.</p>
            <button onClick={() => nav("/shop")} style={{ background: t.tan, color: t.ink, border: "none", borderRadius: 11, padding: "14px 26px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Request bulk quote</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,auto)", gap: 34 }}>
            {[["1000+","styles in stock"],["MOQ 50","for custom orders"],["24h","quote turnaround"]].map(([n, l]) =>
              <div key={l}><div style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 32, color: t.tan }}>{n}</div><div style={{ fontSize: 13, color: "#CDC4BA" }}>{l}</div></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
