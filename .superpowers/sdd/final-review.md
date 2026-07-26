# Final Whole-Branch Review — Notifications + Tailwind + Sidebar

**Date:** 2026-07-26
**Reviewer:** Senior Code Reviewer (final review, all 9 tasks)
**Plan:** `docs/superpowers/plans/2026-07-26-notifications-tailwind-sidebar.md`
**Spec:** `docs/superpowers/specs/2026-07-26-admin-notifications-tailwind-design.md`
**Method:** Read-only file review (no git repo; no builds run — build was intentionally not executed to keep the tree clean, so all findings below are static or verified against installed dependency source in `node_modules`).

**Assessment: Ready with fixes.** Six must-fix items before merge (3 Critical, 3 Important), plus browser QA.

---

## Strengths

**Plan alignment is high.** All nine tasks landed, and the file touch map matches the plan exactly. The Tailwind migration is genuinely complete: a grep for `t.ink|t.cognac|t.card|t.displayFont|…` across `apps/web/src` returns zero hits, and the only surviving `style={{…}}` are the `tile()` placeholder gradients and one dynamic progress-bar width in `Dashboard.tsx` — precisely the exceptions the plan carved out. `tokens.ts` is down to `tile()` alone, as specified.

**Auth scoping on the notification API is correct.** All four handlers filter on `req.user.id`, and `markRead` uses a compound `{ _id, user }` filter so a request for another user's notification returns 404 rather than leaking or mutating it. `markAllRead` is scoped the same way. This is the security property that mattered most here and it's right in all four places.

**The data model is well-shaped.** The `type` enum is driven by the shared `NOTIFICATION_TYPES` const, so the API and the type system can't drift. The two compound indexes (`{user:1, createdAt:-1}` and `{user:1, readAt:1}`) map exactly onto the two queries the controller actually issues — that's deliberate index design, not cargo cult.

**`stockCrossing` is properly factored.** Pulling the threshold logic out as a pure function made it testable without a database, and the five tests include the genuinely interesting edge case (15 → 0 must prefer `inventory.out` over `inventory.low`). The "crossing only" semantics correctly prevent re-notifying on every save while stock sits below the threshold.

**Guest checkout is handled correctly at every emit site.** `req.user?.id` in `createOrder`, `order.user` in `verifyPayment` and `updateOrderStatus` — guests never produce a customer-facing row, and admins still get theirs. `StoreLayout` gates the bell behind `{user && …}`, so guests never see it or poll for it.

**Frontend query keys are hierarchically correct.** `useMarkRead`/`useMarkAllRead` invalidate `["notifications"]`, which prefix-matches `["notifications","unread-count"]`, so one invalidation refreshes both the list and the badge. Easy to get wrong; done right.

**Sidebar behaves correctly for the primary desktop flow**, uses the `bx_admin_sidebar` key the plan specified, and the mobile drawer closes on overlay click, X, and nav click.

---

## Issues

### Critical

**C1 — Every customer notification deep link points at a route that does not exist.**

The emit sites build customer hrefs as `/track/${orderNo}`:

- `apps/api/src/controllers/order.controller.ts:37` (`order.new`)
- `apps/api/src/controllers/order.controller.ts:72` (`order.paid`)
- `apps/api/src/controllers/admin.controller.ts:85` (`order.status`)

But the router has no `/track/:no` route. The tracking page is registered at `order/:no/track`:

```26:28:apps/web/src/app/router.tsx
    { path: "order/:no/confirmed", element: <Confirm /> },
    { path: "order/:no/track", element: <Track /> },
    { path: "search", element: <Search /> },
```

`NotificationBell.onItem` calls `navigate(n.href)` unconditionally, so every customer who clicks any notification lands on React Router's default 404 error screen. That is 100% of the customer-facing feature's click-through path. Admin hrefs (`/admin/orders`, `/admin/products`) are fine.

Fix: change the three emit sites to `/order/${orderNo}/track`.

**C2 — Any authenticated user can crash the API with a malformed notification id.**

`markRead` passes `req.params.id` straight into a Mongoose query:

```18:26:apps/api/src/controllers/notification.controller.ts
export async function markRead(req: AuthReq, res: Response) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { readAt: new Date() },
    { new: true }
  );
  if (!n) return res.status(404).json({ error: "Not found" });
  res.json(n);
}
```

