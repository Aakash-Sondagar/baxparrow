import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationScope,
} from "./api";
import type { BxNotification } from "./types";

const POLL_MS = 30_000;

export function useNotifications(enabled: boolean, scope: NotificationScope) {
  return useQuery({
    queryKey: ["notifications", scope],
    queryFn: () => fetchNotifications(20, scope),
    enabled,
    refetchInterval: POLL_MS,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 2,
  });
}

export function useUnreadCount(enabled: boolean, scope: NotificationScope) {
  return useQuery({
    queryKey: ["notifications", scope, "unread-count"],
    queryFn: () => fetchUnreadCount(scope),
    enabled,
    refetchInterval: POLL_MS,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 2,
  });
}

export function useMarkRead(scope: NotificationScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id, scope),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["notifications", scope] });
      const prevList = qc.getQueryData<BxNotification[]>(["notifications", scope]);
      const prevCount = qc.getQueryData<number>(["notifications", scope, "unread-count"]);
      qc.setQueryData<BxNotification[]>(["notifications", scope], (old = []) =>
        old.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      if (typeof prevCount === "number" && prevCount > 0) {
        qc.setQueryData(["notifications", scope, "unread-count"], prevCount - 1);
      }
      return { prevList, prevCount };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prevList) qc.setQueryData(["notifications", scope], ctx.prevList);
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(["notifications", scope, "unread-count"], ctx.prevCount);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications", scope] });
    },
  });
}

export function useMarkAllRead(scope: NotificationScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(scope),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications", scope] });
      const prevList = qc.getQueryData<BxNotification[]>(["notifications", scope]);
      const prevCount = qc.getQueryData<number>(["notifications", scope, "unread-count"]);
      qc.setQueryData<BxNotification[]>(["notifications", scope], (old = []) =>
        old.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
      qc.setQueryData(["notifications", scope, "unread-count"], 0);
      return { prevList, prevCount };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevList) qc.setQueryData(["notifications", scope], ctx.prevList);
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(["notifications", scope, "unread-count"], ctx.prevCount);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications", scope] });
    },
  });
}
