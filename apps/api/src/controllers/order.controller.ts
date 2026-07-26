import type { Response } from "express";
import type { AuthReq } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { buildOrderLines, genOrderNo } from "../services/order.service.js";
import { createRzpOrder, verifySignature } from "../services/payment.service.js";
import { createShipment, trackAwb } from "../services/shipping.service.js";
import { notifyAdmins, notifyUsers } from "../services/notify.service.js";
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
  const { lines, amounts } = await buildOrderLines(items);
  const orderNo = genOrderNo();
  const rzp = await createRzpOrder(amounts.total * 100, orderNo);
  const order = await Order.create({
    orderNo, user: req.user?.id, items: lines, amounts, address: req.body.address,
    payment: { razorpayOrderId: rzp.id, status: "pending" },
    timeline: [{ status: "pending", at: new Date(), note: "Order created" }],
  });
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
  res.status(201).json({ order, orderNo, razorpayOrderId: rzp.id, amount: amounts.total });
}
export async function verifyPayment(req: AuthReq, res: Response) {
  const { orderNo, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return res.status(400).json({ error: "Signature mismatch" });
  const order = await Order.findOne({ orderNo });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!order.payment) {
    order.payment = { status: "paid", razorpayPaymentId: razorpay_payment_id };
  } else {
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.status = "paid";
  }
  order.status = "processing";
  order.timeline.push({ status: "processing", at: new Date(), note: "Payment received via Razorpay" });
  order.shipment = await createShipment(order);
  await order.save();
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
  res.json({ ok: true, order });
}
export async function track(req: AuthReq, res: Response) {
  const order = await Order.findOne({ orderNo: req.params.no });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const live = order.shipment?.awb ? await trackAwb(order.shipment.awb) : [];
  res.json({ order, timeline: order.timeline, live });
}
