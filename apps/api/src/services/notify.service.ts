import { Types } from "mongoose";
import type { NotificationType } from "@baxparrow/shared";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

export const LOW_STOCK_THRESHOLD = 10;

export type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
};

/** Pure helper: emit only on threshold crossing to avoid spam. */
export function stockCrossing(prev: number, next: number): "inventory.out" | "inventory.low" | null {
  if (next === 0 && prev > 0) return "inventory.out";
  if (next > 0 && next <= LOW_STOCK_THRESHOLD && prev > LOW_STOCK_THRESHOLD) return "inventory.low";
  return null;
}

export async function notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  await Notification.insertMany(
    unique.map((id) => ({
      user: new Types.ObjectId(id),
      ...payload,
      readAt: null,
    }))
  );
}

export async function notifyAdmins(payload: NotifyPayload): Promise<void> {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await notifyUsers(
    admins.map((a) => String(a._id)),
    payload
  );
}
