# Task 7: Notification HTTP API

**Files:**
- Create: `apps/api/src/controllers/notification.controller.ts`
- Modify: `apps/api/src/routes/index.ts`

**Produces:**
- `GET /notifications` → `{ items }`
- `GET /notifications/unread-count` → `{ count }`
- `PATCH /notifications/:id/read`
- `POST /notifications/read-all`
All with `auth` middleware.

See plan Task 7 for full controller code.
DO NOT commit.
