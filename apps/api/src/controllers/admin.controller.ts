import type { Request, Response } from "express";
import { parse } from "csv-parse/sync";
import { CATEGORIES } from "@baxparrow/shared";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Category } from "../models/Category.js";
import { slugify } from "../utils/slugify.js";
import { notifyAdmins, notifyUsers } from "../services/notify.service.js";
import { assembleBulkProducts, collectSkus, rowForSku } from "../services/bulk-import.service.js";
import { updateReturn } from "../services/return.service.js";
import type { AuthReq } from "../middleware/auth.js";

export async function metrics(_req: Request, res: Response) {
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

  const [orderStats, chartAgg, productStats, catFacet] = await Promise.all([
    Order.aggregate<{
      orders: number;
      paidCount: number;
      paidRevenue: number;
      allRevenue: number;
    }>([
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $eq: ["$payment.status", "paid"] }, 1, 0] } },
          paidRevenue: {
            $sum: { $cond: [{ $eq: ["$payment.status", "paid"] }, { $ifNull: ["$amounts.total", 0] }, 0] },
          },
          allRevenue: { $sum: { $ifNull: ["$amounts.total", 0] } },
        },
      },
    ]),
    Order.aggregate<{ _id: string; v: number }>([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          v: { $sum: { $ifNull: ["$amounts.total", 0] } },
        },
      },
    ]),
    Product.aggregate<{ products: number; lowStock: number }>([
      {
        $group: {
          _id: null,
          products: { $sum: 1 },
          lowStock: { $sum: { $cond: [{ $lte: [{ $ifNull: ["$stock", 0] }, 10] }, 1, 0] } },
        },
      },
    ]),
    Product.aggregate<{ top: { _id: string; count: number }[]; total: { n: number }[] }>([
      { $match: { category: { $nin: [null, ""] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      {
        $facet: {
          top: [{ $sort: { count: -1 } }, { $limit: 4 }],
          total: [{ $group: { _id: null, n: { $sum: "$count" } } }],
        },
      },
    ]),
  ]);

  const os = orderStats[0] ?? { orders: 0, paidCount: 0, paidRevenue: 0, allRevenue: 0 };
  const revenue = os.paidRevenue;
  const aov = os.paidCount
    ? Math.round(revenue / os.paidCount)
    : os.orders
      ? Math.round(os.allRevenue / os.orders)
      : 0;

  const byDay = new Map(chartAgg.map((d) => [d._id, d.v]));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const chart: { day: string; v: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const dateStr = d.toISOString().slice(0, 10);
    chart.push({ day: days[d.getUTCDay()], v: byDay.get(dateStr) ?? 0 });
  }

  const ps = productStats[0] ?? { products: 0, lowStock: 0 };
  const facet = catFacet[0];
  const totalCatProducts = facet?.total?.[0]?.n || 1;
  const topCategories = (facet?.top ?? []).map((c) => ({
    name: c._id,
    pct: Math.round((c.count / totalCatProducts) * 100),
  }));

  res.json({
    revenue,
    orders: os.orders,
    products: ps.products,
    lowStock: ps.lowStock,
    aov,
    chart,
    topCategories,
  });
}
export async function listOrders(req: Request, res: Response) {
  const { status, returnStatus, page = "1", limit = "50" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  const s = (status ?? "").trim().toLowerCase();
  if (s && s !== "all") filter.status = s;
  if (returnStatus) {
    filter["return.status"] = returnStatus === "any" ? { $exists: true } : returnStatus;
  }
  const pg = Math.max(1, +page || 1);
  const lim = Math.min(100, Math.max(1, +limit || 50));
  const [items, total] = await Promise.all([
    Order.find(filter).sort("-createdAt").skip((pg - 1) * lim).limit(lim),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page: pg, pages: Math.max(1, Math.ceil(total / lim)) });
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

export async function updateReturnController(req: AuthReq, res: Response) {
  const order = await Order.findOne({ orderNo: req.params.no });
  if (!order) return res.status(404).json({ error: "Not found" });
  try {
    await updateReturn(order, req.body.status, req.body.note);
    res.json(order);
  } catch (err) {
    const status = typeof (err as any)?.status === "number" ? (err as any).status : 500;
    const message = err instanceof Error ? err.message : "Failed";
    res.status(status).json({ error: message });
  }
}

export async function bulkImport(req: AuthReq, res: Response) {
  try {
    const csv = (req.file?.buffer ?? Buffer.from(req.body.csv ?? "")).toString();
    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Record<string, unknown>[];
    if (!rows.length) return res.status(400).json({ imported: 0, variantCount: 0, errors: [{ row: 0, error: "CSV is empty" }] });

    const dbCats = await Category.find().select("name").lean();
    const allowedCategories = dbCats.length ? dbCats.map((c) => c.name) : [...CATEGORIES];
    const { docs, errors, variantCount, skuRows } = assembleBulkProducts(rows, { allowedCategories });
    if (errors.length) return res.status(400).json({ imported: 0, variantCount: 0, errors });

    const skus = collectSkus(docs);
    const existing = await Product.find({
      $or: [{ sku: { $in: skus } }, { "variants.sku": { $in: skus } }],
    })
      .select("sku variants.sku")
      .lean();
    if (existing.length) {
      const taken = new Set<string>();
      for (const p of existing) {
        if (p.sku) taken.add(p.sku);
        for (const v of p.variants ?? []) {
          if (v?.sku) taken.add(v.sku);
        }
      }
      const hits = skus.filter((s) => taken.has(s));
      return res.status(400).json({
        imported: 0,
        variantCount: 0,
        errors: hits.map((sku) => ({ row: rowForSku(skuRows, sku), error: `SKU already exists: ${sku}` })),
      });
    }

    const stamp = Date.now().toString(36);
    const toInsert = docs.map((d, i) => ({
      ...d,
      slug: slugify(String(d.name ?? "product")) + "-" + stamp + "-" + i,
    }));

    try {
      await Product.insertMany(toInsert, { ordered: false });
    } catch (err: any) {
      const writeErrors: any[] = err?.writeErrors ?? err?.result?.writeErrors ?? [];
      if (err?.code === 11000 || writeErrors.length) {
        const dupes = writeErrors.length
          ? writeErrors.map((we: any) => {
              const op = we?.err?.op ?? we?.op ?? {};
              const sku = op.sku ?? op.variants?.[0]?.sku ?? err?.keyValue?.sku ?? err?.keyValue?.["variants.sku"];
              return { row: rowForSku(skuRows, sku), error: sku ? `SKU already exists: ${sku}` : "Duplicate key (SKU or slug)" };
            })
          : [{
              row: rowForSku(skuRows, err?.keyValue?.sku ?? err?.keyValue?.["variants.sku"]),
              error: err?.keyValue?.sku
                ? `SKU already exists: ${err.keyValue.sku}`
                : "Duplicate key (SKU or slug)",
            }];
        const imported = err.result?.insertedCount ?? err.insertedDocs?.length ?? 0;
        return res.status(400).json({ imported, variantCount: imported ? variantCount : 0, errors: dupes });
      }
      throw err;
    }

    if (req.user?.id) {
      try {
        await notifyUsers([req.user.id], {
          type: "bulk.completed",
          title: "Bulk upload complete",
          body: `Imported ${docs.length} products (${variantCount} colours)`,
          href: "/admin/products",
          meta: { imported: docs.length, variantCount },
        });
      } catch (err) {
        console.error("notify failed for bulk.completed", err);
      }
    }
    res.json({ imported: docs.length, variantCount, errors: [] });
  } catch (err: any) {
    console.error("bulkImport failed", err);
    if (err?.code === 11000) {
      const sku = err?.keyValue?.sku ?? err?.keyValue?.["variants.sku"] ?? err?.writeErrors?.[0]?.err?.op?.sku;
      return res.status(400).json({
        imported: 0,
        variantCount: 0,
        errors: [{ row: 0, error: sku ? `SKU already exists: ${sku}` : "Duplicate key (SKU or slug)" }],
      });
    }
    res.status(500).json({ imported: 0, variantCount: 0, errors: [{ row: 0, error: err?.message ?? "Import failed" }] });
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
