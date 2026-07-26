import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useProduct } from "../../features/products/hooks";
import { useCart } from "../../features/cart/CartContext";

export default function Product() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data: p } = useProduct(slug);
  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);

  if (!p) return <div className="p-[60px] text-center text-muted">Loading…</div>;

  const images: string[] = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const colors: string[] = Array.isArray(p.colors) ? p.colors.filter(Boolean) : [];
  const sizes: string[] = Array.isArray(p.sizes) ? p.sizes.filter(Boolean) : [];
  const main = images[Math.min(imgIdx, Math.max(0, images.length - 1))];
  const off = p.mrp > 0 ? Math.round((1 - p.price / p.mrp) * 100) : 0;

  const addToCart = () =>
    add(p._id, {
      color: colors[colorIdx],
      size: sizes[sizeIdx],
    });

  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-6 pb-[60px] sm:px-7">
      <div className="mb-4 font-mono text-[13px] text-muted2">
        {p.category} / {p.name}
      </div>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-11">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {images.length > 1 && (
            <div className="flex flex-row gap-2.5 overflow-x-auto sm:flex-col">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border-2 p-0 sm:h-16 sm:w-16 ${
                    i === imgIdx ? "border-cognac" : "border-border"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div
            className="relative grid aspect-[1/1.05] flex-1 place-items-center overflow-hidden rounded-[18px] border border-border"
            style={!main ? { background: tile(0) } : undefined}
          >
            {main ? (
              <img src={main} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-xs text-[#9C8B7A]">[ {p.name} — product shot ]</span>
            )}
          </div>
        </div>
        <div>
          <div className="font-mono text-xs text-muted2">
            {p.category} · SKU {p.sku}
          </div>
          <h1 className="mt-2 mb-2.5 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-4xl">
            {p.name}
          </h1>
          <div className="mb-2 flex items-baseline gap-3">
            <span className="font-display text-[30px] font-extrabold">{inr(p.price)}</span>
            {p.mrp > p.price && (
              <>
                <span className="text-[17px] text-muted2 line-through">{inr(p.mrp)}</span>
                {off > 0 && (
                  <span className="rounded-[20px] bg-green-bg px-2.5 py-[3px] text-[13px] font-bold text-green">
                    {off}% off
                  </span>
                )}
              </>
            )}
          </div>
          {p.description && (
            <p className="mt-3.5 mb-[22px] text-[15px] leading-[1.65] text-text3">{p.description}</p>
          )}
          {colors.length > 0 && (
            <div className="mb-5">
              <div className="mb-[9px] text-[13px] font-semibold text-text2">Colour</div>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c, i) => {
                  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c);
                  return (
                    <button
                      key={c + i}
                      type="button"
                      onClick={() => setColorIdx(i)}
                      title={c}
                      className={`cursor-pointer ${
                        isHex
                          ? `h-[34px] w-[34px] rounded-full border-2 ${
                              i === colorIdx ? "border-cognac" : "border-transparent"
                            }`
                          : `min-w-[52px] rounded-[9px] border-[1.5px] px-3 py-2 text-[13px] font-semibold ${
                              i === colorIdx
                                ? "border-ink bg-ink text-white"
                                : "border-border bg-white text-text2"
                            }`
                      }`}
                      style={isHex ? { background: c } : undefined}
                    >
                      {!isHex && c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div className="mb-[26px]">
              <div className="mb-[9px] text-[13px] font-semibold text-text2">Size</div>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map((s, i) => (
                  <button
                    key={s + i}
                    type="button"
                    onClick={() => setSizeIdx(i)}
                    className={`min-w-[52px] cursor-pointer rounded-[9px] border-[1.5px] px-3.5 py-2.5 font-semibold ${
                      i === sizeIdx
                        ? "border-ink bg-ink text-white"
                        : "border-border bg-white text-text2"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={addToCart}
              className="flex-1 cursor-pointer rounded-xl border-none bg-ink p-4 text-[15px] font-bold text-bg"
            >
              Add to cart · {inr(p.price)}
            </button>
            <button
              onClick={() => {
                addToCart();
                nav("/checkout");
              }}
              className="flex-1 cursor-pointer rounded-xl border-none bg-cognac p-4 text-[15px] font-bold text-white"
            >
              Buy now
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-2 text-[13px] text-text3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-1">
            <span>✓ Free shipping over ₹999</span>
            <span>✓ 7-day returns</span>
            <span>✓ 1-year warranty</span>
          </div>
        </div>
      </div>
    </section>
  );
}
