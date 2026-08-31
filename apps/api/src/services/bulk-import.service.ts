import { CATEGORIES, MAX_PRODUCT_IMAGES, productSchema, variantSchema } from "@baxparrow/shared";
import { syncProductFromVariants } from "./variant.service.js";

export type BulkRowError = { row: number; error: string };

const MAX_SIZE_LEN = 24;

function headerMap(row: Record<string, unknown>): Map<string, string> {
  return new Map(Object.keys(row).map((k) => [k.trim().toLowerCase(), k]));
}

function cell(r: Record<string, unknown>, map: Map<string, string>, ...keys: string[]): string {
  for (const want of keys) {
    const hit = map.get(want.toLowerCase());
    if (hit != null && r[hit] != null) return String(r[hit]).trim();
  }
  return "";
}

function toInt(raw: string, field: string, row: number, errors: BulkRowError[]): number | null {
  if (raw === "") {
    errors.push({ row, error: `${field} is required` });
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    errors.push({ row, error: `${field} must be a non-negative integer` });
    return null;
  }
  return n;
}

function splitPipe(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitUrls(raw: string, row: number, errors: BulkRowError[]): string[] {
  const parts = splitPipe(raw);
  const urls: string[] = [];
  for (const p of parts) {
    try {
      const u = new URL(p);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad proto");
      urls.push(p);
    } catch {
      errors.push({ row, error: `Invalid image URL: ${p}` });
    }
  }
  if (urls.length > MAX_PRODUCT_IMAGES) {
    errors.push({ row, error: `Max ${MAX_PRODUCT_IMAGES} images per colour` });
    return urls.slice(0, MAX_PRODUCT_IMAGES);
  }
  return urls;
}

function parseSizes(raw: string, row: number, errors: BulkRowError[]): string[] {
  const sizes = splitPipe(raw);
  if (sizes.length > 12) {
    errors.push({ row, error: "Max 12 sizes per product" });
  }
  for (const s of sizes) {
    if (s.length > MAX_SIZE_LEN) {
      errors.push({ row, error: `size "${s}" is too long (max ${MAX_SIZE_LEN} characters)` });
    }
  }
  return sizes.slice(0, 12);
}

type Group = {
  key: string;
  firstRow: number;
  name: string;
  category: string;
  description: string;
  sizes: string[];
  status: "active" | "draft";
  variants: Array<{
    color: string;
    sku: string;
    price: number;
    mrp: number;
    stock: number;
    images: string[];
    youtubeUrl?: string;
  }>;
};

export type AssembleOpts = {
  /** Category names allowed for this import. Defaults to shared CATEGORIES. */
  allowedCategories?: string[];
};

/** Turn CSV rows (one colour variant each) into product docs. Errors block import. */
export function assembleBulkProducts(
  rows: Record<string, unknown>[],
  opts: AssembleOpts = {}
): {
  docs: Record<string, unknown>[];
  errors: BulkRowError[];
  variantCount: number;
  skuRows: Record<string, number>;
} {
  const empty = { docs: [] as Record<string, unknown>[], errors: [] as BulkRowError[], variantCount: 0, skuRows: {} as Record<string, number> };
  const errors: BulkRowError[] = [];
  const skuRows: Record<string, number> = {};
  if (!rows.length) {
    return { ...empty, errors: [{ row: 0, error: "CSV is empty" }] };
  }
  const map = headerMap(rows[0]);
  if (!map.has("product_key")) {
    return {
      ...empty,
      errors: [
        {
          row: 0,
          error: "Missing product_key column. Download the new template — one row per colour variant.",
        },
      ],
    };
  }

  const allowed = new Set(
    (opts.allowedCategories?.length ? opts.allowedCategories : [...CATEGORIES]).map((c) => c.trim())
  );

  const groups = new Map<string, Group>();
  const seenSku = new Set<string>();

  rows.forEach((r, i) => {
    const row = i + 2;
    const productKey = cell(r, map, "product_key").toUpperCase();
    const name = cell(r, map, "name");
    const category = cell(r, map, "category");
    const description = cell(r, map, "description");
    const sizesRaw = cell(r, map, "sizes");
    const statusCell = cell(r, map, "status").toLowerCase();
    const statusRaw = statusCell || "active";
    const color = cell(r, map, "color");
    const sku = cell(r, map, "sku").toUpperCase();
    const price = toInt(cell(r, map, "price"), "price", row, errors);
    const mrp = toInt(cell(r, map, "mrp"), "mrp", row, errors);
    const stockRaw = cell(r, map, "stock");
    const stock = stockRaw === "" ? 0 : toInt(stockRaw, "stock", row, errors);
    const images = splitUrls(cell(r, map, "image_urls", "image_url"), row, errors);
    const youtubeUrl = cell(r, map, "youtube_url", "youtubeurl");
    const sizes = parseSizes(sizesRaw, row, errors);

    if (!productKey) errors.push({ row, error: "product_key is required" });
    if (!name) errors.push({ row, error: "name is required" });
    if (!category) errors.push({ row, error: "category is required" });
    if (category && !allowed.has(category)) {
      errors.push({ row, error: `Unknown category "${category}"` });
    }
    if (!color) errors.push({ row, error: "color is required" });
    if (!sku) errors.push({ row, error: "sku is required" });
    if (statusCell && statusCell !== "active" && statusCell !== "draft") {
      errors.push({ row, error: "status must be active or draft" });
    }
    if (sku && seenSku.has(sku)) {
      errors.push({ row, error: `Duplicate SKU in CSV: ${sku}` });
    }
    if (sku) {
      seenSku.add(sku);
      if (skuRows[sku] == null) skuRows[sku] = row;
    }

    const rowOk =
      Boolean(productKey && name && category && color && sku) &&
      price != null &&
      mrp != null &&
      stock != null;

    const parsedVar = rowOk
      ? variantSchema.safeParse({
          color,
          sku,
          price,
          mrp,
          stock,
          images,
          youtubeUrl: youtubeUrl || "",
        })
      : null;
    if (parsedVar && !parsedVar.success) {
      const msg =
        parsedVar.error.issues.map((iss) => iss.message).join("; ") || "invalid variant";
      errors.push({ row, error: msg });
    }

    if (!productKey || !name || !category) return;

    let g = groups.get(productKey);
    if (!g) {
      g = {
        key: productKey,
        firstRow: row,
        name,
        category,
        description,
        sizes,
        status: statusRaw === "draft" ? "draft" : "active",
        variants: [],
      };
      groups.set(productKey, g);
    } else {
      if (g.name !== name) {
        errors.push({
          row,
          error: `product_key ${productKey}: name "${name}" disagrees with "${g.name}"`,
        });
      }
      if (g.category !== category) {
        errors.push({
          row,
          error: `product_key ${productKey}: category "${category}" disagrees with "${g.category}"`,
        });
      }
      if (description && g.description && description !== g.description) {
        errors.push({
          row,
          error: `product_key ${productKey}: description disagrees with first row`,
        });
      }
      if (sizesRaw && g.sizes.length && sizes.join("|") !== g.sizes.join("|")) {
        errors.push({
          row,
          error: `product_key ${productKey}: sizes disagrees with first row`,
        });
      }
      if (statusCell && statusCell !== g.status) {
        errors.push({
          row,
          error: `product_key ${productKey}: status "${statusCell}" disagrees with "${g.status}"`,
        });
      }
      if (!g.description && description) g.description = description;
      if (!g.sizes.length && sizes.length) g.sizes = sizes;
    }

    if (color && g.variants.some((v) => v.color.toLowerCase() === color.toLowerCase())) {
      errors.push({ row, error: `Duplicate colour "${color}" for ${productKey}` });
    }
    if (parsedVar?.success) g.variants.push(parsedVar.data);
  });

  if (errors.length) return { docs: [], errors, variantCount: 0, skuRows };

  const docs: Record<string, unknown>[] = [];
  let variantCount = 0;
  for (const g of groups.values()) {
    if (!g.variants.length) {
      errors.push({ row: g.firstRow, error: `No valid colour rows for ${g.key}` });
      continue;
    }
    if (g.variants.length > 12) {
      errors.push({ row: g.firstRow, error: `Max 12 colours per product (${g.key})` });
      continue;
    }
    const body = syncProductFromVariants({
      name: g.name,
      category: g.category,
      description: g.description,
      sizes: g.sizes,
      status: g.status,
      variants: g.variants,
      sku: g.variants[0].sku,
      price: g.variants[0].price,
      mrp: g.variants[0].mrp,
      stock: 0,
      images: [],
      colors: [],
    });
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        Object.entries(parsed.error.flatten().fieldErrors)
          .map(([k, v]) => `${k}: ${(v as string[])?.join(", ")}`)
          .join("; ") || "invalid product";
      errors.push({ row: g.firstRow, error: msg });
      continue;
    }
    variantCount += g.variants.length;
    docs.push(parsed.data);
  }

  if (errors.length) return { docs: [], errors, variantCount: 0, skuRows };
  return { docs, errors: [], variantCount, skuRows };
}

export function collectSkus(docs: Record<string, unknown>[]): string[] {
  const skus = new Set<string>();
  for (const d of docs) {
    if (typeof d.sku === "string") skus.add(d.sku);
    const variants = Array.isArray(d.variants) ? d.variants : [];
    for (const v of variants) {
      if (v && typeof v.sku === "string") skus.add(v.sku);
    }
  }
  return [...skus];
}

export function rowForSku(skuRows: Record<string, number>, sku: unknown): number {
  return typeof sku === "string" && skuRows[sku] != null ? skuRows[sku] : 0;
}
