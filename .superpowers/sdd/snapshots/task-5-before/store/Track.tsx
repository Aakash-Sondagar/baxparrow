import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "../../styles/tokens";
import { trackOrder } from "../../features/orders/api";
const FALLBACK = [
  ["Order confirmed","16 Jul, 10:24 AM","Payment received via Razorpay (UPI)","done"],
  ["Packed & ready","16 Jul, 4:10 PM","Dispatched from Byculla warehouse","done"],
  ["Shipped","17 Jul, 9:02 AM","Picked up by Shiprocket · AWB 3491028847","active"],
  ["Out for delivery","Expected 21 Jul","Mumbai, 400008","pend"],
  ["Delivered","Expected 21–23 Jul","","pend"],
];
export default function Track() {
  const { no } = useParams();
  const { data } = useQuery({ queryKey: ["track", no], retry: false, queryFn: () => trackOrder(no!) });
  const live = data?.timeline?.length
    ? data.timeline.map((s: any, i: number) => [s.status, new Date(s.at).toLocaleString(), s.note, i === data.timeline.length - 1 ? "active" : "done"])
    : FALLBACK;
  return (
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "32px 28px 70px" }}>
      <h1 style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", margin: "0 0 4px" }}>Track your order</h1>
      <p style={{ fontFamily: t.monoFont, color: t.cognac, fontSize: 14, margin: "0 0 26px" }}>Order #{no}{data?.order?.shipment?.awb ? " · AWB " + data.order.shipment.awb : ""}</p>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: 32 }}>
        {live.map(([title, time, note, state]: any, i: number) => {
          const dot = state === "pend" ? "#D6CFC4" : state === "active" ? t.cognac : t.green;
          return <div key={i} style={{ display: "flex", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: dot, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, flexShrink: 0 }}>{state === "pend" ? "" : "✓"}</span>
              {i < live.length - 1 && <span style={{ width: 2, flex: 1, background: state === "done" ? t.green : t.border, minHeight: 34 }} />}
            </div>
            <div style={{ paddingBottom: 26 }}>
              <div style={{ fontWeight: 700, color: state === "pend" ? t.muted2 : t.ink, fontSize: 15 }}>{title}</div>
              <div style={{ fontSize: 13, color: t.muted2, fontFamily: t.monoFont }}>{time}</div>
              {note && <div style={{ fontSize: 13.5, color: t.muted, marginTop: 2 }}>{note}</div>}
            </div>
          </div>;
        })}
      </div>
    </section>
  );
}
