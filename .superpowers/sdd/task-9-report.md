# Task 9 Report: Frontend NotificationBell + hooks

## Status: Done

## Files created
- `apps/web/src/features/notifications/types.ts` — `BxNotification` type
- `apps/web/src/features/notifications/api.ts` — `fetchNotifications`, `fetchUnreadCount`, `markNotificationRead`, `markAllNotificationsRead` (paths match backend routes exactly: `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all`)
- `apps/web/src/features/notifications/hooks.ts` — `useNotifications`, `useUnreadCount` (both poll every 30s via `refetchInterval: 30_000`), `useMarkRead`, `useMarkAllRead` (invalidate `["notifications"]` on success)
- `apps/web/src/features/notifications/NotificationBell.tsx` — bell icon with unread dot, click-outside-to-close dropdown, list with relative timestamps, mark-all-read action, click-item marks read + navigates to `href`

## Files modified
- `apps/web/src/routes/admin/AdminLayout.tsx` — removed placeholder `Bell` button/import, renders `<NotificationBell />` in header (unconditional; admin routes are already auth-gated)
- `apps/web/src/components/StoreLayout.tsx` — removed placeholder `Bell` button/import, renders `<NotificationBell />` only `{user && ...}` (guest gating preserved as instructed)

## Verified against backend (Task 6-8 output)
- Route paths in `apps/api/src/routes/index.ts` match `api.ts` exactly.
- `notification.controller.ts` response shapes (`{ items }`, `{ count }`, raw doc, `{ ok: true }`) match how `api.ts` unwraps them.

## Test summary
- `pnpm --filter @baxparrow/web build` (tsc + vite build) — **passes**, no type errors.
- Lint check on all new/modified files — no errors.
- Manual E2E checklist (badge on new activity, click-to-read, mark-all, guest exclusion) not run live (no dev server/backend session started); code follows exact spec from plan Task 9 Step 4 expectations.

## Concerns
- Existing prod bundle warning (`>500kB chunk`) is pre-existing/unrelated to this change, not introduced by this task.
- No automated test coverage added for `NotificationBell` (none existed for sibling features either — consistent with repo convention).

## Commits
None (not requested).

Report path: `.superpowers/sdd/task-9-report.md`
