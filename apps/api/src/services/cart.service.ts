import { computeTotals } from "@baxparrow/shared";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";

export type CartLineInput = {
  product: string;
  color?: string;
  size?: string;
  qty: number;
};

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
      amounts: computeTotals(0),
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
    if (!p) continue; // drop missing/inactive
    const qty = Math.max(1, Number(line.qty) || 1);
    const price = p.price;
    items.push({
      id,
      product: id,
      lineKey: `${id}|${line.color ?? ""}|${line.size ?? ""}`,
      name: p.name,
      cat: p.category,
      price,
      lineTotal: price * qty,
      qty,
      color: line.color ?? undefined,
      size: line.size ?? undefined,
      image: p.images?.[0] || undefined,
      toneIndex: toneIndex(id),
    });
  }

  const subtotal = items.reduce((a, l) => a + l.lineTotal, 0);
  return {
    items,
    amounts: computeTotals(subtotal),
    count: items.reduce((a, l) => a + l.qty, 0),
  };
}

export async function findCartDoc(opts: { userId?: string; guestKey?: string }) {
  if (opts.userId) return Cart.findOne({ user: opts.userId });
  if (opts.guestKey) return Cart.findOne({ guestKey: opts.guestKey });
  return null;
}

export async function getOrCreateCart(opts: { userId?: string; guestKey?: string }) {
  let cart = await findCartDoc(opts);
  if (cart) return cart;
  if (opts.userId) return Cart.create({ user: opts.userId, items: [] });
  if (opts.guestKey) return Cart.create({ guestKey: opts.guestKey, items: [] });
  throw Object.assign(new Error("No cart identity"), { status: 400 });
}

/** Merge same product+color+size lines; drop invalid qty. */
export function normalizeItems(items: CartLineInput[]): CartLineInput[] {
  const map = new Map<string, CartLineInput>();
  for (const raw of items) {
    const product = String(raw.product ?? "").trim();
    if (!product) continue;
    const qty = Math.max(0, Math.floor(Number(raw.qty) || 0));
    if (qty <= 0) continue;
    const color = raw.color ? String(raw.color) : undefined;
    const size = raw.size ? String(raw.size) : undefined;
    const key = `${product}|${color ?? ""}|${size ?? ""}`;
    const ex = map.get(key);
    if (ex) ex.qty += qty;
    else map.set(key, { product, color, size, qty });
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
    await Cart.create({ user: userId, items: merged });
  }
  await Cart.deleteOne({ _id: guestCart._id });
}
