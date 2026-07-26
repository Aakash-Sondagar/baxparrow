import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "./hooks";
import type { NotificationScope } from "./api";
import type { BxNotification } from "./types";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationBell({ scope = "admin" }: { scope?: NotificationScope }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: items = [] } = useNotifications(true, scope);
  const { data: count = 0 } = useUnreadCount(true, scope);
  const markRead = useMarkRead(scope);
  const markAll = useMarkAllRead(scope);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      qc.invalidateQueries({ queryKey: ["notifications", scope] });
    }
  }, [open, qc, scope]);

  const onItem = (n: BxNotification) => {
    if (!n.readAt) markRead.mutate(n._id);
    setOpen(false);
    if (n.href) navigate(n.href);
  };

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className="relative cursor-pointer rounded-md border-0 bg-transparent p-1 text-ink transition-colors duration-200 hover:bg-subtle"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-cognac" />
        )}
      </button>
      <div
        className={`absolute right-0 z-50 mt-2 w-[min(320px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-[14px] border border-border bg-card shadow-lg transition-all duration-200 ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <span className="font-display text-sm font-bold text-ink">Notifications</span>
          {count > 0 && (
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent text-xs font-semibold text-cognac"
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </button>
          )}
        </div>
        <ul className="m-0 max-h-[360px] list-none overflow-auto p-0">
          {items.length === 0 && (
            <li className="px-3.5 py-8 text-center text-sm text-muted">
              {scope === "customer"
                ? "No order updates yet"
                : "No notifications yet"}
            </li>
          )}
          {items.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => onItem(n)}
                className={`flex w-full cursor-pointer flex-col gap-0.5 border-0 border-b border-border px-3.5 py-3 text-left transition-colors duration-150 ${
                  n.readAt ? "bg-card hover:bg-subtle" : "bg-subtle hover:bg-border/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{n.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted2">{timeAgo(n.createdAt)}</span>
                </div>
                <span className="text-[13px] text-text3">{n.body}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
