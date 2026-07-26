import { useState } from "react";
import { inr } from "../../lib/format";
import { useAdminOrders, useUpdateOrderStatus } from "../../features/orders/adminHooks";
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const badge = (s: string) => {
  const m: Record<string, string> = {
    delivered: "bg-green-bg text-green",
    shipped: "bg-[#E9EEF6] text-[#3B6DB0]",
    processing: "bg-[#FBF1E5] text-amber",
    pending: "bg-[#F3EFEA] text-muted",
  };
  return `text-xs font-bold px-[11px] py-1 rounded-full ${m[s] ?? m.pending}`;
};
const NEXT: Record<string,string> = { pending: "processing", processing: "shipped", shipped: "delivered" };
export default function Orders() {
  const [tab, setTab] = useState("All");
  const { data: orders = [], isLoading } = useAdminOrders(tab === "All" ? "All" : tab.toLowerCase());
  const advance = useUpdateOrderStatus();
  return (
    <>
      <div className="mb-[18px] flex gap-2">
        {["All","Pending","Processing","Shipped","Delivered"].map(x => <button key={x} onClick={() => setTab(x)} className={`cursor-pointer rounded-[9px] border px-4 py-2 text-[13px] font-semibold ${tab === x ? "border-ink bg-ink text-white" : "border-border bg-card text-text3"}`}>{x}</button>)}
      </div>
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <table className="w-full border-collapse text-[13.5px]">
          <thead><tr className="bg-[#FBFAF7] text-left font-mono text-[11px] text-muted2">{["ORDER","CUSTOMER","ITEMS","TOTAL","PAYMENT","STATUS",""].map(h => <th key={h} className="px-[22px] py-[13px] font-normal">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted">Loading…</td></tr>}
            {!isLoading && orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">No orders yet.</td></tr>}
            {orders.map((o: any) => <tr key={o.orderNo} className="border-t border-t-[#F0EBE3]">
              <td className="px-[22px] py-[13px] font-mono font-bold text-cognac">{o.orderNo}</td>
              <td className="p-[13px]"><div className="font-semibold">{o.address?.firstName ? o.address.firstName + " " + (o.address.lastName ?? "") : "Guest"}</div><div className="text-xs text-muted2">{new Date(o.createdAt).toLocaleDateString()}</div></td>
              <td className="p-[13px] text-text3">{o.items?.length ?? 0} items</td>
              <td className="p-[13px] font-body tabular-nums">{inr(o.amounts?.total ?? 0)}</td>
              <td className="p-[13px]"><span className={`text-xs font-semibold ${o.payment?.status === "paid" ? "text-green" : "text-muted"}`}>● {label(o.payment?.status ?? "pending")}</span></td>
              <td className="p-[13px]"><span className={badge(o.status)}>{label(o.status)}</span></td>
              <td className="px-[22px] py-[13px]">{NEXT[o.status] && <button onClick={() => advance.mutate({ no: o.orderNo, status: NEXT[o.status] })} className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold">Mark {label(NEXT[o.status])}</button>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
