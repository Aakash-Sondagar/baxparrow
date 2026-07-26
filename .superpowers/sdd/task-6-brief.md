### Task 6: Shared types + notify service + model

**Files:**
- Modify: `packages/shared/src/index.ts`
- Create: `apps/api/src/models/Notification.ts`
- Create: `apps/api/src/services/notify.service.ts`
- Create: `apps/api/src/services/notify.service.test.ts`

**Interfaces:**
- Produces:
  - `NOTIFICATION_TYPES` const + `NotificationType` type in shared
  - `stockCrossing(prev: number, next: number): "inventory.out" | "inventory.low" | null`
  - `notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void>`
  - `notifyAdmins(payload: NotifyPayload): Promise<void>`
  - `LOW_STOCK_THRESHOLD = 10`

- [ ] **Step 1: Write failing test for stock crossing**

Create `apps/api/src/services/notify.service.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stockCrossing } from "./notify.service.js";

describe("stockCrossing", () => {
  it("emits inventory.out when crossing to 0", () => {
    assert.equal(stockCrossing(3, 0), "inventory.out");
  });
  it("emits inventory.low when crossing into <=10 from above", () => {
    assert.equal(stockCrossing(15, 8), "inventory.low");
  });
  it("returns null when staying low without hitting 0", () => {
    assert.equal(stockCrossing(8, 5), null);
  });
  it("returns null when increasing stock", () => {
    assert.equal(stockCrossing(2, 20), null);
  });
  it("prefers out over low when landing on 0 from above threshold", () => {
    assert.equal(stockCrossing(15, 0), "inventory.out");
  });
});
```

- [ ] **Step 2: Run test â€” expect FAIL**

Run from `apps/api`:

```bash
pnpm exec tsx --test src/services/notify.service.test.ts
```

Expected: FAIL â€” cannot find module / `stockCrossing` not exported.

- [ ] **Step 3: Add shared notification types**

Append to `packages/shared/src/index.ts`:

```ts
export const NOTIFICATION_TYPES = [
  "order.new",
  "order.paid",
  "order.status",
  "inventory.low",
  "inventory.out",
  "product.created",
  "product.updated",
  "product.deleted",
  "bulk.completed",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
```

- [ ] **Step 4: Create model + service**

`apps/api/src/models/Notification.ts`:

```ts
import { Schema, model, Types } from "mongoose";
import { NOTIFICATION_TYPES } from "@baxparrow/shared";

const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String },
    meta: { type: Schema.Types.Mixed },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

export const Notification = model("Notification", notificationSchema);
```

`apps/api/src/services/notify.service.ts`:

```ts
import { Types } from "mongoose";
import type { NotificationType } from "@baxparrow/shared";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

export const LOW_STOCK_THRESHOLD = 10;

export type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
};

/** Pure helper: emit only on threshold crossing to avoid spam. */
export function stockCrossing(prev: number, next: number): "inventory.out" | "inventory.low" | null {
  if (next === 0 && prev > 0) return "inventory.out";
  if (next > 0 && next <= LOW_STOCK_THRESHOLD && prev > LOW_STOCK_THRESHOLD) return "inventory.low";
  return null;
}

export async function notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  await Notification.insertMany(
    unique.map((id) => ({
      user: new Types.ObjectId(id),
      ...payload,
      readAt: null,
    }))
  );
}

export async function notifyAdmins(payload: NotifyPayload): Promise<void> {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await notifyUsers(
    admins.map((a) => String(a._id)),
    payload
  );
}
```

- [ ] **Step 5: Run test â€” expect PASS**

```bash
pnpm exec tsx --test src/services/notify.service.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add packages/shared/src/index.ts apps/api/src/models/Notification.ts apps/api/src/services/notify.service.ts apps/api/src/services/notify.service.test.ts
git commit -m "feat(api): add Notification model and notify helpers"
```

---


## Extra
- DO NOT commit.
- Follow TDD: write failing test first, then implement.
- LOW_STOCK_THRESHOLD = 10.

