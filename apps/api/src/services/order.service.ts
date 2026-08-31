import { computeTotals, MAX_CART_QTY } from "@baxparrow/shared";
import { Order } from "../models/Order.js";
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
    const qty = Math.floor(Number(i.qty) || 0);
    if (qty < 1) throw Object.assign(new Error("Quantity must be at least 1"), { status: 400 });
    if (qty > MAX_CART_QTY) {
      throw Object.assign(new Error(`Quantity cannot exceed ${MAX_CART_QTY}`), { status: 400 });
    }
    const v = resolveVariant(p as any, i.color);
    if (qty > (v.stock ?? 0)) {
      throw Object.assign(
        new Error(`Only ${v.stock ?? 0} in stock for ${p.name}`),
        { status: 400 }
      );
    }
    return {
      product: p._id,
      name: p.name,
      color: i.color ?? v.color,
      size: i.size,
      qty,
      price: v.price,
    };
  });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const mrpTotal = lines.reduce((a, l, idx) => {
    const i = items[idx];
    const p = products.find((pp) => String(pp._id) === i.product);
    if (!p) return a;
    const v = resolveVariant(p as any, i.color);
    return a + v.mrp * l.qty;
  }, 0);
  return { lines, amounts: computeTotals(subtotal, mrpTotal) };
}

export async function genOrderNo(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const no = "BX-" + Math.floor(10000 + Math.random() * 89999);
    if (!(await Order.exists({ orderNo: no }))) return no;
  }
  return "BX-" + Date.now().toString(36).toUpperCase();
}
