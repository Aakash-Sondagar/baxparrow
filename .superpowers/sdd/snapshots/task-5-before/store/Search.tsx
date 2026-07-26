import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { t } from "../../styles/tokens";
import { useProducts } from "../../features/products/hooks";
import { ProductCard } from "../../components/ProductCard";
export default function Search() {
  const [q, setQ] = useState("leather");
  const [term, setTerm] = useState("leather");
  const { data } = useProducts(term ? { q: term } : {});
  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 60px" }}>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "6px 8px 6px 18px", display: "flex", alignItems: "center", gap: 12, maxWidth: 640, marginBottom: 8 }}>
        <SearchIcon size={20} color={t.muted2} />
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && setTerm(q)} style={{ flex: 1, border: "none", outline: "none", fontSize: 16, background: "none", padding: "10px 0" }} />
        <button onClick={() => setTerm(q)} style={{ background: t.ink, color: t.bg, border: "none", borderRadius: 9, padding: "11px 20px", fontWeight: 600, cursor: "pointer" }}>Search</button>
      </div>
      <p style={{ color: t.muted, margin: "0 0 22px" }}>{data?.total ?? 0} results for "<b style={{ color: t.ink }}>{term}</b>"</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
        {(data?.items ?? []).map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}
      </div>
    </section>
  );
}
