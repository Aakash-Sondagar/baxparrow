import { useSearchParams } from "react-router-dom";
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

  return (
    <section className="mx-auto max-w-[1240px] px-7 pt-6 pb-[60px]">
      <div className="mb-2 font-mono text-[13px] text-muted2">
        Home / {cat === "All" ? "All bags" : cat}
      </div>
      <h1 className="m-0 mb-1 font-display text-[34px] font-extrabold tracking-[-.02em]">
        {cat === "All" ? "All bags" : cat}
      </h1>
      <p className="m-0 mb-6 text-muted">{data?.total ?? 0} products</p>
      <div className="grid grid-cols-[236px_1fr] items-start gap-7">
        <aside className="sticky top-[112px] rounded-[15px] border border-border bg-card p-5">
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
        </aside>
        <div className="grid grid-cols-3 gap-[18px]">
          {(data?.items ?? []).map((p, i) => (
            <ProductCard key={p._id} p={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