A non-ObjectId id (`PATCH /api/v1/notifications/abc/read`) produces a Mongoose `CastError`. The API runs Express 4.19, which does not forward async handler rejections to error middleware, and a repo-wide grep confirms there is no `try`/`catch`, no async wrapper, no `express-async-errors`, and no `process.on("unhandledRejection")` anywhere in `apps/api/src`. Under Node's default `--unhandled-rejections=throw`, that rejection terminates the process.

The unguarded-async pattern is pre-existing across the codebase, but this branch is what exposes a client-supplied ObjectId to *non-admin* callers for the first time — every registered customer now has a one-request kill switch on the API.

Fix: validate the id (`Types.ObjectId.isValid`) and return 404 on failure. Separately, add a global async wrapper or `process.on("unhandledRejection")` guard — the whole API needs it, but this route makes it urgent.

**C3 — Notification writes sit unguarded on the payment path and can swallow a successful payment.**

In `verifyPayment`, the notify calls run after the signature check, after `order.save()`, and after the cart is cleared, but before the response:

```58:76:apps/api/src/controllers/order.controller.ts
  await order.save();
  if (req.user) await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  await notifyAdmins({
    type: "order.paid",
    title: "Payment received",
    body: `Order ${order.orderNo} paid · ₹${order.amounts?.total ?? 0}`,
    href: "/admin/orders",
    meta: { orderNo: order.orderNo },
  });
  if (order.user) {
    await notifyUsers([String(order.user)], {
```

If `notifyAdmins` throws for any reason — a transient Mongo error, a validation failure on the `Notification` schema, an unexpected admin `_id` — the client never receives `{ ok: true, order }` and (per C2) the process may die. The payment is captured and the order is marked paid, but the customer sees a failed checkout. `createOrder` has the same shape: the Razorpay order and the Mongo order both already exist by the time notify runs.

A notification is an auxiliary side effect and must never be able to fail a domain operation. Fix: wrap every emit in `try/catch` with a log, or fire-and-forget with `.catch(logger.error)`. This applies to all eight emit sites across `order.controller.ts`, `admin.controller.ts`, and `product.controller.ts`.

---

### Important

**I1 — `font-display` and `font-body` are dead classes; Archivo is never applied anywhere.**

`global.css` registers fonts in `@theme` under the `--font-family-*` namespace:

```48:50:apps/web/src/styles/global.css
  --font-family-display: var(--font-display);
  --font-family-body: var(--font-body);
  --font-family-mono: var(--font-mono);
```

Tailwind v4's font-family theme namespace is `--font-*`, not `--font-family-*`. Verified against the installed `tailwindcss@4.3.3`: its own `theme.css` declares `--font-sans`, `--font-serif`, `--font-mono`, and the string `--font-family` does not appear anywhere in the package's `dist/`. So `--font-family-display` registers no utility, and Tailwind silently skips the unrecognized `font-display` candidate rather than erroring.

`font-display` is used ~30 times across the app (logo, every heading, stat numbers, the notification dropdown title). All are no-ops, so those elements inherit Instrument Sans from the base `body` rule. Archivo is loaded in `index.html` and then never used. `font-body` is likewise dead but harmless (inherited anyway). `font-mono` works only by accident: the plain unlayered `:root` block redefines `--font-mono`, which outranks Tailwind's layered default, so the built-in `font-mono` utility happens to pick up Space Mono.

This is the highest-impact visual defect of the migration and the exact class of bug the un-run browser QA would have caught immediately.

Fix: rename the three keys inside `@theme` to `--font-display`, `--font-body`, `--font-mono`.

**I2 — Every `@theme` color is self-referential and works only by cascade accident.**

```28:34:apps/web/src/styles/global.css
@theme {
  --color-bg: var(--color-bg);
  --color-canvas: var(--color-canvas);
  --color-admin-canvas: var(--color-admin-canvas);
  --color-ink: var(--color-ink);
  --color-cognac: var(--color-cognac);
```

Tailwind emits `@theme` declarations into `@layer theme`, which unlayered CSS outranks. The plain `:root` block at the top of the same file is unlayered, so it wins the cascade and the theme layer's circular declaration is discarded before it can form a cycle. Colors therefore render correctly today.

They render correctly for a reason no one will remember. Anyone who deletes the "duplicate" `:root` block — a completely reasonable cleanup — turns all 19 colors into `var()` self-references, which are invalid at computed-value time, and the entire palette collapses at once with no build error.

Fix: put the literal hex values directly in `@theme` and delete the plain `:root` block. Tailwind emits theme variables to `:root` itself, so nothing is lost.

**I3 — 401 handling from the spec is not implemented, and polling makes it worse.**

