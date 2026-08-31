import { Types } from "mongoose";
import { returnWindowOpen, type ReturnStatus } from "@baxparrow/shared";
import { Product } from "../models/Product.js";
import { refundPayment } from "./payment.service.js";
import { createReturnShipment } from "./shipping.service.js";
import { notifyAdmins, notifyUsers, stockCrossing } from "./notify.service.js";
import { resolveVariant } from "./variant.service.js";

type OrderDoc = any;

const VALID_TRANSITIONS: Record<ReturnStatus | "none", ReturnStatus[]> = {
  none: [],
  requested: ["approved", "rejected"],
  approved: ["received", "rejected"],
  received: ["refunded"],
  refunded: [],
  rejected: [],
};

function deliveredAt(order: OrderDoc): Date | null {
  const entry = order.timeline?.find((t: any) => t.status === "delivered");
  return entry?.at ? new Date(entry.at) : null;
}

export function canTransition(current: ReturnStatus | "none", next: ReturnStatus): boolean {
  return VALID_TRANSITIONS[current].includes(next);
}

export function returnEligible(order: OrderDoc, now = new Date()) {
  if (order.status !== "delivered") return { ok: false, reason: "Order not delivered" };
  if (order.payment?.status !== "paid") return { ok: false, reason: "Order not paid" };
  if (!order.payment?.razorpayPaymentId) return { ok: false, reason: "No payment to refund" };
  if (order.return?.status) return { ok: false, reason: "Return already requested" };
  const d = deliveredAt(order);
  if (!d) return { ok: false, reason: "No delivery recorded" };
  if (!returnWindowOpen(d, now)) return { ok: false, reason: "Return window closed" };
  return { ok: true, reason: "" };
}

function groupItemsByProduct(items: any[]) {
  const map = new Map<string, any[]>();
  for (const i of items ?? []) {
    const list = map.get(String(i.product)) ?? [];
    list.push(i);
    map.set(String(i.product), list);
  }
  return map;
}

async function adjustOrderStock(order: OrderDoc, direction: -1 | 1) {
  const grouped = groupItemsByProduct(order.items);
  const productIds = [...grouped.keys()].map((id) => new Types.ObjectId(id));
  const beforeProducts = await Product.find({ _id: { $in: productIds } }).lean();

  for (const [productId, items] of grouped) {
    const product = beforeProducts.find((p) => String(p._id) === productId);
    if (!product) continue;

    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const totalQty = items.reduce((a: number, i: any) => a + (Number(i.qty) || 0), 0);
    const $inc: Record<string, number> = { stock: direction * totalQty };

    if (hasVariants) {
      const colorQty = new Map<string, number>();
      for (const i of items) {
        const v = resolveVariant(product, i.color);
        const c = v.color ?? "";
        colorQty.set(c, (colorQty.get(c) ?? 0) + (Number(i.qty) || 0));
      }
      const arrayFilters: Record<string, string>[] = [];
      let idx = 0;
      for (const [color, qty] of colorQty) {
        const varName = `v${idx++}`;
        $inc[`variants.$[${varName}].stock`] = direction * qty;
        arrayFilters.push({ [`${varName}.color`]: color });
      }
      await Product.updateOne({ _id: new Types.ObjectId(productId) }, { $inc }, { arrayFilters });
    } else {
      await Product.updateOne({ _id: new Types.ObjectId(productId) }, { $inc });
    }
  }

  const afterProducts = await Product.find({ _id: { $in: productIds } }).lean();
  for (const before of beforeProducts) {
    const after = afterProducts.find((p) => String(p._id) === String(before._id));
    if (!after) continue;
    const cross = stockCrossing(before.stock ?? 0, after.stock ?? 0);
    if (cross) {
      await notifyAdmins({
        type: cross,
        title: cross === "inventory.out" ? "Out of stock" : "Low stock",
        body: `${before.name} · stock ${after.stock}`,
        href: "/admin/products",
        meta: { productId: String(before._id), stock: after.stock },
      });
    }
  }
}

export async function decrementOrderStock(order: OrderDoc) {
  await adjustOrderStock(order, -1);
}

async function restockOrder(order: OrderDoc, ret: Record<string, unknown>) {
  if (ret.restocked) return;
  await adjustOrderStock(order, 1);
  ret.restocked = true;
}

export type ReturnInput = { reason: string; reasonDetail?: string; images: string[] };

export async function requestReturn(order: OrderDoc, input: ReturnInput, userId: string) {
  const eligible = returnEligible(order);
  if (!eligible.ok) {
    throw Object.assign(new Error(eligible.reason), { status: 400 });
  }
  if (!order.user || String(order.user) !== userId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }

  order.return = {
    status: "requested",
    reason: input.reason,
    reasonDetail: input.reasonDetail ?? "",
    images: input.images ?? [],
    requestedAt: new Date(),
    timeline: [{ status: "requested", at: new Date(), note: "Return requested by customer" }],
  };
  await order.save();

  const detail = input.reasonDetail ? ` — ${input.reasonDetail}` : "";
  await notifyAdmins({
    type: "return.requested",
    title: "Return requested",
    body: `${order.orderNo} — ${input.reason}${detail}`.slice(0, 120),
    href: "/admin/orders",
    meta: { orderNo: order.orderNo, reason: input.reason, images: input.images?.length ?? 0 },
  });

  return order;
}

export async function updateReturn(order: OrderDoc, status: ReturnStatus, note?: string) {
  const current = (order.return?.status ?? "none") as ReturnStatus | "none";
  if (!canTransition(current, status)) {
    throw Object.assign(
      new Error(`Invalid transition from ${current} to ${status}`),
      { status: 409 }
    );
  }

  const ret = order.return ? { ...order.return.toObject?.() ?? order.return } : {};
  ret.status = status;
  ret.timeline = ret.timeline ?? [];
  const now = new Date();
  ret.timeline.push({ status, at: now, note: note ?? "" });

  if (status === "approved") {
    ret.approvedAt = now;
    ret.reverseShipment = await createReturnShipment(order);
  }

  if (status === "received") {
    ret.receivedAt = now;
    await restockOrder(order, ret);
  }

  if (status === "refunded") {
    ret.refundedAt = now;
    if (!ret.refundId) {
      const amountPaise = Math.round((order.amounts?.total ?? 0) * 100);
      const refund = await refundPayment(order.payment.razorpayPaymentId, amountPaise);
      ret.refundId = String(refund.id);
      ret.refundAmount = amountPaise;
    }
  }

  if (status === "rejected") {
    ret.rejectedAt = now;
    ret.rejectionNote = note ?? "";
  }

  order.return = ret;
  await order.save();

  if (order.user) {
    await notifyUsers([String(order.user)], {
      type: status === "refunded" ? "return.refunded" : "return.updated",
      title: status === "refunded" ? "Refund issued" : "Return updated",
      body: `Order ${order.orderNo} is now ${status}`,
      href: `/order/${order.orderNo}/track`,
      meta: { orderNo: order.orderNo, status },
    });
  }

  return order;
}
