import type { Request, Response } from "express";
import { parse } from "csv-parse/sync";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Category } from "../models/Category.js";
import { productSchema } from "@baxparrow/shared";
import { slugify } from "../utils/slugify.js";
import { notifyAdmins, notifyUsers } from "../services/notify.service.js";
import type { AuthReq } from "../middleware/auth.js";
export async function metrics(_req: Request, res: Response) {
  const [orders, allProducts] = await Promise.all([Order.find().sort("-createdAt"), Product.find()]);
  const paidOrders = orders.filter(o => o.payment?.status === "paid");
  const revenue = paidOrders.reduce((a, o) => a + (o.amounts?.total ?? 0), 0);
  const products = allProducts.length;
  const lowStock = allProducts.filter(p => (p.stock ?? 0) <= 10).length;
  const aov = paidOrders.length
    ? Math.round(revenue / paidOrders.length)
    : (orders.length ? Math.round(orders.reduce((a, o) => a + (o.amounts?.total ?? 0), 0) / orders.length) : 0);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days: { day: string; v: number; dateStr: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayName = days[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];
    last7Days.push({ day: dayName, v: 0, dateStr });
  }

  orders.forEach(o => {
    const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
    const match = last7Days.find(d => d.dateStr === orderDate);
    if (match) {
      match.v += (o.amounts?.total ?? 0);
    }
  });

  const chart = last7Days.map(({ day, v }) => ({ day, v }));

  const catCounts: Record<string, number> = {};
  allProducts.forEach(p => {
    if (p.category) {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    }
  });
  const totalCatProducts = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
  const topCategories = Object.entries(catCounts)
    .map(([name, count]) => ({ name, pct: Math.round((count / totalCatProducts) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  res.json({
    revenue,
    orders: orders.length,
    products,
    lowStock,
    aov,
    chart,
    topCategories,
  });
}
export async function listOrders(req: Request, res: Response) {
  const { status } = req.query as Record<string,string>;
  const filter = status && status !== "All" ? { status: status.toLowerCase() } : {};
  res.json(await Order.find(filter).sort("-createdAt").limit(100));
}
export async function listProducts(req: Request, res: Response) {
  const { category, status, q, sort = "-createdAt", page = "1", limit = "12" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (category && category !== "All") filter.category = category;
  if (status && status !== "All") filter.status = status;
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { sku: rx }, { category: rx }];
  }
  const pg = Math.max(1, +page);
  const lim = Math.min(48, Math.max(1, +limit || 12));
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((pg - 1) * lim).limit(lim),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page: pg, pages: Math.max(1, Math.ceil(total / lim)) });
}

export async function updateOrderStatus(req: Request, res: Response) {
  const order = await Order.findOne({ orderNo: req.params.no });
  if (!order) return res.status(404).json({ error: "Not found" });
  order.status = req.body.status;
  order.timeline.push({ status: req.body.status, at: new Date(), note: req.body.note ?? "" });
  await order.save();
  try {
    await notifyAdmins({
      type: "order.status",
      title: "Order status updated",
      body: `${order.orderNo} → ${order.status}`,
      href: "/admin/orders",
      meta: { orderNo: order.orderNo, status: order.status },
    });
    if (order.user) {
      await notifyUsers([String(order.user)], {
        type: "order.status",
        title: "Order update",
        body: `Your order ${order.orderNo} is now ${order.status}`,
        href: `/order/${order.orderNo}/track`,
        meta: { orderNo: order.orderNo, status: order.status },
      });
    }
  } catch (err) {
    console.error("notify failed for order.status", order.orderNo, err);
  }
  res.json(order);
}
export async function bulkImport(req: AuthReq, res: Response) {
  try {
    const csv = (req.file?.buffer ?? Buffer.from(req.body.csv ?? "")).toString();
    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    if (!rows.length) return res.status(400).json({ imported: 0, errors: [{ row: 0, error: "CSV is empty" }] });

    const errors: { row: number; error: string }[] = [];
    const docs: any[] = [];
    const seenSku = new Set<string>();

    rows.forEach((r: any, i: number) => {
      const row = i + 1;
      const skuRaw = String(r.sku ?? "").trim().toUpperCase();
      const parsed = productSchema.safeParse({
        ...r,
        sku: skuRaw,
        price: +r.price,
        mrp: +r.mrp,
        stock: +(r.stock ?? 0),
        images: r.image_url ? [r.image_url] : [],
      });
      if (!parsed.success) {
        const msg = Object.entries(parsed.error.flatten().fieldErrors)
          .map(([k, v]) => `${k}: ${(v as string[])?.join(", ")}`)
          .join("; ") || "invalid row";
        errors.push({ row, error: msg });
        return;
      }
      if (seenSku.has(parsed.data.sku)) {
        errors.push({ row, error: `Duplicate SKU in CSV: ${parsed.data.sku}` });
        return;
      }
      seenSku.add(parsed.data.sku);
      docs.push({ ...parsed.data, slug: slugify(parsed.data.name) + "-" + Date.now().toString(36) + "-" + i });
    });

    if (errors.length) return res.status(400).json({ imported: 0, errors });

    const skus = docs.map((d) => d.sku);
    const existing = await Product.find({ sku: { $in: skus } }).select("sku").lean();
    if (existing.length) {
      const bySku = new Map(docs.map((d, idx) => [d.sku, idx]));
      const rowErrors = existing.map((p) => {
        const idx = bySku.get(p.sku!);
        return { row: (idx ?? 0) + 1, error: `SKU already exists: ${p.sku}` };
      });
      return res.status(400).json({ imported: 0, errors: rowErrors });
    }

    await Product.insertMany(docs, { ordered: true });

    if (req.user?.id) {
      try {
        await notifyUsers([req.user.id], {
          type: "bulk.completed",
          title: "Bulk upload complete",
          body: `Imported ${docs.length} products`,
          href: "/admin/products",
          meta: { imported: docs.length },
        });
      } catch (err) {
        console.error("notify failed for bulk.completed", err);
      }
    }
    res.json({ imported: docs.length, errors: [] });
  } catch (err: any) {
    console.error("bulkImport failed", err);
    if (err?.code === 11000) {
      const sku = err?.keyValue?.sku ?? err?.writeErrors?.[0]?.err?.op?.sku;
      return res.status(400).json({
        imported: 0,
        errors: [{ row: 0, error: sku ? `SKU already exists: ${sku}` : "Duplicate key (SKU or slug)" }],
      });
    }
    res.status(500).json({ imported: 0, errors: [{ row: 0, error: err?.message ?? "Import failed" }] });
  }
}

export async function listCategories(_req: Request, res: Response) {
  const cats = await Category.find().sort("order");
  const counts = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const items = cats.map((c) => ({
    ...c.toObject(),
    productCount: countMap[c.name] ?? 0,
  }));
  const totalProducts = items.reduce((a, c) => a + c.productCount, 0);
  res.json({ items, totalProducts });
}

export async function createCategory(req: Request, res: Response) {
  const name = String(req.body.name ?? "").trim();
  if (name.length < 2) return res.status(400).json({ error: "Name required" });
  const slug = slugify(name);
  const exists = await Category.findOne({ $or: [{ slug }, { name }] });
  if (exists) return res.status(409).json({ error: "Category already exists" });
  const maxOrder = await Category.findOne().sort("-order").select("order").lean();
  const cat = await Category.create({
    name,
    slug,
    image: req.body.image || undefined,
    order: req.body.order ?? ((maxOrder?.order ?? -1) + 1),
  });
  res.status(201).json(cat);
}

export async function updateCategory(req: Request, res: Response) {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ error: "Not found" });
  const oldName = cat.name;
  if (req.body.name?.trim()) {
    const name = String(req.body.name).trim();
    const slug = slugify(name);
    const clash = await Category.findOne({ _id: { $ne: cat._id }, $or: [{ slug }, { name }] });
    if (clash) return res.status(409).json({ error: "Category already exists" });
    cat.name = name;
    cat.slug = slug;
  }
  if (req.body.image !== undefined) cat.image = req.body.image || undefined;
  if (req.body.order !== undefined) cat.order = +req.body.order;
  await cat.save();
  if (cat.name !== oldName) {
    await Product.updateMany({ category: oldName }, { category: cat.name });
  }
  res.json(cat);
}

export async function deleteCategory(req: Request, res: Response) {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ error: "Not found" });
  const inUse = await Product.countDocuments({ category: cat.name });
  if (inUse > 0) {
    return res.status(400).json({ error: `Category has ${inUse} products — reassign first` });
  }
  await cat.deleteOne();
  res.status(204).end();
}
