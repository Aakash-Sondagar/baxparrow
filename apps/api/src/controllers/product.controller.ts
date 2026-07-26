import type { Request, Response } from "express";
import { Product } from "../models/Product.js";
import { slugify } from "../utils/slugify.js";
import { notifyAdmins, stockCrossing } from "../services/notify.service.js";

async function safeNotifyAdmins(...args: Parameters<typeof notifyAdmins>) {
  try {
    await notifyAdmins(...args);
  } catch (err) {
    console.error("notifyAdmins failed", args[0]?.type, err);
  }
}

export async function list(req: Request, res: Response) {
  const { category, min, max, q, sort = "-createdAt", page = "1", limit = "12" } = req.query as Record<string, string>;
  const filter: any = { status: "active" };
  if (category && category !== "All") filter.category = category;
  if (min || max) filter.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { sku: rx }, { category: rx }, { description: rx }];
  }
  const pg = Math.max(1, +page), lim = Math.min(48, +limit);
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((pg - 1) * lim).limit(lim),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}
export async function bySlug(req: Request, res: Response) {
  const p = await Product.findOne({ slug: req.params.slug });
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
}
export async function byId(req: Request, res: Response) {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
}
export async function create(req: Request, res: Response) {
  const slug = slugify(req.body.name) + "-" + Date.now().toString(36);
  const p = await Product.create({ ...req.body, slug });
  await safeNotifyAdmins({
    type: "product.created",
    title: "Product created",
    body: p.name,
    href: "/admin/products",
    meta: { productId: String(p._id) },
  });
  res.status(201).json(p);
}
export async function update(req: Request, res: Response) {
  const prev = await Product.findById(req.params.id);
  const body = { ...req.body };
  if (Array.isArray(body.images)) body.images = body.images.slice(0, 6);
  if (Array.isArray(body.colors)) body.colors = body.colors.slice(0, 12);
  if (Array.isArray(body.sizes)) body.sizes = body.sizes.slice(0, 12);
  const p = await Product.findByIdAndUpdate(req.params.id, body, { new: true });
  if (!p) return res.status(404).json({ error: "Not found" });
  await safeNotifyAdmins({
    type: "product.updated",
    title: "Product updated",
    body: p.name,
    href: "/admin/products",
    meta: { productId: String(p._id) },
  });
  const cross = stockCrossing(prev?.stock ?? 0, p.stock ?? 0);
  if (cross) {
    await safeNotifyAdmins({
      type: cross,
      title: cross === "inventory.out" ? "Out of stock" : "Low stock",
      body: `${p.name} · stock ${p.stock}`,
      href: "/admin/products",
      meta: { productId: String(p._id), stock: p.stock },
    });
  }
  res.json(p);
}
export async function remove(req: Request, res: Response) {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.status !== "draft") {
    return res.status(400).json({ error: "Only draft products can be deleted" });
  }
  await p.deleteOne();
  await safeNotifyAdmins({
    type: "product.deleted",
    title: "Product deleted",
    body: p.name,
    href: "/admin/products",
    meta: { productId: String(p._id) },
  });
  res.status(204).end();
}
