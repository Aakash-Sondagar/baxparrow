import { useState } from "react";
import { inr } from "../../lib/format";
import { useAdminOrders, useUpdateOrderStatus, useUpdateReturn } from "../../features/orders/adminHooks";

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
const returnBadge = (s: string) => {
  const m: Record<string, string> = {
    requested: "bg-[#FBF1E5] text-amber",
    approved: "bg-[#E9EEF6] text-[#3B6DB0]",
    received: "bg-[#EFEAF6] text-[#6B4E9E]",
    refunded: "bg-green-bg text-green",
    rejected: "bg-[#F3EFEA] text-muted",
  };
  return `text-xs font-bold px-[11px] py-1 rounded-full ${m[s] ?? m.rejected}`;
};
const NEXT: Record<string, string> = { pending: "processing", processing: "shipped", shipped: "delivered" };
const RETURN_NEXT: Record<string, { status: string; text: string }> = {
  requested: { status: "approved", text: "Approve" },
  approved: { status: "received", text: "Mark received" },
  received: { status: "refunded", text: "Mark refunded" },
};
// key = order.status filter; ret = return.status filter (takes precedence, clears order-status filter)
const TABS: { key: string; label: string; ret?: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "requested", label: "Requested", ret: "requested" },
  { key: "approved", label: "Approved", ret: "approved" },
  { key: "received", label: "Received", ret: "received" },
  { key: "refunded", label: "Refunded", ret: "refunded" },
  { key: "rejected", label: "Rejected", ret: "rejected" },
];

