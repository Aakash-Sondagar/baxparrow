# Task 7 Report: Notification HTTP API

## Status: Complete

## Implementation

### Created `apps/api/src/controllers/notification.controller.ts`
- `list` — GET handler; paginates with `limit` query (default 20, max 50), returns `{ items }` sorted by `-createdAt`.
- `unreadCount` — returns `{ count }` for unread notifications (`readAt: null`).
- `markRead` — PATCH handler; updates single notification by `_id` scoped to `req.user.id`; 404 if not found.
- `markAllRead` — POST handler; bulk-updates all unread for user; returns `{ ok: true }`.

### Modified `apps/api/src/routes/index.ts`
Mounted four routes, all behind `auth` middleware (any authenticated role):
- `GET /notifications` → `N.list`
- `GET /notifications/unread-count` → `N.unreadCount`
- `PATCH /notifications/:id/read` → `N.markRead`
- `POST /notifications/read-all` → `N.markAllRead`

## Verification

### Build
```bash
pnpm --filter @baxparrow/api build
```
Output: `tsc` succeeded (exit 0).

### Manual smoke (not run)
Requires running API + valid Bearer JWT. Example:
```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/v1/notifications/unread-count
```
Expected: `{"count":0}` or a positive integer.

## Files changed
- Created: `apps/api/src/controllers/notification.controller.ts`
- Modified: `apps/api/src/routes/index.ts`

## Concerns
- No automated HTTP/integration tests for these endpoints; manual smoke deferred until API is running with seeded data.
- `markRead` does not validate MongoDB ObjectId format — invalid IDs return 404 (acceptable).
- No commits made per constraints.

Report path: `.superpowers/sdd/task-7-report.md`
