import { useParams, useNavigate } from "react-router-dom";
import { t, tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useProduct } from "../../features/products/hooks";
import { useCart } from "../../features/cart/CartContext";
export default function Product() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data: p } = useProduct(slug);
  const { add } = useCart();
  if (!p) return <div style={{ padding: 60, textAlign: "center", color: t.muted }}>Loading…</div>;
  const off = Math.round((1 - p.price / p.mrp) * 100);
  const addToCart = () => add({ id: p._id, name: p.name, cat: p.category, price: p.price, toneIndex: 0 });
  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px 60px" }}>
      <div style={{ fontSize: 13, color: t.muted2, fontFamily: t.monoFont, marginBottom: 16 }}>{p.category} / {p.name}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 44, alignItems: "start" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: 64, height: 64, borderRadius: 10, border: `1px solid ${t.border}`, background: tile(i) }} />)}
          </div>
          <div style={{ flex: 1, aspectRatio: "1/1.05", borderRadius: 18, background: tile(0), display: "grid", placeItems: "center", border: `1px solid ${t.border}` }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 12, color: "#9C8B7A" }}>[ {p.name} — product shot ]</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: t.monoFont, fontSize: 12, color: t.muted2 }}>{p.category} · SKU {p.sku}</div>
          <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 36, letterSpacing: "-.02em", margin: "8px 0 10px" }}>{p.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ color: "#E0A75E", fontSize: 15 }}>★★★★★</span><span style={{ fontSize: 13, color: t.muted }}>4.8 · 214 reviews</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 30 }}>{inr(p.price)}</span>
            <span style={{ fontSize: 17, color: t.muted2, textDecoration: "line-through" }}>{inr(p.mrp)}</span>
            <span style={{ background: t.greenBg, color: t.green, fontWeight: 700, fontSize: 13, padding: "3px 10px", borderRadius: 20 }}>{off}% off</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: t.text3, margin: "14px 0 22px" }}>{p.description}</p>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text2, marginBottom: 9 }}>Colour</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["#3A2D23","#5B6B63","#8B3A2E","#2E3440"].map((c, i) => <button key={c} style={{ width: 34, height: 34, borderRadius: "50%", background: c, border: `2px solid ${i === 0 ? t.cognac : "transparent"}`, cursor: "pointer" }} />)}
            </div>
          </div>
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text2, marginBottom: 9 }}>Size</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["S","M","L"].map((s, i) => <button key={s} style={{ minWidth: 52, padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${i === 1 ? t.ink : t.border}`, background: i === 1 ? t.ink : "#fff", color: i === 1 ? "#fff" : t.text2, fontWeight: 600, cursor: "pointer" }}>{s}</button>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={addToCart} style={{ flex: 1, background: t.ink, color: t.bg, border: "none", borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Add to cart · {inr(p.price)}</button>
            <button onClick={() => { addToCart(); nav("/checkout"); }} style={{ flex: 1, background: t.cognac, color: "#fff", border: "none", borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Buy now</button>
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 24, fontSize: 13, color: t.text3 }}>
            <span>✓ Free shipping over ₹999</span><span>✓ 7-day returns</span><span>✓ 1-year warranty</span>
          </div>
        </div>
      </div>
    </section>
  );
}
