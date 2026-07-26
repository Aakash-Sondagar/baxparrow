import { useNavigate } from "react-router-dom";
import { t, tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useProducts } from "../../features/products/hooks";
export default function Products() {
  const nav = useNavigate();
  const { data } = useProducts({ limit: "12" });
  const items = data?.items ?? [];
  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
        <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 14px", fontSize: 13, color: t.muted2, flex: 1, maxWidth: 320 }}>⌕ Search products…</div>
        <button style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Filter</button>
        <button onClick={() => nav("/admin/products/bulk")} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", marginLeft: "auto" }}>⇪ Bulk upload</button>
        <button onClick={() => nav("/admin/products/new")} style={{ background: t.cognac, color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add product</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr style={{ textAlign: "left", color: t.muted2, fontFamily: t.monoFont, fontSize: 11, background: "#FBFAF7" }}>{["PRODUCT","SKU","CATEGORY","PRICE","STOCK","STATUS"].map(h => <th key={h} style={{ padding: "13px 22px", fontWeight: 400 }}>{h}</th>)}</tr></thead>
          <tbody>{items.map((p, i) => {
            const out = p.stock === 0, low = p.stock > 0 && p.stock < 20;
            return <tr key={p._id} style={{ borderTop: "1px solid #F0EBE3" }}>
              <td style={{ padding: "12px 22px" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 40, height: 40, borderRadius: 9, background: tile(i), flexShrink: 0 }} /><span style={{ fontWeight: 600 }}>{p.name}</span></div></td>
              <td style={{ padding: 12, fontFamily: t.monoFont, color: t.muted }}>{p.sku}</td>
              <td style={{ padding: 12, color: t.text3 }}>{p.category}</td>
              <td style={{ padding: 12, fontFamily: t.monoFont }}>{inr(p.price)}</td>
              <td style={{ padding: 12, fontFamily: t.monoFont, color: out ? t.danger : low ? t.amber : t.text3 }}>{out ? "Out" : p.stock}</td>
              <td style={{ padding: "12px 22px" }}><span style={{ background: out ? "#F3EFEA" : t.greenBg, color: out ? t.muted : t.green, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20 }}>{out ? "Draft" : "Active"}</span></td>
            </tr>;
          })}</tbody>
        </table>
        <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F0EBE3", fontSize: 13, color: t.muted }}>
          <span>Showing 1–{items.length} of {data?.total ?? 0}</span>
          <div style={{ display: "flex", gap: 6 }}><button style={{ border: `1px solid ${t.border}`, background: "#fff", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Prev</button><button style={{ border: `1px solid ${t.cognac}`, background: t.cognac, color: "#fff", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Next</button></div>
        </div>
      </div>
    </>
  );
}
