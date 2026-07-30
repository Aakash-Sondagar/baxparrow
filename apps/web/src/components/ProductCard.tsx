import { useNavigate } from "react-router-dom";
import { tile } from "../styles/tokens";
import { inr } from "../lib/format";
import { useCart } from "../features/cart/CartContext";

export type P = {
  _id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  images?: string[];
};

export function ProductCard({ p, index }: { p: P; index: number }) {
  const nav = useNavigate();
  const { add } = useCart();
  const onSale = p.mrp > p.price;
  const thumb = p.images?.[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-[15px] border border-border bg-card transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-cognac/25 hover:shadow-[0_12px_28px_rgba(28,25,23,0.08)]">
      <button
        onClick={() => nav("/p/" + p.slug)}
        className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden border-none p-0"
        style={!thumb ? { background: tile(index) } : undefined}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <span className="font-mono text-[11px] text-[#9C8B7A]">[ {p.category} ]</span>
        )}
        {onSale && (
          <span className="absolute top-3 left-3 rounded-[20px] bg-cognac px-[9px] py-1 font-mono text-[11px] font-bold text-white">
            SALE
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col px-4 pt-[15px] pb-[17px]">
        <div className="font-mono text-[11px] text-muted2">{p.category}</div>
        <button
          onClick={() => nav("/p/" + p.slug)}
          className="cursor-pointer border-none bg-none px-0 pt-0.5 pb-0 text-left font-display text-base font-bold text-ink transition-colors duration-200 hover:text-cognac"
        >
          {p.name}
        </button>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="font-display text-[17px] font-bold">{inr(p.price)}</span>
          {onSale && (
            <span className="text-[13px] text-muted2 line-through">{inr(p.mrp)}</span>
          )}
        </div>
        <button
          onClick={() => add(p._id)}
          className="mt-3 w-full cursor-pointer rounded-[10px] border-none bg-ink py-[11px] text-sm font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-cognac active:scale-[0.98]"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
