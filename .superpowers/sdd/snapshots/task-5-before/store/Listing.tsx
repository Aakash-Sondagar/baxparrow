import { useState } from "react";
import { t } from "../../styles/tokens";
import { useProducts } from "../../features/products/hooks";
import { ProductCard } from "../../components/ProductCard";
const CATS = ["All","School Bags","Office Bags","Handbags","Leather Bags","Sport Bags","Suitcases","Beach Bags","Travel Bags","Wallets"];
const PRICES: [string, string, string][] = [["all","All prices",""],["u1000","Under ₹1,000","0-1000"],["1to2","₹1,000 – ₹2,000","1000-2000"],["2to4","₹2,000 – ₹4,000","2000-4000"],["o4","Over ₹4,000","4000-"]];
export default function Listing() {
  const [cat, setCat] = useState("All");
  const [price, setPrice] = useState("all");
  const range = PRICES.find(p => p[0] === price)![2];
  const [min, max] = range.split("-");
  const { data } = useProducts({ category: cat, ...(min && { min }), ...(max && { max }) });
  const fBtn = (active: boolean) => ({ textAlign: "left" as const, background: active ? "#F6ECE4" : "none", color: active ? t.cognac : t.text3, border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, fontWeight: active ? 600 : 400, cursor: "pointer" });
  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px 60px" }}>
      <div style={{ fontSize: 13, color: t.muted2, fontFamily: t.monoFont, marginBottom: 8 }}>Home / {cat === "All" ? "All bags" : cat}</div>
      <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 34, letterSpacing: "-.02em", margin: "0 0 4px" }}>{cat === "All" ? "All bags" : cat}</h1>
      <p style={{ color: t.muted, margin: "0 0 24px" }}>{data?.total ?? 0} products</p>
      <div style={{ display: "grid", gridTemplateColumns: "236px 1fr", gap: 28, alignItems: "start" }}>
        <aside style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 20, position: "sticky", top: 112 }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 22 }}>
            {CATS.map(c => <button key={c} onClick={() => setCat(c)} style={fBtn(cat === c)}>{c}</button>)}
          </div>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Price</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PRICES.map(([k, l]) => <button key={k} onClick={() => setPrice(k)} style={fBtn(price === k)}>{l}</button>)}
          </div>
        </aside>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {(data?.items ?? []).map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}
