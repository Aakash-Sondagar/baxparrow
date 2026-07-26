import type { Response } from "express";
import { Types } from "mongoose";
import { CUSTOMER_NOTIFICATION_TYPES } from "@baxparrow/shared";
import type { AuthReq } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

function customerScope(req: AuthReq) {
  const scope = String(req.query.scope ?? "");
  // Storefront always customer-scoped; non-admins always customer-scoped
  return scope === "customer" || req.user!.role !== "admin";
}

function userFilter(req: AuthReq) {
  const filter: Record<string, unknown> = { user: req.user!.id };
  if (customerScope(req)) {
    filter.type = { $in: [...CUSTOMER_NOTIFICATION_TYPES] };
  }
  return filter;
}

export async function list(req: AuthReq, res: Response) {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const items = await Notification.find(userFilter(req))
    .sort("-createdAt")
    .limit(limit);
  res.json({ items });
}

export async function unreadCount(req: AuthReq, res: Response) {
  const count = await Notification.countDocuments({
    ...userFilter(req),
    readAt: null,
  });
  res.json({ count });
}

export async function markRead(req: AuthReq, res: Response) {
  if (!Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ error: "Invalid id" });
  try {
    const filter: Record<string, unknown> = { _id: req.params.id, user: req.user!.id };
    if (customerScope(req)) {
      filter.type = { $in: [...CUSTOMER_NOTIFICATION_TYPES] };
    }
    const n = await Notification.findOneAndUpdate(
      filter,
      { readAt: new Date() },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: "Not found" });
    res.json(n);
  } catch (err) {
    console.error("markRead failed", req.params.id, err);
    res.status(500).json({ error: "Failed to mark notification read" });
  }
}

export async function markAllRead(req: AuthReq, res: Response) {
  await Notification.updateMany(
    { ...userFilter(req), readAt: null },
    { readAt: new Date() }
  );
  res.json({ ok: true });
}
