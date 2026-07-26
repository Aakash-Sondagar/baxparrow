# Final Fix Report — Critical + Important findings from `final-review.md`

**Date:** 2026-07-26
**Scope:** C1, C2, C3 (order path only), I1/I2 (theme keys), I6 (sidebar persistence). No other findings touched.

## Fixes applied

### C1 — Customer notification hrefs pointed at a nonexistent route
Changed `` `/track/${orderNo}` `` → `` `/order/${orderNo}/track` `` to match the router's `order/:no/track`.

- `apps/api/src/controllers/order.controller.ts` — `createOrder` (`order.new`), `verifyPayment` (`order.paid`)
- `apps/api/src/controllers/admin.controller.ts` — `updateOrderStatus` (`order.status`)

Verified with a repo-wide grep for `/track/` under `apps/`: zero remaining occurrences.

### C2 — `markRead` CastError could crash the API
`apps/api/src/controllers/notification.controller.ts`:

- Added `import { Types } from "mongoose"` and an `ObjectId.isValid` guard returning `400 {"error":"Invalid id"}` before the query.
- Wrapped the `findOneAndUpdate` body in `try/catch`, logging via `console.error` and returning `500` on unexpected errors.

The compound `{ _id, user }` filter and the existing 404-on-foreign-id behaviour are unchanged.

### C3 — Notify calls unguarded on the order/payment paths
`apps/api/src/controllers/order.controller.ts`:

- `createOrder` — both `notifyAdmins` and `notifyUsers` moved inside a `try/catch`; failures are logged with `console.error` and the `201` response still goes out.
- `verifyPayment` — same treatment; `res.json({ ok: true, order })` can no longer be blocked by a notification write failure.

Emit sites in `admin.controller.ts` and `product.controller.ts` were left as-is to stay inside the requested scope; see Remaining concerns.

### I1 + I2 — Tailwind v4 theme keys
`apps/web/src/styles/global.css`:

- `@theme` now holds literal values instead of self-referential `var()`s (all 19 colors + 3 fonts).
- Font keys renamed from the unrecognized `--font-family-*` namespace to Tailwind v4's `--font-*`.
- The plain `:root` block was kept (per instruction) so `var(--font-body)`, `var(--color-ink)` etc. in the `@layer base` body rules keep working. Values in the two blocks are identical literals, so the cascade order no longer matters.

Confirmed in the built CSS: `.font-display{font-family:var(--font-display)}` is now emitted — previously the candidate was silently skipped and Archivo was never applied.

### I6 — Resize below `lg` destroyed the desktop sidebar preference
`apps/web/src/routes/admin/AdminLayout.tsx`:

- Deleted the `useEffect` that wrote `localStorage` on every `sidebarOpen` change.
- Added a `toggleSidebar` handler used by the header hamburger that writes `bx_admin_sidebar` **only** when `window.matchMedia("(min-width: 1024px)").matches`.
- The media-query `sync()` still calls `setSidebarOpen(false)` below `lg`, but no longer persists — as do the mobile X button and nav-link auto-close, which are ephemeral by design.

## Test results

| Command | Result |
|---|---|
| `pnpm --filter @baxparrow/api build` | **pass** (tsc, exit 0) |
| `pnpm --filter @baxparrow/web build` | **pass** (tsc + vite, exit 0, built in 7.51s) |
| `pnpm exec tsx --test src/services/notify.service.test.ts` | **pass** — 5/5 `stockCrossing` tests, 0 fail |
| Linter on all 4 changed files | no errors |

## Remaining concerns

- **Browser QA still not run** (M11). I1 and I2 are verified only at the built-CSS level; the Archivo rendering, the full palette, and the M8 desktop sidebar toggle ambiguity all still need visual confirmation.
- **Notify emits outside `order.controller.ts` remain unguarded** — `admin.controller.ts` (`updateOrderStatus`, `bulkImport`) and `product.controller.ts` still `await` notifications before responding. Lower blast radius than the payment path, but the same class of bug as C3.
- **No global unhandled-rejection guard.** C2 is fixed for this one route, but the unguarded-async pattern is repo-wide; the review's recommendation to add an async wrapper or `process.on("unhandledRejection")` is untouched.
- **Not addressed (out of scope, still open):** I3 (401 handling), I4 (optimistic mark-read), I5 (mobile drawer stays in tab order), I7 (test script + scoping tests), I8 (stale `packages/shared/src/index.js`), and all Minor findings.

## Commits
None — explicitly not requested.
