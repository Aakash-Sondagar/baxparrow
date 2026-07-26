import type { Response } from "express";
import type { AuthReq } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import {
  getOrCreateCart,
  hydrateCart,
  mergeGuestIntoUser,
  normalizeItems,
  type CartLineInput,
} from "../services/cart.service.js";

function identity(req: AuthReq) {
  const guestKey = String(req.headers["x-cart-key"] ?? "").trim();
  return {
    userId: req.user?.id,
    guestKey: guestKey || undefined,
  };
}

async function resolveCart(req: AuthReq) {
  const { userId, guestKey } = identity(req);
  if (!userId && !guestKey) {
    const err: any = new Error("Missing cart key");
    err.status = 400;
    throw err;
  }
  if (userId && guestKey) {
    await mergeGuestIntoUser(userId, guestKey);
  }
  return getOrCreateCart({ userId, guestKey });
}

async function respond(cart: Awaited<ReturnType<typeof getOrCreateCart>>, res: Response) {
  // Drop lines for deleted products by rewriting cart
  const hydrated = await hydrateCart(cart);
  const keptIds = new Set(hydrated.items.map((i) => i.product));
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => keptIds.has(String(i.product))) as any;
  if (cart.items.length !== before) await cart.save();
  res.json(hydrated);
}

export async function getCart(req: AuthReq, res: Response) {
  try {
    const cart = await resolveCart(req);
    await respond(cart, res);
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message ?? "Cart error" });
  }
}

export async function addItem(req: AuthReq, res: Response) {
  try {
    const cart = await resolveCart(req);
    const productId = String(req.body.product);
    const qty = Math.max(1, Math.floor(Number(req.body.qty) || 1));
    const color = req.body.color ? String(req.body.color) : undefined;
    const size = req.body.size ? String(req.body.size) : undefined;

    const p = await Product.findOne({ _id: productId, status: "active" });
    if (!p) return res.status(404).json({ error: "Product not found" });

    const items = normalizeItems([
      ...cart.items.map((i) => ({
        product: String(i.product),
        color: i.color ?? undefined,
        size: i.size ?? undefined,
        qty: i.qty,
      })),
      { product: productId, color, size, qty },
    ]);
    cart.items = items as any;
    await cart.save();
    await respond(cart, res);
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message ?? "Cart error" });
  }
}

export async function setItems(req: AuthReq, res: Response) {
  try {
    const cart = await resolveCart(req);
    const incoming = Array.isArray(req.body.items) ? (req.body.items as CartLineInput[]) : [];
    const items = normalizeItems(incoming);

    // Validate products exist
    if (items.length) {
      const found = await Product.find({
        _id: { $in: items.map((i) => i.product) },
        status: "active",
      }).select("_id");
      const ok = new Set(found.map((p) => String(p._id)));
      cart.items = items.filter((i) => ok.has(i.product)) as any;
    } else {
      cart.items = [] as any;
    }
    await cart.save();
    await respond(cart, res);
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message ?? "Cart error" });
  }
}
