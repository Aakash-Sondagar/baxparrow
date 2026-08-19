import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addressSchema, ADDRESS_LIMITS } from "@baxparrow/shared";
import { tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useAuth } from "../../features/auth/AuthContext";
import { useCart } from "../../features/cart/CartContext";
import { createOrder, verifyPayment } from "../../features/orders/api";
import { openRazorpay } from "../../lib/razorpay";

const fieldOk =
  "mt-1.5 w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-cognac";
const fieldBad =
  "mt-1.5 w-full rounded-[10px] border border-danger px-3.5 py-3 text-sm outline-none focus:border-danger";
const label = "text-[13px] text-text3";

type Form = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
};

const EMPTY: Form = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  pin: "",
};

const FIELD_KEYS = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "pin",
] as const;

function mapApiFields(fields?: Record<string, string>): Partial<Record<keyof Form, string>> {
  if (!fields) return {};
  const out: Partial<Record<keyof Form, string>> = {};
  for (const k of FIELD_KEYS) {
    const msg = fields[`address.${k}`] ?? fields[k];
    if (msg) out[k] = msg;
  }
  return out;
}

function sanitize(key: keyof Form, raw: string): string {
  let v = raw;
  if (key === "pin" || key === "phone") v = v.replace(/\D/g, "");
  if (key === "email") v = v.replace(/\s/g, "");
  const max = ADDRESS_LIMITS[key];
  if (max && v.length > max) v = v.slice(0, max);
  return v;
}

