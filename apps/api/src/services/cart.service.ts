import { Types } from "mongoose";
import { computeTotals, MAX_CART_QTY } from "@baxparrow/shared";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { resolveVariant } from "./variant.service.js";

export type CartLineInput = {
  product: string;
  color?: string;
  size?: string;
  qty: number;
};

export function isProductId(id: string) {
  return Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
}

export function toneIndex(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 8;
  return h;
}

export async function hydrateCart(cart: InstanceType<typeof Cart> | null) {
  const raw = cart?.items ?? [];
  if (!raw.length) {
    return {
      items: [] as any[],
      amounts: computeTotals(0, 0),
      count: 0,
    };
  }

  const ids = raw.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, status: "active" });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const line of raw) {
    const id = String(line.product);
    const p = byId.get(id);
    if (!p) continue;
    const qty = Math.max(1, Number(line.qty) || 1);
    const v = resolveVariant(p as any, line.color ?? undefined);
    const price = v.price;
    const mrp = v.mrp ?? price;
    items.push({
      id,
      product: id,
      lineKey: `${id}|${line.color ?? ""}|${line.size ?? ""}`,
      name: p.name,
      cat: p.category,
      price,
      mrp,
      lineTotal: price * qty,
      lineMrp: mrp * qty,
      qty,
      color: line.color ?? v.color ?? undefined,
      size: line.size ?? undefined,
      image: v.images?.[0] || p.images?.[0] || undefined,
      toneIndex: toneIndex(id),
    });
  }

  const subtotal = items.reduce((a, l) => a + l.lineTotal, 0);
  const mrpTotal = items.reduce((a, l) => a + l.lineMrp, 0);
  return {
    items,
    amounts: computeTotals(subtotal, mrpTotal),
    count: items.reduce((a, l) => a + l.qty, 0),
  };
}

export async function findCartDoc(opts: { userId?: string; guestKey?: string }) {
  if (opts.userId) return Cart.findOne({ user: opts.userId });
  if (opts.guestKey) return Cart.findOne({ guestKey: opts.guestKey });
  return null;
}

/** Create-or-get cart. Guest docs must omit `user` (null breaks old unique indexes). */
async function upsertCart(
  filter: Record<string, unknown>,
  insert: Record<string, unknown>
) {
  const existing = await Cart.findOne(filter);
  if (existing) return existing;

  try {
    return await Cart.create(insert);
  } catch (e: any) {
    if (e?.code === 11000) {
      const again = await Cart.findOne(filter);
      if (again) return again;
      console.error("[cart] E11000", e?.keyPattern, e?.keyValue, e?.message);
    }
    throw e;
  }
}

export async function getOrCreateCart(opts: { userId?: string; guestKey?: string }) {
  if (opts.userId) {
    return upsertCart({ user: opts.userId }, { user: opts.userId, items: [] });
  }
  if (opts.guestKey) {
    // Only guestKey — never set user:null
    return upsertCart({ guestKey: opts.guestKey }, { guestKey: opts.guestKey, items: [] });
  }
  throw Object.assign(new Error("No cart identity"), { status: 400 });
}

/** Merge same product+color+size lines; drop invalid qty. */
export function normalizeItems(items: CartLineInput[]): CartLineInput[] {
  const map = new Map<string, CartLineInput>();
  for (const raw of items) {
    const product = String(raw.product ?? "").trim();
    if (!product || !isProductId(product)) continue;
    const qty = Math.max(0, Math.floor(Number(raw.qty) || 0));
    if (qty <= 0) continue;
    const color = raw.color ? String(raw.color) : undefined;
    const size = raw.size ? String(raw.size) : undefined;
    const key = `${product}|${color ?? ""}|${size ?? ""}`;
    const ex = map.get(key);
    if (ex) ex.qty = Math.min(MAX_CART_QTY, ex.qty + qty);
    else map.set(key, { product, color, size, qty: Math.min(MAX_CART_QTY, qty) });
  }
  return [...map.values()];
}

export async function mergeGuestIntoUser(userId: string, guestKey: string) {
  if (!guestKey) return;
  const [userCart, guestCart] = await Promise.all([
    Cart.findOne({ user: userId }),
    Cart.findOne({ guestKey }),
  ]);
  if (!guestCart?.items?.length) {
    if (guestCart) await Cart.deleteOne({ _id: guestCart._id });
    return;
  }

  const merged = normalizeItems([
    ...((userCart?.items ?? []).map((i) => ({
      product: String(i.product),
      color: i.color ?? undefined,
      size: i.size ?? undefined,
      qty: i.qty,
    })) as CartLineInput[]),
    ...(guestCart.items.map((i) => ({
      product: String(i.product),
      color: i.color ?? undefined,
      size: i.size ?? undefined,
      qty: i.qty,
    })) as CartLineInput[]),
  ]);

  if (userCart) {
    userCart.items = merged as any;
    await userCart.save();
  } else {
    await upsertCart({ user: userId }, { user: userId, items: merged });
  }
  await Cart.deleteOne({ _id: guestCart._id });
}
