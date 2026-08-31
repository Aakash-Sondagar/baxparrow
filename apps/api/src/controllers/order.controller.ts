import type { Response } from "express";
import type { AuthReq } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { buildOrderLines, genOrderNo } from "../services/order.service.js";
import { createRzpOrder, PaymentError, verifySignature } from "../services/payment.service.js";
import { createShipment, trackAwb } from "../services/shipping.service.js";
import { notifyAdmins, notifyUsers } from "../services/notify.service.js";
import { sendOrderConfirmationEmail } from "../services/mail.orders.js";
import { decrementOrderStock, requestReturn } from "../services/return.service.js";

function httpErr(err: unknown): { status: number; message: string } {
  const status = typeof (err as any)?.status === "number" ? (err as any).status : 500;
  const message = err instanceof Error ? err.message : "Request failed";
  return { status, message };
}

export async function createOrder(req: AuthReq, res: Response) {
  const guestKey = String(req.headers["x-cart-key"] ?? "").trim();
  // Prefer Mongo cart (authoritative). Client items only if no server cart.
  let items: { product: string; color?: string; size?: string; qty: number }[] | undefined;
  const cart = req.user
    ? await Cart.findOne({ user: req.user.id })
    : guestKey
      ? await Cart.findOne({ guestKey })
      : null;
  if (cart?.items?.length) {
    items = cart.items.map((i) => ({
      product: String(i.product),
      color: i.color ?? undefined,
      size: i.size ?? undefined,
      qty: i.qty,
    }));
  } else {
    items = req.body.items as typeof items;
  }
  if (!items?.length) return res.status(400).json({ error: "Cart empty" });

  let lines;
  let amounts;
  try {
    ({ lines, amounts } = await buildOrderLines(items));
  } catch (err) {
    const { status, message } = httpErr(err);
    return res.status(status).json({ error: message });
  }

  let order;
  let orderNo = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    orderNo = await genOrderNo();
    let rzp;
    try {
      rzp = await createRzpOrder(amounts.total * 100, orderNo);
    } catch (err) {
      const status = err instanceof PaymentError ? err.status : 500;
      const message = err instanceof Error ? err.message : "Payment gateway error";
      return res.status(status).json({ error: message });
    }
    try {
      order = await Order.create({
        orderNo, user: req.user?.id, items: lines, amounts, address: req.body.address,
        payment: { razorpayOrderId: rzp.id, status: "pending" },
        timeline: [{ status: "pending", at: new Date(), note: "Order created" }],
      });
      break;
    } catch (err: any) {
      if (err?.code !== 11000 || attempt === 2) {
        const { status, message } = httpErr(err);
        return res.status(status).json({ error: message });
      }
    }
  }
  if (!order) return res.status(500).json({ error: "Could not allocate order number" });

  try {
    await notifyAdmins({
      type: "order.new",
      title: "New order",
      body: `Order ${orderNo} placed · ₹${amounts.total}`,
      href: "/admin/orders",
      meta: { orderNo },
    });
    if (req.user?.id) {
      await notifyUsers([req.user.id], {
        type: "order.new",
        title: "Order placed",
        body: `We received order ${orderNo}`,
        href: `/order/${orderNo}/track`,
        meta: { orderNo },
      });
    }
  } catch (err) {
    console.error("notify failed for order.new", orderNo, err);
  }
  res.status(201).json({ order, orderNo, razorpayOrderId: order.payment?.razorpayOrderId, amount: amounts.total });
}

export async function verifyPayment(req: AuthReq, res: Response) {
  const { orderNo, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!orderNo || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return res.status(400).json({ error: "Signature mismatch" });
  const order = await Order.findOne({ orderNo });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.payment?.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ error: "Order id mismatch" });
  }
  if (order.payment?.status === "paid") return res.json({ ok: true, order });
  if (!order.payment) {
    order.payment = { status: "paid", razorpayPaymentId: razorpay_payment_id };
  } else {
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.status = "paid";
  }
  order.status = "processing";
  order.timeline.push({ status: "processing", at: new Date(), note: "Payment received via Razorpay" });
  await order.save();
  try {
    await decrementOrderStock(order);
  } catch (err) {
    console.error("[stock] decrement failed", order.orderNo, err);
  }
  try {
    order.shipment = await createShipment(order);
    await order.save();
  } catch (err) {
    console.error("[shiprocket] persist shipment failed", order.orderNo, err);
  }
  if (req.user) await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  const guestKey = String(req.headers["x-cart-key"] ?? "").trim();
  if (guestKey) await Cart.findOneAndUpdate({ guestKey }, { items: [] });
  try {
    await notifyAdmins({
      type: "order.paid",
      title: "Payment received",
      body: `Order ${order.orderNo} paid · ₹${order.amounts?.total ?? 0}`,
      href: "/admin/orders",
      meta: { orderNo: order.orderNo },
    });
    if (order.user) {
      await notifyUsers([String(order.user)], {
        type: "order.paid",
        title: "Payment confirmed",
        body: `Payment for ${order.orderNo} is confirmed`,
        href: `/order/${order.orderNo}/track`,
        meta: { orderNo: order.orderNo },
      });
    }
  } catch (err) {
    console.error("notify failed for order.paid", order.orderNo, err);
  }
  const addr = (order.address ?? {}) as Record<string, string | null | undefined>;
  const nn = <T>(v: T | null | undefined): T | undefined => v ?? undefined;
  void sendOrderConfirmationEmail({
    orderNo: order.orderNo,
    email: addr.email || "",
    name: [addr.firstName, addr.lastName].filter(Boolean).join(" "),
    items: (order.items ?? []).map((i) => ({
      name: nn(i.name),
      color: nn(i.color),
      size: nn(i.size),
      qty: nn(i.qty),
      price: nn(i.price),
    })),
    amounts: {
      subtotal: nn(order.amounts?.subtotal),
      mrp: nn(order.amounts?.mrp),
      discount: nn(order.amounts?.discount),
      discountPct: nn(order.amounts?.discountPct),
      shipping: nn(order.amounts?.shipping),
      gst: nn(order.amounts?.gst),
      total: nn(order.amounts?.total),
    },
    address: {
      firstName: nn(addr.firstName),
      lastName: nn(addr.lastName),
      address: nn(addr.address),
      city: nn(addr.city),
      pin: nn(addr.pin),
      phone: nn(addr.phone),
      email: nn(addr.email),
    },
    paymentId: nn(order.payment?.razorpayPaymentId),
    createdAt: order.createdAt,
  }).catch((err) => console.error("[mail] order confirm failed", order.orderNo, err));
  res.json({ ok: true, order });
}

export async function track(req: AuthReq, res: Response) {
  const order = await Order.findOne({ orderNo: req.params.no });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const live = order.shipment?.awb ? await trackAwb(order.shipment.awb) : [];
  const timeline =
    live.length > 0
      ? live.map((e) => ({ status: e.status, at: e.at, note: e.note }))
      : order.timeline;
  res.json({ order, timeline, live });
}

export async function myOrders(req: AuthReq, res: Response) {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select("orderNo status amounts address payment createdAt items.name items.qty items.color return.status")
    .lean();
  res.json(orders);
}

export async function requestReturnController(req: AuthReq, res: Response) {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const order = await Order.findOne({ orderNo: req.params.no });
  if (!order) return res.status(404).json({ error: "Order not found" });
  try {
    await requestReturn(order, req.body, req.user.id);
    res.json({ ok: true, order });
  } catch (err) {
    const { status, message } = httpErr(err);
    res.status(status).json({ error: message });
  }
}
