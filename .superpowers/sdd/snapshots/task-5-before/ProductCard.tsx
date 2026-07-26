import { useNavigate } from "react-router-dom";
import { t, tile } from "../styles/tokens";
import { inr } from "../lib/format";
import { useCart } from "../features/cart/CartContext";
export type P = { _id: string; slug: string; name: string; category: string; price: number; mrp: number; };
export function ProductCard({ p, index }: { p: P; index: number }) {
  const nav = useNavigate();
  const { add } = useCart();
  const onSale = p.mrp > p.price;
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <button onClick={() => nav("/p/" + p.slug)} style={{ border: "none", cursor: "pointer", padding: 0, aspectRatio: "1/1", background: tile(index), position: "relative", display: "grid", placeItems: "center" }}>
        <span style={{ fontFamily: t.monoFont, fontSize: 11, color: "#9C8B7A" }}>[ {p.category} ]</span>
        {onSale && <span style={{ position: "absolute", top: 12, left: 12, background: t.cognac, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, fontFamily: t.monoFont }}>SALE</span>}
      </button>
      <div style={{ padding: "15px 16px 17px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 11, color: t.muted2, fontFamily: t.monoFont }}>{p.category}</div>
        <button onClick={() => nav("/p/" + p.slug)} style={{ textAlign: "left", background: "none", border: "none", padding: "2px 0 0", cursor: "pointer", fontFamily: t.displayFont, fontWeight: 700, fontSize: 16, color: t.ink }}>{p.name}</button>
        <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 17 }}>{inr(p.price)}</span>
          {onSale && <span style={{ fontSize: 13, color: t.muted2, textDecoration: "line-through" }}>{inr(p.mrp)}</span>}
        </div>
        <button onClick={() => add({ id: p._id, name: p.name, cat: p.category, price: p.price, toneIndex: index })} style={{ marginTop: 12, width: "100%", background: t.ink, color: t.bg, border: "none", borderRadius: 10, padding: 11, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Add to cart</button>
      </div>
    </div>
  );
}
