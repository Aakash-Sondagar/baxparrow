import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useProducts } from "../../features/products/hooks";
import { ProductCard } from "../../components/ProductCard";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [term, setTerm] = useState(initial);
  const { data, isFetching } = useProducts(term ? { q: term } : {}, { enabled: !!term });

  useEffect(() => {
    const fromUrl = params.get("q") ?? "";
    setQ(fromUrl);
    setTerm(fromUrl);
  }, [params]);

  const run = (value: string) => {
    const next = value.trim();
    setTerm(next);
    const sp = new URLSearchParams();
    if (next) sp.set("q", next);
    setParams(sp, { replace: true });
  };

  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-7 pb-[60px] sm:px-7">
      <div className="mb-2 flex max-w-[640px] flex-col gap-2 rounded-[14px] border border-border bg-card py-1.5 pr-2 pl-3 sm:flex-row sm:items-center sm:gap-3 sm:pl-[18px]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SearchIcon size={20} className="shrink-0 text-muted2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(q)}
            placeholder="Search bags, SKU, category…"
            autoFocus
            className="min-w-0 flex-1 border-none bg-transparent px-0 py-2.5 text-base outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => run(q)}
          className="cursor-pointer rounded-[9px] border-none bg-ink px-5 py-[11px] font-semibold text-bg"
        >
          Search
        </button>
      </div>
      {term ? (
        <p className="m-0 mb-[22px] text-muted">
          {isFetching ? "Searching…" : `${data?.total ?? 0} results for `}
          {!isFetching && <b className="text-ink">{term}</b>}
        </p>
      ) : (
        <p className="m-0 mb-[22px] text-muted">Type a term and press Search.</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-[18px] md:grid-cols-3 lg:grid-cols-4">
        {term
          ? (data?.items ?? []).map((p, i) => <ProductCard key={p._id} p={p} index={i} />)
          : null}
      </div>
    </section>
  );
}
