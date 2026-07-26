import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    <section className="mx-auto max-w-[760px] px-7 pt-8 pb-[70px]">
      <h1 className="m-0 mb-1 font-display text-[30px] font-extrabold tracking-[-.02em]">Track your order</h1>
      <p className="m-0 mb-[26px] font-mono text-sm text-cognac">Order #{no}{data?.order?.shipment?.awb ? " · AWB " + data.order.shipment.awb : ""}</p>
      <div className="rounded-[15px] border border-border bg-card p-8">
        {live.map(([title, time, note, state]: any, i: number) => {
          const dotClass = state === "pend" ? "bg-[#D6CFC4]" : state === "active" ? "bg-cognac" : "bg-green";
          return <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[13px] text-white ${dotClass}`}>{state === "pend" ? "" : "✓"}</span>
              {i < live.length - 1 && <span className={`w-0.5 min-h-[34px] flex-1 ${state === "done" ? "bg-green" : "bg-border"}`} />}
            </div>
            <div className="pb-[26px]">
              <div className={`text-[15px] font-bold ${state === "pend" ? "text-muted2" : "text-ink"}`}>{title}</div>
              <div className="font-mono text-[13px] text-muted2">{time}</div>
              {note && <div className="mt-0.5 text-[13.5px] text-muted">{note}</div>}
            </div>
          </div>;
        })}
      </div>
    </section>
  );
}