export default function Checkout() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { items, amounts, count, clear } = useCart();
  const [form, setForm] = useState<Form>(EMPTY);
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { subtotal, mrp, discountPct, discount, shipping, gst, total } = amounts;

  useEffect(() => {
    if (!user) return;
    setForm((f) => {
      if (f.email || f.firstName) return f;
      const parts = (user.name || "").trim().split(/\s+/);
      return {
        ...f,
        email: user.email || "",
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      };
    });
  }, [user]);

  const set =
    (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = sanitize(k, e.target.value);
      setForm((f) => ({ ...f, [k]: value }));
      if (fieldErr[k]) setFieldErr((fe) => ({ ...fe, [k]: undefined }));
      if (err) setErr("");
    };

  const validateLocal = () => {
    const trimmed: Form = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      pin: form.pin.trim(),
    };
    setForm(trimmed);
    const parsed = addressSchema.safeParse(trimmed);
    if (parsed.success) {
      setFieldErr({});
      setErr("");
      return parsed.data;
    }
    const next: Partial<Record<keyof Form, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "") as keyof Form;
      if (key && FIELD_KEYS.includes(key as any) && !next[key]) next[key] = issue.message;
    }
    setFieldErr(next);
    const list = FIELD_KEYS.map((k) => next[k]).filter(Boolean) as string[];
    setErr(list.length ? list.join(" · ") : "Please fix the highlighted fields");
    return null;
  };

  const pay = async () => {
    setErr("");
    const address = validateLocal();
    if (!address) return;

    setBusy(true);
    try {
      const { orderNo, razorpayOrderId, amount } = await createOrder(address, items);
      openRazorpay({
        orderId: razorpayOrderId,
        amount,
        name: address.firstName,
        email: address.email,
        contact: address.phone,
        onSuccess: async (r) => {
          try {
            await verifyPayment({ orderNo, ...r });
            await clear();
            nav("/order/" + orderNo + "/confirmed");
          } catch (e: any) {
            setErr(e?.response?.data?.error ?? "Payment verification failed");
            setBusy(false);
          }
        },
        onFailed: (reason) => {
          setErr(reason);
          setBusy(false);
        },
        onDismiss: () => {
          setErr("Payment cancelled");
          setBusy(false);
        },
      });
    } catch (e: any) {
      const data = e?.response?.data;
      const mapped = mapApiFields(data?.fields);
      if (Object.keys(mapped).length) {
        setFieldErr(mapped);
        setErr(Object.values(mapped).join(" · "));
      } else {
        setErr(data?.error ?? "Could not start payment");
      }
      setBusy(false);
    }
  };

  const req = (text: string) => (
    <>
      {text} <span className="text-danger">*</span>
    </>
  );

  const inputClass = (k: keyof Form) => (fieldErr[k] ? fieldBad : fieldOk);

  return (
    <section className="mx-auto max-w-[1100px] px-4 pt-7 pb-[60px] sm:px-7">
      <h1 className="m-0 mb-6 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[32px]">
        Checkout
      </h1>
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-[15px] border border-border bg-card p-4 sm:p-6">
            <div className="mb-[18px] font-display text-[17px] font-bold">Contact &amp; delivery</div>
            {!user && (
              <p className="m-0 mb-3 text-[12.5px] text-muted2">
                Have an account?{" "}
                <Link to="/login?next=/checkout" className="font-semibold text-cognac">
                  Log in
                </Link>{" "}
                to save orders — or checkout as guest.
              </p>
            )}
            <p className="m-0 mb-4 text-[12px] text-muted2">
              <span className="text-danger">*</span> Required fields
            </p>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>{req("Email")}</label>
                <input
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@email.com"
                  type="email"
                  maxLength={ADDRESS_LIMITS.email}
                  autoComplete="email"
                  className={inputClass("email")}
                />
                {fieldErr.email && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.email}</div>
                )}
              </div>
              <div>
                <label className={label}>{req("First name")}</label>
                <input
                  value={form.firstName}
                  onChange={set("firstName")}
                  maxLength={ADDRESS_LIMITS.firstName}
                  autoComplete="given-name"
                  className={inputClass("firstName")}
                />
                {fieldErr.firstName && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.firstName}</div>
                )}
              </div>
              <div>
                <label className={label}>{req("Last name")}</label>
                <input
                  value={form.lastName}
                  onChange={set("lastName")}
                  maxLength={ADDRESS_LIMITS.lastName}
                  autoComplete="family-name"
                  className={inputClass("lastName")}
                />
                {fieldErr.lastName && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.lastName}</div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={label}>{req("Mobile number")}</label>
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={ADDRESS_LIMITS.phone}
                  autoComplete="tel"
                  className={inputClass("phone")}
                />
                {fieldErr.phone && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.phone}</div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={label}>{req("Address")}</label>
                <input
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Flat, building, street"
                  maxLength={ADDRESS_LIMITS.address}
                  autoComplete="street-address"
                  className={inputClass("address")}
                />
                {fieldErr.address && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.address}</div>
                )}
              </div>
              <div>
                <label className={label}>{req("City")}</label>
                <input
                  value={form.city}
                  onChange={set("city")}
                  maxLength={ADDRESS_LIMITS.city}
                  autoComplete="address-level2"
                  className={inputClass("city")}
                />
                {fieldErr.city && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.city}</div>
                )}
              </div>
              <div>
                <label className={label}>{req("PIN code")}</label>
                <input
                  value={form.pin}
                  onChange={set("pin")}
                  placeholder="400008"
                  inputMode="numeric"
                  maxLength={ADDRESS_LIMITS.pin}
                  autoComplete="postal-code"
                  className={inputClass("pin")}
                />
                {fieldErr.pin && (
                  <div className="mt-1 text-[12px] text-danger">{fieldErr.pin}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 z-10 rounded-[15px] border border-border bg-card p-5 sm:p-6 lg:top-[112px] lg:bottom-auto">
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
                <div className="min-w-0 flex-1 text-[13px]">
                  <div className="truncate font-semibold">{l.name}</div>
                  <div className="text-muted2">
                    Qty {l.qty}
                    {l.color ? ` · ${l.color}` : ""}
                    {l.size ? ` · ${l.size}` : ""}
                  </div>
                </div>
                <div className="shrink-0 font-body text-[13px] tabular-nums">{inr(l.lineTotal)}</div>
              </div>
            ))}
          </div>
          <div className="mb-2.5 flex justify-between border-t border-border pt-3.5 text-sm text-text3">
            <span>MRP</span>
            <span className="font-body tabular-nums line-through">
              {inr(mrp > 0 ? mrp : subtotal)}
            </span>
          </div>
          {discountPct > 0 && (
            <div className="mb-2.5 flex justify-between text-sm text-green">
              <span>Discount (−{discountPct}% off)</span>
              <span className="font-body tabular-nums">−{inr(discount)}</span>
            </div>
          )}
          <div className="mb-2.5 flex justify-between text-sm text-text3">
            <span>Selling price</span>
            <span className="font-body tabular-nums">{inr(subtotal)}</span>
          </div>
          <div className="mb-2.5 flex justify-between text-sm text-text3">
            <span>GST (18% incl.)</span>
            <span className="font-body tabular-nums">{inr(gst)}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm text-text3">
            <span>Shipping</span>
            <span className={`font-body tabular-nums ${shipping === 0 ? "text-green" : ""}`}>
              {shipping === 0 ? "FREE" : inr(shipping)}
            </span>
          </div>
          <div className="mb-5 flex items-baseline justify-between">
            <span className="font-bold">Total</span>
            <span className="font-display text-2xl font-extrabold">{inr(total)}</span>
          </div>
          {err && <div className="mb-3 text-[13px] leading-snug text-danger">{err}</div>}
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