Spec §Error handling requires "Auth 401: clear session per existing auth patterns." `lib/api.ts` has only a request interceptor; there is no response interceptor and no `logout()` call on 401 anywhere. `main.tsx` constructs a bare `new QueryClient()`, so the defaults apply: `retry: 3` and `refetchOnWindowFocus: true`.

Consequence: once the JWT expires, each of the two notification queries fires four failing requests every 30 seconds, indefinitely, plus more on every window focus — while `AuthContext` still reads `user` from localStorage and shows the UI as logged in. The user sees a working app that quietly does nothing.

Fix: add a response interceptor that clears the session on 401, and set `retry: false` (or a 401-aware retry predicate) for the notification queries.

**I4 — Mark-read is not optimistic, contradicting the spec.**

Spec: "Click item → mark read (optimistic) → navigate `href`" and "Mark-read failure: optimistic UI with rollback." The implementation awaits the mutation and invalidates on success — correct, but neither optimistic nor rollback-capable:

```29:37:apps/web/src/features/notifications/hooks.ts
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
```

Related: the dropdown never refetches on open, so a user who opens the bell 29 seconds into a poll window sees stale contents with no way to force a refresh.

Fix: add `onMutate`/`onError`/`onSettled` for optimistic update with rollback, and call `refetch()` when `open` flips true.

**I5 — The closed mobile drawer stays in the keyboard tab order.**

`AdminLayout` renders `sidebar` twice — a desktop copy and a mobile copy. The desktop copy is `hidden`/`lg:hidden`, so it leaves the accessibility tree cleanly. The mobile copy is only translated off-screen:

```134:140:apps/web/src/routes/admin/AdminLayout.tsx
      <div
        className={`fixed inset-y-0 left-0 z-[100] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>
```

Below `lg` with the drawer closed, all five nav links, the close button, and the logout button remain focusable off-screen. A keyboard or screen-reader user tabs into an invisible menu — and can trigger logout without knowing why.

This is also worth noting against the spec's "Single sidebar instance" requirement: there are still two instances, hidden by breakpoint. That's a pragmatic implementation, but the ghost-sidebar class of bug the spec was trying to eliminate is still present in the a11y layer.

Fix: add `invisible`/`pointer-events-none` (or the `inert` attribute) to the mobile wrapper when `!sidebarOpen`.

**I6 — Opening admin on a narrow viewport permanently destroys the desktop sidebar preference.** *(previously logged; must fix)*

```41:54:apps/web/src/routes/admin/AdminLayout.tsx
  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  // On mobile, start closed when crossing below lg
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (!mq.matches) setSidebarOpen(false);
    };
    sync();
