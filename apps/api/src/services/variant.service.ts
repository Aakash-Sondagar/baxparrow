import type { VariantInput } from "@baxparrow/shared";

type ProductLike = {
  price: number;
  mrp: number;
  stock?: number;
  sku?: string;
  images?: string[];
  colors?: string[];
  variants?: Array<{
    color: string;
    sku: string;
    price: number;
    mrp: number;
    stock?: number;
    images?: string[];
  }>;
};

/** Pick colour variant; fall back to first variant or product-level fields. */
export function resolveVariant(p: ProductLike, color?: string) {
  const variants = Array.isArray(p.variants) ? p.variants : [];
  if (!variants.length) {
    return {
      color: color || p.colors?.[0],
      sku: p.sku ?? "",
      price: p.price,
      mrp: p.mrp,
      stock: p.stock ?? 0,
      images: p.images ?? [],
    };
  }
  const want = (color ?? "").trim();
  const hit =
    (want && variants.find((v) => v.color === want)) ||
    variants[0];
  return {
    color: hit.color,
    sku: hit.sku,
    price: hit.price,
    mrp: hit.mrp,
    stock: hit.stock ?? 0,
    images: hit.images ?? [],
  };
}

/** Sync top-level listing fields from colour variants. */
export function syncProductFromVariants(body: Record<string, any>) {
  const variants = Array.isArray(body.variants)
    ? (body.variants as VariantInput[]).filter((v) => v?.color && v?.sku)
    : [];
  if (!variants.length) {
    body.variants = [];
    return body;
  }
  // normalize
  body.variants = variants.map((v) => ({
    color: String(v.color).trim(),
    sku: String(v.sku).toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
    price: Number(v.price) || 0,
    mrp: Number(v.mrp) || 0,
    stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
    images: Array.isArray(v.images) ? v.images.slice(0, 6) : [],
  }));
  body.colors = body.variants.map((v: any) => v.color);
  const primary = body.variants[0];
  body.sku = primary.sku;
  body.price = primary.price;
  body.mrp = primary.mrp;
  body.images = primary.images?.length ? primary.images : body.images ?? [];
  body.stock = body.variants.reduce((a: number, v: any) => a + (v.stock || 0), 0);
  return body;
}
