import { MAX_PRODUCT_IMAGES } from "@baxparrow/shared";

export const CSV_HEADERS = [
  "product_key",
  "name",
  "category",
  "description",
  "sizes",
  "status",
  "color",
  "sku",
  "price",
  "mrp",
  "stock",
  "image_urls",
  "youtube_url",
] as const;

export const CSV_TEMPLATE =
  `${CSV_HEADERS.join(",")}\n` +
  "BX-MESSENGER,Heritage Messenger,Office Bags,Handcrafted leather messenger,,active,Brown,BX-MSG-BRN,1899,2499,40,,\n" +
  "BX-MESSENGER,Heritage Messenger,Office Bags,Handcrafted leather messenger,,active,Tan,BX-MSG-TAN,1899,2499,25,,\n";

/** `{SKU}_1.jpg` … `{SKU}_6.jpg` */
export function parseVariantImageName(filename: string): { sku: string; index: number } | null {
  const base = filename.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  const m = base.match(/^([A-Za-z0-9_-]+)_(\d+)$/);
  if (!m) return null;
  const index = Number(m[2]);
  if (!Number.isInteger(index) || index < 1 || index > MAX_PRODUCT_IMAGES) return null;
  return { sku: m[1].toUpperCase(), index };
}

export function parseCsvRows(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }
  row.push(cell);
  if (row.some((x) => x.length)) rows.push(row);
  return rows;
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => {
        o[h] = (r[i] ?? "").trim();
      });
      return o;
    });
}

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function stringifyCsv(headers: string[], rows: Record<string, string>[]): string {
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h] ?? "")).join(","));
  }
  return lines.join("\n") + "\n";
}

export function mergeImageUrlsIntoCsv(csvText: string, imagesBySku: Record<string, string[]>): string {
  const table = parseCsvRows(csvText);
  if (!table.length) return csvText;
  const headers = table[0].map((h) => h.trim());
  const lower = headers.map((h) => h.toLowerCase());
  let urlCol = lower.indexOf("image_urls");
  if (urlCol < 0) urlCol = lower.indexOf("image_url");
  const nextHeaders = urlCol < 0 ? [...headers, "image_urls"] : headers;
  if (urlCol < 0) urlCol = nextHeaders.length - 1;
  const skuCol = lower.indexOf("sku");

  const outRows: Record<string, string>[] = [];
  for (const raw of table.slice(1)) {
    if (!raw.some((c) => c.trim())) continue;
    const rec: Record<string, string> = {};
    nextHeaders.forEach((h, i) => {
      rec[h] = (i === urlCol && urlCol >= headers.length ? "" : (raw[i] ?? "")).trim();
    });
    const sku = skuCol >= 0 ? (raw[skuCol] ?? "").trim().toUpperCase() : "";
    const existing = rec[nextHeaders[urlCol]] ?? "";
    if (!existing && sku && imagesBySku[sku]?.length) {
      rec[nextHeaders[urlCol]] = imagesBySku[sku].join("|");
    }
    outRows.push(rec);
  }
  return stringifyCsv(nextHeaders, outRows);
}

export type PreflightRow = {
  row: number;
  productKey: string;
  name: string;
  color: string;
  sku: string;
  imageCount: number;
  youtube: boolean;
  warning: string;
};

export function buildPreflight(
  csvText: string,
  imagesBySku: Record<string, string[]>
): { rows: PreflightRow[]; extraSkus: string[] } {
  const parsed = parseCsv(csvText);
  const csvSkus = new Set<string>();
  const rows: PreflightRow[] = parsed.map((r, i) => {
    const sku = (r.sku ?? "").trim().toUpperCase();
    if (sku) csvSkus.add(sku);
    const csvUrls = (r.image_urls || r.image_url || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    const fromStep1 = imagesBySku[sku] ?? [];
    const imageCount = csvUrls.length || fromStep1.length;
    let warning = "";
    if (!sku) warning = "Missing SKU";
    else if (!imageCount) warning = "No images";
    return {
      row: i + 2,
      productKey: (r.product_key ?? "").trim(),
      name: (r.name ?? "").trim(),
      color: (r.color ?? "").trim(),
      sku,
      imageCount,
      youtube: Boolean((r.youtube_url ?? "").trim()),
      warning,
    };
  });
  const extraSkus = Object.keys(imagesBySku).filter((s) => !csvSkus.has(s));
  return { rows, extraSkus };
}
