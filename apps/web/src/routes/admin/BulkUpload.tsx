import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MAX_PRODUCT_IMAGES } from "@baxparrow/shared";
import { bulkImport } from "../../features/products/mutations";
import {
  CSV_TEMPLATE,
  buildPreflight,
  mergeImageUrlsIntoCsv,
  parseVariantImageName,
} from "../../features/products/bulk";
import { uploadImage } from "../../lib/cloudinary";

type ImportResult = { imported: number; variantCount?: number; errors: { row: number; error: string }[] };
type ImagesBySku = Record<string, string[]>;

const btnGhost =
  "cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 font-semibold disabled:opacity-60";
const btnPrimary =
  "cursor-pointer rounded-[10px] border-none bg-cognac px-[22px] py-2.5 font-bold text-white disabled:opacity-60";

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export default function BulkUpload() {
  const nav = useNavigate();
  const imgInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [imagesBySku, setImagesBySku] = useState<ImagesBySku>({});
  const [badNames, setBadNames] = useState<string[]>([]);
  const [uploadErr, setUploadErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProg, setUploadProg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const skuCount = Object.keys(imagesBySku).length;
  const imageCount = Object.values(imagesBySku).reduce((a, u) => a + u.length, 0);

  const preflight = useMemo(() => {
    if (!csvText) return null;
    return buildPreflight(csvText, imagesBySku);
  }, [csvText, imagesBySku]);

  const onImages = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploadErr("");
    setBadNames([]);
    const files = [...list];
    const recognized: { file: File; sku: string; index: number }[] = [];
    const bad: string[] = [];
    for (const f of files) {
      const parsed = parseVariantImageName(f.name);
      if (!parsed) bad.push(f.name);
      else recognized.push({ file: f, ...parsed });
    }
    setBadNames(bad);
    if (!recognized.length) {
      if (imgInput.current) imgInput.current.value = "";
      return;
    }
    setUploading(true);
    let done = 0;
    try {
      const urls = await mapPool(recognized, 4, async (item) => {
        const url = await uploadImage(item.file);
        done++;
        setUploadProg(`${done}/${recognized.length}`);
        return { ...item, url };
      });
      setImagesBySku((prev) => {
        const next: ImagesBySku = { ...prev };
        for (const item of urls) {
          const slots = [...(next[item.sku] ?? [])];
          slots[item.index - 1] = item.url;
          next[item.sku] = slots.filter(Boolean).slice(0, MAX_PRODUCT_IMAGES);
        }
        return next;
      });
    } catch (e: any) {
      setUploadErr(e?.message ?? "Upload failed — is Cloudinary configured?");
    } finally {
      setUploading(false);
      setUploadProg("");
      if (imgInput.current) imgInput.current.value = "";
    }
  };

  const removeUrl = (sku: string, url: string) => {
    setImagesBySku((prev) => {
      const next = { ...prev };
      const kept = (next[sku] ?? []).filter((u) => u !== url);
      if (kept.length) next[sku] = kept;
      else delete next[sku];
      return next;
    });
  };

  const pickCsv = async (f: File | null) => {
    setFile(f);
    setResult(null);
    setErr("");
    if (!f) {
      setCsvText("");
      return;
    }
    setCsvText(await f.text());
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "baxparrow-products-template.csv";
    a.click();
  };

  const run = async () => {
    if (!file || !csvText) return;
    setErr("");
    setBusy(true);
    setResult(null);
    try {
      const merged = mergeImageUrlsIntoCsv(csvText, imagesBySku);
      const payload = new File([merged], file.name || "products.csv", { type: "text/csv" });
      const data = await bulkImport(payload);
      setResult(data);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.errors?.length) {
        setResult({ imported: data.imported ?? 0, variantCount: data.variantCount, errors: data.errors });
      } else {
        setErr(data?.error ?? e?.message ?? "Import failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[920px]">
      <div className="mb-[18px] flex items-center gap-3 text-[13px]">
        {[1, 2].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => n === 1 && setStep(1)}
            className={`flex items-center gap-2 border-0 bg-transparent p-0 ${n === 1 ? "cursor-pointer" : "cursor-default"}`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-bold ${
                step === n ? "bg-cognac text-white" : step > n ? "bg-green text-white" : "bg-admin-canvas text-muted2"
              }`}
            >
              {n}
            </span>
            <span className={step === n ? "font-semibold" : "text-muted"}>
              {n === 1 ? "Images" : "Catalogue"}
            </span>
            {n === 1 && <span className="mx-1 text-[#D6CFC4]">—</span>}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="mb-[18px] rounded-[14px] border border-border bg-card p-7">
          <div className="mb-1.5 font-display text-[17px] font-bold">Step 1 · Colour images</div>
          <p className="m-0 mb-4 text-sm text-muted">
            Name files <span className="font-mono text-[12px] text-ink">SKU_1.jpg</span>,{" "}
            <span className="font-mono text-[12px] text-ink">SKU_2.jpg</span> (max {MAX_PRODUCT_IMAGES} per colour).
            Example: <span className="font-mono text-[12px]">BX-MSG-BRN_1.jpg</span>. SKU in the CSV must match.
          </p>
          <label className="block cursor-pointer rounded-[14px] border-2 border-dashed border-[#D6CFC4] bg-[#FBFAF7] p-11 text-center">
            <input
              ref={imgInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => onImages(e.target.files)}
              className="hidden"
            />
            <div className="mb-2.5 text-[34px] text-muted2">⇪</div>
            <div className="mb-1 font-semibold">
              {uploading ? `Uploading ${uploadProg}…` : "Drop colour photos here"}
            </div>
            <div className="text-[13px] text-muted">
              or <span className="font-semibold text-cognac">browse files</span> · jpg / png / webp
            </div>
          </label>
          {uploadErr && <div className="mt-2.5 text-[13px] text-danger">{uploadErr}</div>}
          {badNames.length > 0 && (
            <div className="mt-3 rounded-[10px] border border-[#F0D9D4] bg-[#FDF6F4] p-3 text-[12px] text-danger">
              Unrecognized filenames (use SKU_1.jpg): {badNames.join(", ")}
            </div>
          )}
          {skuCount > 0 && (
            <div className="mt-5 space-y-4">
              <div className="font-mono text-[11px] text-muted2">
                {skuCount} colour SKU{skuCount === 1 ? "" : "s"} · {imageCount} image{imageCount === 1 ? "" : "s"}
              </div>
              {Object.entries(imagesBySku).map(([sku, urls]) => (
                <div key={sku}>
                  <div className="mb-1.5 font-mono text-[12px] font-semibold">{sku}</div>
                  <div className="flex flex-wrap gap-2">
                    {urls.map((url) => (
                      <div key={url} className="relative">
                        <img src={url} alt="" className="h-[72px] w-[72px] rounded-[8px] object-cover" />
                        <button
                          type="button"
                          onClick={() => removeUrl(sku, url)}
                          className="absolute -right-1 -top-1 grid h-5 w-5 cursor-pointer place-items-center rounded-full border-0 bg-ink text-[11px] text-white"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button type="button" className={btnGhost} onClick={() => setStep(2)}>
              Skip — I’ll put URLs in the CSV
            </button>
            <button type="button" disabled={uploading || skuCount < 1} className={btnPrimary} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="mb-[18px] rounded-[14px] border border-border bg-card p-7">
            <div className="mb-1.5 font-display text-[17px] font-bold">Step 2 · Catalogue CSV</div>
            <p className="m-0 mb-5 text-sm text-muted">
              One row per colour. Same <span className="font-mono text-[12px]">product_key</span> = one product.
              Leave <span className="font-mono text-[12px]">image_urls</span> empty if you uploaded photos in step 1.
              Category must match the catalogue. Later rows for the same key must not disagree on description, sizes, or status.
            </p>
            <label className="block cursor-pointer rounded-[14px] border-2 border-dashed border-[#D6CFC4] bg-[#FBFAF7] p-11 text-center">
              <input
                ref={csvInput}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => pickCsv(e.target.files?.[0] ?? null)}
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
              <button type="button" onClick={downloadTemplate} className="cursor-pointer border-0 bg-transparent p-0 font-semibold">
                ↓ Download CSV template
              </button>
              <span className="text-[#D6CFC4]">·</span>
              <span className="font-mono text-xs text-muted">
                product_key, name, category, color, sku, price, mrp, stock, image_urls, youtube_url
              </span>
            </div>
            {skuCount > 0 && (
              <p className="mt-3 mb-0 text-[12px] text-muted">
                Step 1 attached {imageCount} image{imageCount === 1 ? "" : "s"} across {skuCount} SKU
                {skuCount === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          <div className="rounded-[14px] border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="font-display text-base font-bold">
                {result ? "Import result" : preflight ? "Preflight" : "Ready to import"}
              </div>
              {result && (
                <span className={`font-mono text-xs ${result.errors.length ? "text-danger" : "text-green"}`}>
                  {result.imported} products
                  {result.variantCount != null ? ` · ${result.variantCount} colours` : ""} · {result.errors.length} errors
                </span>
              )}
            </div>

            {preflight && !result && (
              <>
                <div className="max-h-[280px] overflow-auto rounded-[10px] border border-border">
                  <table className="w-full border-collapse text-left text-[12px]">
                    <thead className="bg-admin-canvas font-mono text-[11px] text-muted2">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Row</th>
                        <th className="px-3 py-2 font-semibold">Product</th>
                        <th className="px-3 py-2 font-semibold">Colour</th>
                        <th className="px-3 py-2 font-semibold">SKU</th>
                        <th className="px-3 py-2 font-semibold">Imgs</th>
                        <th className="px-3 py-2 font-semibold">YT</th>
                        <th className="px-3 py-2 font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preflight.rows.map((r) => (
                        <tr key={r.row} className="border-t border-border">
                          <td className="px-3 py-2 font-mono">{r.row}</td>
                          <td className="px-3 py-2">{r.name || r.productKey || "—"}</td>
                          <td className="px-3 py-2">{r.color || "—"}</td>
                          <td className="px-3 py-2 font-mono">{r.sku || "—"}</td>
                          <td className="px-3 py-2 font-mono">{r.imageCount}</td>
                          <td className="px-3 py-2">{r.youtube ? "yes" : "—"}</td>
                          <td className={`px-3 py-2 ${r.warning ? "text-danger" : "text-muted2"}`}>
                            {r.warning || "ok"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preflight.extraSkus.length > 0 && (
                  <p className="mt-2.5 mb-0 text-[12px] text-danger">
                    Images uploaded for SKUs not in CSV: {preflight.extraSkus.join(", ")}
                  </p>
                )}
              </>
            )}

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
              <div className="text-sm text-green">
                ✓ Imported {result.imported} product{result.imported === 1 ? "" : "s"}
                {result.variantCount != null
                  ? ` (${result.variantCount} colour${result.variantCount === 1 ? "" : "s"})`
                  : ""}
                .
              </div>
            ) : !preflight ? (
              <p className="m-0 text-[13px] text-muted">Choose a CSV above, then import.</p>
            ) : null}

            {err && <div className="mt-2.5 text-[13px] text-danger">{err}</div>}
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => (result && !result.errors.length ? nav("/admin/products") : setStep(1))}
                className={btnGhost}
              >
                {result && !result.errors.length ? "Done" : "Back"}
              </button>
              <button type="button" disabled={!file || busy} onClick={run} className={btnPrimary}>
                {busy ? "Importing…" : "Import products"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
