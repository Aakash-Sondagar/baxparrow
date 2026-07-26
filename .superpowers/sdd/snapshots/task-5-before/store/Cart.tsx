import { useNavigate } from "react-router-dom";
import { t, tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useCart } from "../../features/cart/CartContext";
import { computeTotals } from "@baxparrow/shared";
export default function CartPage() {
  const nav = useNavigate();
  const { items, setQty, remove } = useCart();
  const subtotal = items.reduce((a, x) => a + x.price * x.qty, 0);
  const { shipping, gst, total } = computeTotals(subtotal);
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 60px" }}>
      <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 34, letterSpacing: "-.02em", margin: "0 0 24px" }}>Your cart</h1>
      {items.length === 0 ? (
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 64, textAlign: "center" }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Your cart is empty</div>
          <p style={{ color: t.muted, margin: "0 0 20px" }}>Explore our bestsellers and add something you love.</p>
          <button onClick={() => nav("/shop")} style={{ background: t.ink, color: t.bg, border: "none", borderRadius: 11, padding: "13px 26px", fontWeight: 600, cursor: "pointer" }}>Shop bags</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map(l => (
              <div key={l.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 88, height: 88, borderRadius: 11, background: tile(l.toneIndex), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.muted2, fontFamily: t.monoFont }}>{l.cat}</div>
                  <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 16 }}>{l.name}</div>
                  <div style={{ fontSize: 13, color: t.muted }}>{inr(l.price)} each</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${t.border}`, borderRadius: 9, overflow: "hidden" }}>
                  <button onClick={() => setQty(l.id, -1)} style={{ background: t.bg, border: "none", width: 34, height: 34, fontSize: 18, cursor: "pointer", color: t.text2 }}>−</button>
                  <span style={{ width: 34, textAlign: "center", fontFamily: t.monoFont, fontWeight: 700 }}>{l.qty}</span>
                  <button onClick={() => setQty(l.id, 1)} style={{ background: t.bg, border: "none", width: 34, height: 34, fontSize: 18, cursor: "pointer", color: t.text2 }}>+</button>
                </div>
                <div style={{ width: 90, textAlign: "right", fontFamily: t.displayFont, fontWeight: 700, fontSize: 16 }}>{inr(l.price * l.qty)}</div>
                <button onClick={() => remove(l.id)} style={{ background: "none", border: "none", color: t.muted2, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 24, position: "sticky", top: 112 }}>
            <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 18, marginBottom: 18 }}>Order summary</div>
            {[["Subtotal", inr(subtotal)],["Shipping", shipping === 0 ? "FREE" : inr(shipping)],["GST (18%)", inr(gst)]].map(([k, v]) =>
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: t.text3, marginBottom: 11 }}><span>{k}</span><span style={{ fontFamily: t.monoFont, color: k === "Shipping" && shipping === 0 ? t.green : t.text3 }}>{v}</span></div>)}
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span><span style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 24 }}>{inr(total)}</span>
            </div>
            <button onClick={() => nav("/checkout")} style={{ width: "100%", background: t.ink, color: t.bg, border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Proceed to checkout</button>
          </div>
        </div>
      )}
    </section>
  );
}