export default function Orders() {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rejectErr, setRejectErr] = useState("");
  const [viewing, setViewing] = useState<any | null>(null);
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const { data, isLoading } = useAdminOrders(active.ret ? "All" : active.key, page, active.ret);
  const orders = data?.items ?? [];
  const advance = useUpdateOrderStatus();
  const updateReturn = useUpdateReturn();

  const switchTab = (x: string) => {
    setTab(x);
    setPage(1);
  };

  const confirmReject = () => {
    if (!rejecting) return;
    updateReturn.mutate(
      { no: rejecting, status: "rejected", note: note.trim() || "Return rejected" },
      {
        onSuccess: () => {
          setRejecting(null);
          setNote("");
          setRejectErr("");
        },
        onError: (e: any) => setRejectErr(e?.response?.data?.error ?? "Could not reject return."),
      }
    );
  };

  return (
    <>
      <div className="mb-[18px] flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)} className={`shrink-0 cursor-pointer rounded-[9px] border px-4 py-2 text-[13px] font-semibold ${tab === t.key ? "border-ink bg-ink text-white" : "border-border bg-card text-text3"}`}>{t.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
          <thead><tr className="bg-[#FBFAF7] text-left font-mono text-[11px] text-muted2">{["ORDER", "CUSTOMER", "ITEMS", "TOTAL", "PAYMENT", "STATUS", ""].map((h) => <th key={h} className="px-[22px] py-[13px] font-normal">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted">Loading…</td></tr>}
            {!isLoading && orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">{active.ret ? "No returns in this state." : "No orders yet."}</td></tr>}
            {orders.map((o: any) => {
              const rs = o.return?.status as string | undefined;
              const rNext = rs ? RETURN_NEXT[rs] : undefined;
              return <tr key={o.orderNo} className="border-t border-t-[#F0EBE3]">
                <td className="px-[22px] py-[13px] font-mono font-bold text-cognac">{o.orderNo}</td>
                <td className="p-[13px]"><div className="font-semibold">{o.address?.firstName ? o.address.firstName + " " + (o.address.lastName ?? "") : "Guest"}</div><div className="text-xs text-muted2">{new Date(o.createdAt).toLocaleDateString()}</div></td>
                <td className="p-[13px] text-text3">{o.items?.length ?? 0} items</td>
                <td className="p-[13px] font-body tabular-nums">{inr(o.amounts?.total ?? 0)}</td>
                <td className="p-[13px]"><span className={`text-xs font-semibold ${o.payment?.status === "paid" ? "text-green" : "text-muted"}`}>● {label(o.payment?.status ?? "pending")}</span></td>
                <td className="p-[13px]">
                  <span className={badge(o.status)}>{label(o.status)}</span>
                  {rs && <div className="mt-1"><span className={returnBadge(rs)}>{label(rs)}</span></div>}
                </td>
                <td className="px-[22px] py-[13px]">
                  {rNext && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setViewing(o)} className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold">View</button>
                      <button disabled={updateReturn.isPending} onClick={() => updateReturn.mutate({ no: o.orderNo, status: rNext.status })} className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{rNext.text}</button>
                      {rs === "requested" && (
                        <button disabled={updateReturn.isPending} onClick={() => { setRejecting(o.orderNo); setNote(""); setRejectErr(""); }} className="cursor-pointer rounded-lg border border-[#F0D9D4] bg-[#FDF6F4] px-3 py-1.5 text-xs font-semibold text-danger disabled:opacity-50">Reject</button>
                      )}
                    </div>
                  )}
                  {!rNext && rs && (
                    <button onClick={() => setViewing(o)} className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold">View</button>
                  )}
                  {!rs && NEXT[o.status] && <button onClick={() => advance.mutate({ no: o.orderNo, status: NEXT[o.status] })} className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold">Mark {label(NEXT[o.status])}</button>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {(data?.pages ?? 1) > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-[13px]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-mono text-muted">
            {data?.page ?? 1} / {data?.pages ?? 1}
          </span>
          <button
            type="button"
            disabled={page >= (data?.pages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {rejecting && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setRejecting(null)}
          role="alertdialog"
          aria-modal="true"
          aria-label="Reject return"
        >
          <div className="w-full max-w-md rounded-[14px] border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-display text-[17px] font-bold text-ink">Reject return · {rejecting}</div>
            <p className="m-0 mb-4 text-[13.5px] text-muted">Share a short reason with the customer.</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. Outside the 7-day window on inspection"
              className="mt-1.5 w-full rounded-[10px] border border-border bg-bg px-3.5 py-3 text-sm outline-none focus:border-cognac"
            />
            {rejectErr && <div className="mt-2.5 text-[13px] text-danger">{rejectErr}</div>}
            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={() => setRejecting(null)} className="cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink">Cancel</button>
              <button type="button" disabled={updateReturn.isPending} onClick={confirmReject} className="cursor-pointer rounded-[10px] border-none bg-danger px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">{updateReturn.isPending ? "Rejecting…" : "Reject return"}</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewing(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Return details"
        >
          <div className="w-full max-w-lg rounded-[14px] border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-display text-[17px] font-bold text-ink">Return · {viewing.orderNo}</div>
            <p className="m-0 mb-4 text-[13.5px] text-muted">
              {label(viewing.return?.status ?? "")} · {viewing.items?.length ?? 0} items · {inr(viewing.amounts?.total ?? 0)}
            </p>
            <div className="mb-1 text-[13px] font-semibold text-text3">Reason</div>
            <p className="m-0 mb-4 text-[13.5px] text-ink">
              {viewing.return?.reason || "—"}
              {viewing.return?.reasonDetail ? <span className="text-muted"> — {viewing.return.reasonDetail}</span> : null}
            </p>
            <div className="mb-1 text-[13px] font-semibold text-text3">Photos</div>
            {viewing.return?.images?.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {viewing.return.images.map((url: string) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-[9px] border border-border">
                    <img src={url} alt="Return item" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="m-0 text-[13.5px] text-muted2">No photos attached.</p>
            )}
            {viewing.return?.status === "refunded" && viewing.return?.refundId && (
              <p className="m-0 mt-4 font-mono text-[12px] text-muted">Refund: {viewing.return.refundId}</p>
            )}
            <div className="mt-5 flex justify-end gap-2.5">
              {RETURN_NEXT[viewing.return?.status] && (
                <button
                  disabled={updateReturn.isPending}
                  onClick={() =>
                    updateReturn.mutate(
                      { no: viewing.orderNo, status: RETURN_NEXT[viewing.return.status].status },
                      { onSuccess: () => setViewing(null) }
                    )
                  }
                  className="cursor-pointer rounded-[10px] border-none bg-cognac px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
                >
                  {RETURN_NEXT[viewing.return.status].text}
                </button>
              )}
              <button type="button" onClick={() => setViewing(null)} className="cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
