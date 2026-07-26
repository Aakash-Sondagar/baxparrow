import { api } from "../../lib/api";
import type { BxNotification } from "./types";

export type NotificationScope = "admin" | "customer";

export const fetchNotifications = async (limit = 20, scope: NotificationScope = "admin") => {
  const { data } = await api.get<{ items: BxNotification[] }>("/notifications", {
    params: { limit, scope },
  });
  return data.items;
};

export const fetchUnreadCount = async (scope: NotificationScope = "admin") => {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { scope },
  });
  return data.count;
};

export const markNotificationRead = async (id: string, scope: NotificationScope = "admin") => {
  const { data } = await api.patch<BxNotification>(`/notifications/${id}/read`, null, {
    params: { scope },
  });
  return data;
};

export const markAllNotificationsRead = async (scope: NotificationScope = "admin") => {
  await api.post("/notifications/read-all", null, { params: { scope } });
};
