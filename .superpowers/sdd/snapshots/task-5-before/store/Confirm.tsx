import { useNavigate, useParams } from "react-router-dom";
import { t } from "../../styles/tokens";
export default function Confirm() {
  const nav = useNavigate();
  const { no } = useParams();
  return (
    <section style={{ maxWidth: 680, margin: "0 auto", padding: "56px 28px 70px", textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: t.greenBg, color: t.green, display: "grid", placeItems: "center", fontSize: 36, margin: "0 auto 22px" }}>✓</div>
      <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 34, letterSpacing: "-.02em", margin: "0 0 10px" }}>Order confirmed!</h1>
      <p style={{ color: t.muted, fontSize: 16, margin: "0 0 6px" }}>Thank you — we've emailed your confirmation and receipt.</p>
      <p style={{ fontFamily: t.monoFont, fontSize: 14, color: t.cognac, margin: "0 0 30px" }}>Order #{no}</p>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 24, textAlign: "left", marginBottom: 20 }}>
        {[["Estimated delivery","21–23 July 2026"],["Shipping via","Shiprocket · Surface"],["Paid","₹3,436"]].map(([k, v], i) =>
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? 14 : 0 }}><span style={{ color: t.muted, fontSize: 14 }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>)}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => nav("/order/" + no + "/track")} style={{ background: t.ink, color: t.bg, border: "none", borderRadius: 11, padding: "14px 26px", fontWeight: 600, cursor: "pointer" }}>Track order</button>
        <button onClick={() => nav("/")} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 11, padding: "14px 26px", fontWeight: 600, cursor: "pointer" }}>Continue shopping</button>
      </div>
    </section>
  );
}
