import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { t, tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useCart } from "../../features/cart/CartContext";
import { computeTotals } from "@baxparrow/shared";
import { createOrder, verifyPayment } from "../../features/orders/api";
import { openRazorpay } from "../../lib/razorpay";
const field = { width: "100%", marginTop: 6, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none" } as const;
const label = { fontSize: 13, color: t.text3 } as const;
export default function Checkout() {
  const nav = useNavigate();
  const { items, clear } = useCart();
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", address: "", city: "", pin: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const subtotal = items.reduce((a, x) => a + x.price * x.qty, 0);
  const { shipping, gst, total } = computeTotals(subtotal);
  const pay = async () => {
    setErr(""); setBusy(true);
    try {
      const { orderNo, razorpayOrderId, amount } = await createOrder(form, items);
      openRazorpay({
        orderId: razorpayOrderId, amount, name: form.firstName, email: form.email,
        onSuccess: async (r) => {
          await verifyPayment({ orderNo, ...r });
          clear();
          nav("/order/" + orderNo + "/confirmed");
        },
        onDismiss: () => setBusy(false),
      });
    } catch (e: any) { setErr(e?.response?.data?.error ?? "Could not start payment"); setBusy(false); }
  };
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 60px" }}>
      <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 32, letterSpacing: "-.02em", margin: "0 0 24px" }}>Checkout</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 24 }}>
            <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 17, marginBottom: 18 }}>Contact &amp; delivery</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/3" }}><label style={label}>Email</label><input value={form.email} onChange={set("email")} placeholder="you@email.com" style={field} /></div>
              <div><label style={label}>First name</label><input value={form.firstName} onChange={set("firstName")} style={field} /></div>
              <div><label style={label}>Last name</label><input value={form.lastName} onChange={set("lastName")} style={field} /></div>
              <div style={{ gridColumn: "1/3" }}><label style={label}>Address</label><input value={form.address} onChange={set("address")} placeholder="Flat, building, street" style={field} /></div>
              <div><label style={label}>City</label><input value={form.city} onChange={set("city")} style={field} /></div>
              <div><label style={label}>PIN code</label><input value={form.pin} onChange={set("pin")} placeholder="400008" style={field} /></div>
            </div>
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 17 }}>Payment</div>
              <span style={{ fontFamily: t.monoFont, fontSize: 12, color: t.green }}>🔒 Secured by Razorpay</span>
            </div>
            <div style={{ border: `2px solid ${t.cognac}`, background: "#FBF2EB", borderRadius: 11, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: `5px solid ${t.cognac}` }} /><span style={{ fontWeight: 600 }}>UPI · Cards · Netbanking</span><span style={{ color: t.muted, fontSize: 13 }}>via Razorpay Checkout</span>
            </div>
          </div>
        </div>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 24, position: "sticky", top: 112 }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 18, marginBottom: 16 }}>{items.reduce((a,x)=>a+x.qty,0)} items</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, maxHeight: 220, overflow: "auto" }}>
            {items.map(l => <div key={l.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 9, background: tile(l.toneIndex), flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13 }}><div style={{ fontWeight: 600 }}>{l.name}</div><div style={{ color: t.muted2 }}>Qty {l.qty}</div></div>
              <div style={{ fontFamily: t.monoFont, fontSize: 13 }}>{inr(l.price * l.qty)}</div></div>)}
          </div>
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14, display: "flex", justifyContent: "space-between", fontSize: 14, color: t.text3, marginBottom: 10 }}><span>Subtotal</span><span style={{ fontFamily: t.monoFont }}>{inr(subtotal)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: t.text3, marginBottom: 16 }}><span>Shipping + GST</span><span style={{ fontFamily: t.monoFont }}>{inr(shipping + gst)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 24 }}>{inr(total)}</span></div>
          {err && <div style={{ color: t.danger, fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <button disabled={busy || !items.length} onClick={pay} style={{ width: "100%", background: t.cognac, color: "#fff", border: "none", borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 15, cursor: busy ? "default" : "pointer", opacity: busy || !items.length ? .6 : 1 }}>{busy ? "Processing…" : "Pay " + inr(total)}</button>
        </div>
      </div>
    </section>
  );
}
