import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkImport } from "../../features/products/mutations";

type ImportResult = { imported: number; errors: { row: number; error: string }[] };

export default function BulkUpload() {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    if (!file) return;
    setErr("");
    setBusy(true);
    setResult(null);
    try {
      const data = await bulkImport(file);
      setResult(data);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.errors?.length) {
        setResult({ imported: data.imported ?? 0, errors: data.errors });
      } else {
        setErr(data?.error ?? e?.message ?? "Import failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const template =
    "name,sku,category,price,mrp,stock,description,image_url\nBulk Sample Bag,BX-NEW-001,Office Bags,1499,2199,120,Handcrafted messenger,";

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "baxparrow-products-template.csv";
    a.click();
  };

  return (
    <div className="max-w-[760px]">
      <div className="mb-[18px] rounded-[14px] border border-border bg-card p-7">
        <div className="mb-1.5 font-display text-[17px] font-bold">Bulk upload products</div>
        <p className="m-0 mb-5 text-sm text-muted">
          Populate your catalog from a single CSV. The server validates every row and reports errors before importing.
          SKUs must be unique and uppercase (A–Z, 0–9, - _).
        </p>
        <label className="block cursor-pointer rounded-[14px] border-2 border-dashed border-[#D6CFC4] bg-[#FBFAF7] p-11 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
              setErr("");
            }}
            className="hidden"
          />
          <div className="mb-2.5 text-[34px] text-muted2">⇪</div>
          <div className="mb-1 font-semibold">{file ? file.name : "Drop your CSV here"}</div>
          <div className="text-[13px] text-muted">
            {file ? (
              "Click to choose a different file"
            ) : (
              <>
                or <span className="font-semibold text-cognac">browse files</span> · max 5,000 rows
              </>
            )}
          </div>
        </label>
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-[13px]">
          <a onClick={downloadTemplate} className="cursor-pointer font-semibold">
            ↓ Download CSV template
          </a>
          <span className="text-[#D6CFC4]">·</span>
          <span className="font-mono text-xs text-muted">
            name, sku, category, price, mrp, stock, description, image_url
          </span>
        </div>
      </div>
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="font-display text-base font-bold">{result ? "Import result" : "Ready to import"}</div>
          {result && (
            <span className={`font-mono text-xs ${result.errors.length ? "text-danger" : "text-green"}`}>
              {result.imported} imported · {result.errors.length} errors
            </span>
          )}
        </div>
        {result?.errors?.length ? (
          <div className="max-h-[240px] overflow-auto rounded-[10px] border border-[#F0D9D4] bg-[#FDF6F4] p-3.5">
            <div className="mb-2 text-[13px] font-semibold text-danger">Import blocked — fix these rows:</div>
            <ul className="m-0 list-none space-y-1.5 p-0">
              {result.errors.map((e, i) => (
                <li key={`${e.row}-${i}`} className="font-mono text-[12px] text-danger">
                  {e.row > 0 ? `Row ${e.row}: ` : ""}
                  {e.error}
                </li>
              ))}
            </ul>
          </div>
        ) : result ? (
          <div className="text-sm text-green">✓ Imported {result.imported} products successfully.</div>
        ) : (
          <p className="m-0 text-[13px] text-muted">Choose a CSV above, then import.</p>
        )}
        {err && <div className="mt-2.5 text-[13px] text-danger">{err}</div>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => nav("/admin/products")}
            className="cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 font-semibold"
          >
            {result && !result.errors.length ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={!file || busy}
            onClick={run}
            className="cursor-pointer rounded-[10px] border-none bg-cognac px-[22px] py-2.5 font-bold text-white disabled:opacity-60"
          >
            {busy ? "Importing…" : "Import products"}
          </button>
        </div>
      </div>
    </div>
  );
}
