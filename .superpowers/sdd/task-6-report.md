# Task 6 Report: Shared types + notify service + Notification model

## Status: Complete

## TDD Evidence

### RED — test written first, run before implementation existed

Command (from `apps/api`):
```bash
pnpm exec tsx --test src/services/notify.service.test.ts
```

Output (failure — module not found):
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\apps\api\src\services\notify.service.js' imported from ...notify.service.test.ts
...
✖ src\services\notify.service.test.ts (215.5496ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

### Implementation
- Appended `NOTIFICATION_TYPES` (const array) + `NotificationType` (union type) to `packages/shared/src/index.ts`.
- Created `apps/api/src/models/Notification.ts` — Mongoose model with `user`, `type` (enum-constrained to `NOTIFICATION_TYPES`), `title`, `body`, `href`, `meta`, `readAt`; indexes on `{user, createdAt}` and `{user, readAt}`.
- Created `apps/api/src/services/notify.service.ts` — `LOW_STOCK_THRESHOLD = 10`, `NotifyPayload` type, `stockCrossing(prev, next)`, `notifyUsers(userIds, payload)`, `notifyAdmins(payload)`.

### GREEN — same command, after implementation

Command (from `apps/api`):
```bash
pnpm exec tsx --test src/services/notify.service.test.ts
```

Output:
```
▶ stockCrossing
  ✔ emits inventory.out when crossing to 0 (1.1214ms)
  ✔ emits inventory.low when crossing into <=10 from above (0.096ms)
  ✔ returns null when staying low without hitting 0 (0.0571ms)
  ✔ returns null when increasing stock (0.0545ms)
  ✔ prefers out over low when landing on 0 from above threshold (0.055ms)
✔ stockCrossing (2.1146ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

**Test summary: 5/5 passing.**

## Additional verification
- `pnpm --filter @baxparrow/api build` (`tsc`) → succeeds, no type errors.
- No linter errors on any of the 4 edited/created files.

## Files changed
- Modified: `packages/shared/src/index.ts` (added `NOTIFICATION_TYPES`, `NotificationType`)
- Created: `apps/api/src/models/Notification.ts`
- Created: `apps/api/src/services/notify.service.ts`
- Created: `apps/api/src/services/notify.service.test.ts`

## Concerns
- `notifyUsers`/`notifyAdmins` are not covered by automated tests (would require a Mongo test double/in-memory server); only the pure `stockCrossing` helper was testable per the brief's TDD scope. Manual/integration verification of these will happen in Task 7/8 when routes and controllers wire them in.
- No commits made per constraints.

Report path: `.superpowers/sdd/task-6-report.md`
