import { useNavigate } from "react-router-dom";
import { tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useCart } from "../../features/cart/CartContext";

function isHex(c: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c);
}

export default function CartPage() {
  const nav = useNavigate();
  const { items, amounts, setQty, remove, loading } = useCart();
  const { subtotal, shipping, gst, total } = amounts;

  if (loading) {
    return (
      <section className="mx-auto max-w-[1100px] px-4 pt-7 pb-[60px] sm:px-7">
        <h1 className="m-0 mb-6 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
          Your cart
        </h1>
        <div className="text-sm text-muted">Loading cart…</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1100px] px-4 pt-7 pb-[60px] sm:px-7">
      <h1 className="m-0 mb-6 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
        Your cart
      </h1>
      {items.length === 0 ? (
        <div className="rounded-[15px] border border-border bg-card p-10 text-center sm:p-16">
          <div className="mb-2 font-display text-xl font-bold">Your cart is empty</div>
          <p className="m-0 mb-5 text-muted">Explore our bestsellers and add something you love.</p>
          <button
            onClick={() => nav("/shop")}
            className="cursor-pointer rounded-[11px] border-none bg-ink px-[26px] py-[13px] font-semibold text-bg"
          >
            Shop bags
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-3.5">
            {items.map((l) => (
              <div
                key={l.lineKey}
                className="flex flex-wrap items-center gap-3 rounded-[15px] border border-border bg-card p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
              >
                {l.image ? (
                  <img
                    src={l.image}
                    alt=""
                    className="h-[72px] w-[72px] shrink-0 rounded-[11px] object-cover sm:h-[88px] sm:w-[88px]"
                  />
                ) : (
                  <div
                    className="h-[72px] w-[72px] shrink-0 rounded-[11px] sm:h-[88px] sm:w-[88px]"
                    style={{ background: tile(l.toneIndex) }}
                  />
                )}
                <div className="min-w-0 flex-1 basis-[calc(100%-5.5rem)] sm:basis-auto">
                  <div className="font-mono text-[11px] text-muted2">{l.cat}</div>
                  <div className="font-display text-base font-bold">{l.name}</div>
                  {(l.color || l.size) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-text3">
                      {l.color && (
                        <span className="inline-flex items-center gap-1.5">
                          Colour:{" "}
                          {isHex(l.color) ? (
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                              style={{ background: l.color }}
                              title={l.color}
                            />
                          ) : (
                            <b className="font-semibold text-ink">{l.color}</b>
                          )}
                          {isHex(l.color) && (
                            <span className="font-mono text-[11px] text-muted2">{l.color}</span>
                          )}
                        </span>
                      )}
                      {l.color && l.size && <span className="text-muted2">·</span>}
                      {l.size && (
                        <span>
                          Size: <b className="font-semibold text-ink">{l.size}</b>
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-0.5 text-[13px] text-muted">{inr(l.price)} each</div>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                  <div className="flex items-center overflow-hidden rounded-[9px] border border-border">
                    <button
                      onClick={() => setQty(l.lineKey, -1)}
                      className="h-[34px] w-[34px] cursor-pointer border-none bg-bg text-lg text-text2"
                    >
                      −
                    </button>
                    <span className="w-[34px] text-center font-mono font-bold">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.lineKey, 1)}
                      className="h-[34px] w-[34px] cursor-pointer border-none bg-bg text-lg text-text2"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-auto text-right font-display text-base font-bold sm:w-[90px]">
                    {inr(l.lineTotal)}
                  </div>
                  <button
                    onClick={() => remove(l.lineKey)}
                    className="cursor-pointer border-none bg-none text-lg text-muted2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="sticky bottom-0 z-10 rounded-[15px] border border-border bg-card p-5 sm:p-6 lg:top-[112px] lg:bottom-auto">
            <div className="mb-[18px] font-display text-lg font-bold">Order summary</div>
            {(
              [
                ["Subtotal", inr(subtotal)],
                ["Shipping", shipping === 0 ? "FREE" : inr(shipping)],
                ["GST (18%)", inr(gst)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="mb-[11px] flex justify-between text-sm text-text3">
                <span>{k}</span>
                <span
                  className={`font-body tabular-nums ${
                    k === "Shipping" && shipping === 0 ? "text-green" : "text-text3"
                  }`}
                >
                  {v}
                </span>
              </div>
            ))}
            <div className="mb-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-base font-bold">Total</span>
              <span className="font-display text-2xl font-extrabold">{inr(total)}</span>
            </div>
            <button
              onClick={() => nav("/checkout")}
              className="w-full cursor-pointer rounded-xl border-none bg-ink py-[15px] text-[15px] font-bold text-bg"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
