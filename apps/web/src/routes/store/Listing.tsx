import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useProducts } from "../../features/products/hooks";
import { ProductCard } from "../../components/ProductCard";

const CATS = [
  "All",
  "School Bags",
  "Office Bags",
  "Handbags",
  "Leather Bags",
  "Sport Bags",
  "Suitcases",
  "Beach Bags",
  "Travel Bags",
  "Wallets",
];
const PRICES: [string, string, string][] = [
  ["all", "All prices", ""],
  ["u1000", "Under ₹1,000", "0-1000"],
  ["1to2", "₹1,000 – ₹2,000", "1000-2000"],
  ["2to4", "₹2,000 – ₹4,000", "2000-4000"],
  ["o4", "Over ₹4,000", "4000-"],
];

export default function Listing() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cat = params.get("category") || "All";
  const price = params.get("price") || "all";
  const range = PRICES.find((p) => p[0] === price)?.[2] ?? "";
  const [min, max] = range.split("-");
  const { data } = useProducts({
    category: cat,
    ...(min && { min }),
    ...(max && { max }),
  });

  const setCat = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === "All") next.delete("category");
    else next.set("category", c);
    setParams(next, { replace: true });
  };
  const setPrice = (k: string) => {
    const next = new URLSearchParams(params);
    if (k === "all") next.delete("price");
    else next.set("price", k);
    setParams(next, { replace: true });
  };

  const fBtn = (active: boolean) =>
    `cursor-pointer rounded-lg border-none px-2.5 py-2 text-left text-[13.5px] ${
      active ? "bg-[#F6ECE4] font-semibold text-cognac" : "bg-none font-normal text-text3"
    }`;

  const filters = (
    <>
      <div className="mb-3.5 font-display text-[15px] font-bold">Category</div>
      <div className="mb-[22px] flex flex-col gap-0.5">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={fBtn(cat === c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="mb-3.5 font-display text-[15px] font-bold">Price</div>
      <div className="flex flex-col gap-0.5">
        {PRICES.map(([k, l]) => (
          <button key={k} onClick={() => setPrice(k)} className={fBtn(price === k)}>
            {l}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-6 pb-[60px] sm:px-7">
      <div className="mb-2 font-mono text-[13px] text-muted2">
        Home / {cat === "All" ? "All bags" : cat}
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
            {cat === "All" ? "All bags" : cat}
          </h1>
          <p className="m-0 text-muted">{data?.total ?? 0} products</p>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] font-semibold text-text2 lg:hidden"
        >
          <SlidersHorizontal size={16} />
          Filters
          {(cat !== "All" || price !== "all") && (
            <span className="h-1.5 w-1.5 rounded-full bg-cognac" />
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-5 rounded-[15px] border border-border bg-card p-5 lg:hidden">
          {filters}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[236px_1fr]">
        <aside className="sticky top-[112px] hidden rounded-[15px] border border-border bg-card p-5 lg:block">
          {filters}
        </aside>
        <div className="grid grid-cols-2 gap-3 sm:gap-[18px] md:grid-cols-3">
          {(data?.items ?? []).map((p, i) => (
            <ProductCard key={p._id} p={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
