import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useCart } from "../../features/cart/CartContext";
import { createOrder, verifyPayment } from "../../features/orders/api";
import { openRazorpay } from "../../lib/razorpay";

const field =
  "mt-1.5 w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none";
const label = "text-[13px] text-text3";

export default function Checkout() {
  const nav = useNavigate();
  const { items, amounts, count, clear } = useCart();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    pin: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const { subtotal, shipping, gst, total } = amounts;

  const pay = async () => {
    setErr("");
    setBusy(true);
    try {
      const { orderNo, razorpayOrderId, amount } = await createOrder(form, items);
      openRazorpay({
        orderId: razorpayOrderId,
        amount,
        name: form.firstName,
        email: form.email,
        onSuccess: async (r) => {
          await verifyPayment({ orderNo, ...r });
          await clear();
          nav("/order/" + orderNo + "/confirmed");
        },
        onDismiss: () => setBusy(false),
      });
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Could not start payment");
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1100px] px-7 pt-7 pb-[60px]">
      <h1 className="m-0 mb-6 font-display text-[32px] font-extrabold tracking-[-.02em]">
        Checkout
      </h1>
      <div className="grid grid-cols-[1fr_360px] items-start gap-7">
        <div className="flex flex-col gap-5">
          <div className="rounded-[15px] border border-border bg-card p-6">
            <div className="mb-[18px] font-display text-[17px] font-bold">Contact &amp; delivery</div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className={label}>Email</label>
                <input
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@email.com"
                  className={field}
                />
              </div>
              <div>
                <label className={label}>First name</label>
                <input value={form.firstName} onChange={set("firstName")} className={field} />
              </div>
              <div>
                <label className={label}>Last name</label>
                <input value={form.lastName} onChange={set("lastName")} className={field} />
              </div>
              <div className="col-span-2">
                <label className={label}>Address</label>
                <input
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Flat, building, street"
                  className={field}
                />
              </div>
              <div>
                <label className={label}>City</label>
                <input value={form.city} onChange={set("city")} className={field} />
              </div>
              <div>
                <label className={label}>PIN code</label>
                <input
                  value={form.pin}
                  onChange={set("pin")}
                  placeholder="400008"
                  className={field}
                />
              </div>
            </div>
          </div>
          <div className="rounded-[15px] border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-[17px] font-bold">Payment</div>
              <span className="font-mono text-xs text-green">🔒 Secured by Razorpay</span>
            </div>
            <div className="flex items-center gap-3 rounded-[11px] border-2 border-cognac bg-[#FBF2EB] px-4 py-3.5">
              <span className="h-[18px] w-[18px] rounded-full border-[5px] border-cognac" />
              <span className="font-semibold">UPI · Cards · Netbanking</span>
              <span className="text-[13px] text-muted">via Razorpay Checkout</span>
            </div>
          </div>
        </div>
        <div className="sticky top-[112px] rounded-[15px] border border-border bg-card p-6">
          <div className="mb-4 font-display text-lg font-bold">{count} items</div>
          <div className="mb-4 flex max-h-[220px] flex-col gap-3 overflow-auto">
            {items.map((l) => (
              <div key={l.lineKey} className="flex items-center gap-3">
                {l.image ? (
                  <img src={l.image} alt="" className="h-12 w-12 shrink-0 rounded-[9px] object-cover" />
                ) : (
                  <div
                    className="h-12 w-12 shrink-0 rounded-[9px]"
                    style={{ background: tile(l.toneIndex) }}
                  />
                )}
                <div className="flex-1 text-[13px]">
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-muted2">
                    Qty {l.qty}
                    {l.color ? ` · ${l.color}` : ""}
                    {l.size ? ` · ${l.size}` : ""}
                  </div>
                </div>
                <div className="font-body text-[13px] tabular-nums">{inr(l.lineTotal)}</div>
              </div>
            ))}
          </div>
          <div className="mb-2.5 flex justify-between border-t border-border pt-3.5 text-sm text-text3">
            <span>Subtotal</span>
            <span className="font-body tabular-nums">{inr(subtotal)}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm text-text3">
            <span>Shipping + GST</span>
            <span className="font-body tabular-nums">{inr(shipping + gst)}</span>
          </div>
          <div className="mb-5 flex items-baseline justify-between">
            <span className="font-bold">Total</span>
            <span className="font-display text-2xl font-extrabold">{inr(total)}</span>
          </div>
          {err && <div className="mb-3 text-[13px] text-danger">{err}</div>}
          <button
            disabled={busy || !items.length}
            onClick={pay}
            className={`w-full rounded-xl border-none bg-cognac p-4 text-[15px] font-bold text-white ${
              busy ? "cursor-default" : "cursor-pointer"
            } ${busy || !items.length ? "opacity-60" : "opacity-100"}`}
          >
            {busy ? "Processing…" : "Pay " + inr(total)}
          </button>
        </div>
      </div>
    </section>
  );
}
