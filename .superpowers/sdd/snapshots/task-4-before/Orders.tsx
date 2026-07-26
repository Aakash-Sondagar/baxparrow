import { useState } from "react";
import { t } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useAdminOrders, useUpdateOrderStatus } from "../../features/orders/adminHooks";
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const badge = (s: string) => {
  const m: Record<string,[string,string]> = { delivered:[t.greenBg,t.green], shipped:["#E9EEF6","#3B6DB0"], processing:["#FBF1E5",t.amber], pending:["#F3EFEA",t.muted] };
  const [bg, fg] = m[s] ?? m.pending; return { background: bg, color: fg, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20 };
};
const NEXT: Record<string,string> = { pending: "processing", processing: "shipped", shipped: "delivered" };
export default function Orders() {
  const [tab, setTab] = useState("All");
  const { data: orders = [], isLoading } = useAdminOrders(tab === "All" ? "All" : tab.toLowerCase());
  const advance = useUpdateOrderStatus();
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["All","Pending","Processing","Shipped","Delivered"].map(x => <button key={x} onClick={() => setTab(x)} style={{ border: `1px solid ${tab === x ? t.ink : t.border}`, background: tab === x ? t.ink : "#fff", color: tab === x ? "#fff" : t.text3, borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{x}</button>)}
      </div>
      <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr style={{ textAlign: "left", color: t.muted2, fontFamily: t.monoFont, fontSize: 11, background: "#FBFAF7" }}>{["ORDER","CUSTOMER","ITEMS","TOTAL","PAYMENT","STATUS",""].map(h => <th key={h} style={{ padding: "13px 22px", fontWeight: 400 }}>{h}</th>)}</tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: t.muted }}>Loading…</td></tr>}
            {!isLoading && orders.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: t.muted }}>No orders yet.</td></tr>}
            {orders.map((o: any) => <tr key={o.orderNo} style={{ borderTop: "1px solid #F0EBE3" }}>
              <td style={{ padding: "13px 22px", fontFamily: t.monoFont, color: t.cognac, fontWeight: 700 }}>{o.orderNo}</td>
              <td style={{ padding: 13 }}><div style={{ fontWeight: 600 }}>{o.address?.firstName ? o.address.firstName + " " + (o.address.lastName ?? "") : "Guest"}</div><div style={{ fontSize: 12, color: t.muted2 }}>{new Date(o.createdAt).toLocaleDateString()}</div></td>
              <td style={{ padding: 13, color: t.text3 }}>{o.items?.length ?? 0} items</td>
              <td style={{ padding: 13, fontFamily: t.monoFont }}>{inr(o.amounts?.total ?? 0)}</td>
              <td style={{ padding: 13 }}><span style={{ fontSize: 12, color: o.payment?.status === "paid" ? t.green : t.muted, fontWeight: 600 }}>● {label(o.payment?.status ?? "pending")}</span></td>
              <td style={{ padding: 13 }}><span style={badge(o.status)}>{label(o.status)}</span></td>
              <td style={{ padding: "13px 22px" }}>{NEXT[o.status] && <button onClick={() => advance.mutate({ no: o.orderNo, status: NEXT[o.status] })} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mark {label(NEXT[o.status])}</button>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
