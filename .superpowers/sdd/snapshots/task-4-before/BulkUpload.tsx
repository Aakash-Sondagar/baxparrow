import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "../../styles/tokens";
import { bulkImport } from "../../features/products/mutations";
export default function BulkUpload() {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: any[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!file) return;
    setErr(""); setBusy(true);
    try { setResult(await bulkImport(file)); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Import failed"); }
    finally { setBusy(false); }
  };
  const template = "name,sku,category,price,mrp,stock,description,image_url\nCortez Messenger,BX-OFF-01,Office Bags,1499,2199,120,Handcrafted messenger,";
  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "baxparrow-products-template.csv"; a.click();
  };
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, padding: 28, marginBottom: 18 }}>
        <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Bulk upload products</div>
        <p style={{ color: t.muted, fontSize: 14, margin: "0 0 20px" }}>Populate your catalog from a single CSV. The server validates every row and reports errors before importing.</p>
        <label style={{ border: "2px dashed #D6CFC4", borderRadius: 14, padding: 44, textAlign: "center", background: "#FBFAF7", display: "block", cursor: "pointer" }}>
          <input type="file" accept=".csv" onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); }} style={{ display: "none" }} />
          <div style={{ fontSize: 34, marginBottom: 10, color: t.muted2 }}>⇪</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{file ? file.name : "Drop your CSV here"}</div>
          <div style={{ fontSize: 13, color: t.muted }}>{file ? "Click to choose a different file" : <>or <span style={{ color: t.cognac, fontWeight: 600 }}>browse files</span> · max 5,000 rows</>}</div>
        </label>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><a onClick={downloadTemplate} style={{ cursor: "pointer", fontWeight: 600 }}>↓ Download CSV template</a><span style={{ color: "#D6CFC4" }}>·</span><span style={{ color: t.muted, fontFamily: t.monoFont, fontSize: 12 }}>name, sku, category, price, mrp, stock, description, image_url</span></div>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 16 }}>{result ? "Import result" : "Ready to import"}</div>
          {result && <span style={{ fontFamily: t.monoFont, fontSize: 12, color: result.errors.length ? t.danger : t.green }}>{result.imported} imported · {result.errors.length} errors</span>}
        </div>
        {result?.errors?.length ? (
          <div style={{ fontSize: 13, color: t.danger }}>Rows with errors: {result.errors.map((e: any) => e.row).join(", ")}. Fix and re-upload.</div>
        ) : result ? (
          <div style={{ fontSize: 14, color: t.green }}>✓ Imported {result.imported} products successfully.</div>
        ) : (
          <p style={{ color: t.muted, fontSize: 13, margin: 0 }}>Choose a CSV above, then import.</p>
        )}
        {err && <div style={{ color: t.danger, fontSize: 13, marginTop: 10 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={() => nav("/admin/products")} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 10, padding: "11px 20px", fontWeight: 600, cursor: "pointer" }}>{result ? "Done" : "Cancel"}</button>
          <button disabled={!file || busy} onClick={run} style={{ background: t.cognac, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, cursor: "pointer", opacity: !file || busy ? .6 : 1 }}>{busy ? "Importing…" : "Import products"}</button>
        </div>
      </div>
    </div>
  );
}
