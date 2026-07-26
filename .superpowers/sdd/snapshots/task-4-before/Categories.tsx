import { t, tile } from "../../styles/tokens";
const CATS = [["School Bags",128],["Office Bags",96],["Handbags",142],["Leather Bags",74],["Sport Bags",88],["Suitcases",61],["Beach Bags",43],["Travel Bags",110],["Wallets & Purses",52],["Custom Bags",37]];
export default function Categories() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <p style={{ color: t.muted, margin: 0, fontSize: 14 }}>{CATS.length} categories · organizing 1,024 products</p>
        <button style={{ background: t.cognac, color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ New category</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {CATS.map(([name, count], i) => <div key={name} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ height: 96, background: tile(i) }} />
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 16 }}>{name}</div>
              <span style={{ fontFamily: t.monoFont, fontSize: 12, color: t.muted2 }}>{count} items</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={{ flex: 1, background: t.adminCanvas, border: `1px solid ${t.border}`, borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
              <button style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", color: t.muted2 }}>⋯</button>
            </div>
          </div>
        </div>)}
      </div>
    </>
  );
}