```

`sync()` runs on mount, so any load under 1024px forces `sidebarOpen` false, which trips the persistence effect and writes `"0"`. Nothing writes it back on the way up. Result: check the admin on a phone once, and the next desktop session opens with the sidebar hidden. The plan explicitly required persisting the *desktop* preference, so this defeats the stated requirement rather than just being untidy.

Fix: separate user intent from responsive state — persist only on explicit toggle, or only when `mq.matches`.

**I7 — Test coverage does not reach anything that can actually break.** *(previously logged; should fix)*

The only tests are the five `stockCrossing` cases. Untested: the auth scoping that is the feature's core security property, the `limit` clamp, the 404-on-foreign-id path, `read-all`, and every emit site.

Worse, `apps/api/package.json` has no `test` script at all, so the one existing suite runs only if someone remembers the `pnpm exec tsx --test …` incantation from the plan. It is not in any automated path and will rot.

Fix (minimum): add `"test": "tsx --test src/**/*.test.ts"` to `apps/api/package.json`. Then add supertest-level coverage for user A being unable to read or mark-read user B's notifications.

**I8 — A stale `packages/shared/src/index.js` shadows `index.ts` in the web build.**

`packages/shared/tsconfig.json` sets no `outDir`, so `tsc` emits `index.js` next to the source. That artifact is present and stale: `index.js` was written at 13:24, `index.ts` at 14:48 (when Task 6 added `NOTIFICATION_TYPES`), and the `.js` file does not contain them.

The web alias resolves `@baxparrow/shared` to the directory `packages/shared/src`, and Vite's default `resolve.extensions` orders `.js` ahead of `.ts` — so the browser bundle uses the stale JavaScript while `tsc` type-checks against the fresh TypeScript. It is harmless today only because the web imports just `computeTotals`, which is identical in both. The divergence is silent and will bite the first time a shared value changes.

Fix: delete `packages/shared/src/index.js`, give the package an `outDir`, and ignore build output.

---

### Minor

**M1 — `bg-none` is fine; close the logged finding.** It is a real Tailwind utility (`background-image: none`), and Tailwind 4.3.3's preflight already sets `background-color: transparent` on `button`/`input`/`select`/`textarea` (verified in `preflight.css:243-257`), so all four usages behave exactly as the previous inline `background: none` did. Switching to `bg-transparent` would only be an intent-clarity change.

**M2 — Redundant index on `Notification.user`.** The field-level `index: true` duplicates the prefix of the `{user:1, createdAt:-1}` compound index. Drop the field-level one; it costs write throughput and storage for nothing.

**M3 — No retention policy.** Every event writes one row per admin, and `product.updated` fires on every single save. Editing 50 products with 3 admins is 150 rows, none of which are ever deleted. Add a TTL index (say 90 days) before this ships to a real store.

**M4 — `insertMany` is ordered by default.** One rejected document aborts the remainder of the batch, so a single bad admin id would silently drop notifications for all admins after it. Pass `{ ordered: false }`.

**M5 — Unread indicator is a dot, not a count.** The spec says "Bell + unread badge (badge hidden at 0)"; the implementation renders a 2×2 dot with no number. This matches the code the plan specified, so it is plan-aligned — flagging it only so the product owner confirms that's the intended UI.

**M6 — `verifyPayment` is not idempotent.** A replayed or double-submitted callback re-runs the whole block and emits a duplicate set of `order.paid` notifications to every admin.

**M7 — `inventory.low` / `inventory.out` are only half reachable.** `stockCrossing` is wired into `product.update` only, and nothing in the order flow decrements stock (`buildOrderLines` reads products but never writes). So inventory alerts can fire from a manual admin stock edit and from nothing else — the spec's "stock crosses low / out threshold" intent isn't achievable through actual sales. Pre-existing app gap, not a regression, but it means the feature is less useful than the spec implies.

**M8 — Desktop hide relies on utility emit order.** `hidden shrink-0 lg:block ${sidebarOpen ? "" : "lg:hidden"}` puts `lg:block` and `lg:hidden` in play simultaneously; the winner is whichever Tailwind emits later. It should resolve to `hidden` (display utilities sort with `hidden` after `block`), and the per-task review reported the toggle working — but `${sidebarOpen ? "lg:block" : "hidden"}` removes the ambiguity entirely. Confirm in browser QA either way.

**M9 — Dropdown accessibility gaps.** No Escape-to-close, no focus return to the trigger on close, no `aria-haspopup`, no `role="menu"`. Outside-click and `aria-expanded` are handled.

**M10 — No cursor pagination.** Deliberately deferred by the plan and optional in the spec. Consequence worth stating: with `limit` capped at 50 and no cursor, there is no way to reach older notifications — the bell is a recent-activity view only.

**M11 — Browser QA still not run** across Tasks 2–5 and 9. I1 is exactly what it would have caught in the first thirty seconds; treat it as blocking rather than a nice-to-have.

---

## Triage of previously logged minor findings

| Logged finding | Verdict |
|---|---|
| Resize below `lg` overwrites localStorage sidebar pref | **Must fix** — I6; defeats a stated plan requirement |
| `bg-none` may not be a real Tailwind utility | **Close — not a bug** — M1; valid utility, preflight already zeroes button backgrounds |
| Visual / browser QA not run (Tasks 2–5, 9) | **Must run** — M11; it would have caught I1 |
| No HTTP integration tests for notification API | **Should fix** — I7; add a `test` script at minimum, plus cross-user scoping tests |

---

## Verdict

**Ready with fixes.**

The architecture is sound and the plan was followed faithfully. Nothing here requires rework of the design — every finding is a contained fix.

**Must fix before merge**

1. C1 — correct the three customer hrefs to `/order/${orderNo}/track`
2. C2 — validate the ObjectId in `markRead`; add an unhandled-rejection guard
3. C3 — wrap all eight notify emit sites so they can never fail a domain operation
4. I1 — rename the `@theme` font keys to the `--font-*` namespace
5. I2 — inline literal color values in `@theme`, drop the shadow `:root` block
6. I6 — stop the responsive handler from clobbering the persisted preference

Then run the browser QA pass (I1, I2, and M8 all need visual confirmation) and the spec's verification checklist end to end.

**Should fix soon after:** I3 (401 handling), I4 (optimistic mark-read), I5 (drawer focus trap), I7 (test script + scoping tests), I8 (stale shared artifact).
