# Task 8: Emit notifications from domain controllers

**Files:**
- Modify: `apps/api/src/controllers/order.controller.ts`
- Modify: `apps/api/src/controllers/admin.controller.ts`
- Modify: `apps/api/src/controllers/product.controller.ts`

**Consumes:** `notifyAdmins`, `notifyUsers`, `stockCrossing` from notify.service.ts

Emit on: order create, payment verify, order status change, product create/update/delete (+ stock crossing), bulk import complete.

Guest checkout: admins only (no customer notify without user id).
LOW_STOCK_THRESHOLD crossing via stockCrossing.
DO NOT commit.

Full code snippets in plan Task 8: `docs/superpowers/plans/2026-07-26-notifications-tailwind-sidebar.md`
