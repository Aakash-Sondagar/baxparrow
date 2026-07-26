# Task 9: Frontend NotificationBell + hooks

**Files:**
- Create: `apps/web/src/features/notifications/types.ts`
- Create: `apps/web/src/features/notifications/api.ts`
- Create: `apps/web/src/features/notifications/hooks.ts`
- Create: `apps/web/src/features/notifications/NotificationBell.tsx`
- Modify: `apps/web/src/routes/admin/AdminLayout.tsx`
- Modify: `apps/web/src/components/StoreLayout.tsx`

**Produces:** `<NotificationBell />` with unread badge, dropdown, mark read / mark all; poll 30s; wire into admin header and storefront header (when logged in).

Full code in plan Task 9: `docs/superpowers/plans/2026-07-26-notifications-tailwind-sidebar.md`

DO NOT commit.
Build must pass: `pnpm --filter @baxparrow/web build`
