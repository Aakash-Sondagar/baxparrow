import { computeTotals } from "@baxparrow/shared";
import { Product } from "../models/Product.js";
import { resolveVariant } from "./variant.service.js";

export async function buildOrderLines(
  items: { product: string; color?: string; size?: string; qty: number }[]
) {
  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } });
  const lines = items.map((i) => {
    const p = products.find((pp) => String(pp._id) === i.product);
    if (!p) throw Object.assign(new Error("Product not found"), { status: 400 });
    const v = resolveVariant(p as any, i.color);
    return {
      product: p._id,
      name: p.name,
      color: i.color ?? v.color,
      size: i.size,
      qty: i.qty,
      price: v.price,
    };
  });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const mrpTotal = items.reduce((a, i) => {
    const p = products.find((pp) => String(pp._id) === i.product);
    if (!p) return a;
    const v = resolveVariant(p as any, i.color);
    return a + v.mrp * i.qty;
  }, 0);
  return { lines, amounts: computeTotals(subtotal, mrpTotal) };
}
export const genOrderNo = () => "BX-" + Math.floor(10000 + Math.random() * 89999);
