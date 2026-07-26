# Baxparrow: Notifications, Sidebar Toggle, Tailwind Tokens

**Date:** 2026-07-26  
**Status:** Approved (pending final user review of this spec)  
**Scope:** Full web app (`apps/web`) + API notifications (`apps/api`)

## Goals

1. End-to-end in-app notifications for **admins and customers**
2. Fix broken admin sidebar toggle
3. Adopt **Tailwind** for all `apps/web` styling
4. Promote existing JS color/font tokens into real **design tokens** (CSS variables + Tailwind theme)

## Non-goals (v1)

- Email / SMS / push
- WebSockets or SSE
- Notification preference UI
- Real-time sub-second delivery

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Tailwind scope | Entire web app (admin + storefront) |
| Notification content | Full activity feed (orders, inventory, product CRUD, bulk, system) |
| Audience | Admins + customers |
| Delivery | Poll + Mongo `Notification` model (~30s React Query interval) |

---

## 1. Architecture & data model

### Notification document

```ts
{
  user: ObjectId,           // recipient
  type: NotificationType,
  title: string,
  body: string,
  href?: string,            // deep link
  meta?: Record<string, unknown>,
  readAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Types:**

- `order.new` | `order.paid` | `order.status`
- `inventory.low` | `inventory.out`
- `product.created` | `product.updated` | `product.deleted`
- `bulk.completed`
- `system`

### Emit points

| Event | Recipients |
|-------|------------|
| New order created | All admins + customer (if authenticated) |
| Payment verified | All admins + customer (if authenticated) |
| Order status changed | Customer (if linked) + all admins |
| Product create / update / delete | All admins |
| Bulk upload finished | Acting admin |
| Stock crosses low / out threshold | All admins |

**Stock thresholds:** reuse any existing low-stock logic in metrics/dashboard; if none, treat `qty <= 5` as low and `qty === 0` as out. Emit at most once per product per threshold crossing (avoid spam on every save).

**Guest checkout:** if the order has no `user`, only admins are notified for that order’s events (no customer in-app notification).

Helper: `notifyUsers(userIds, payload)` and `notifyAdmins(payload)` in API.

### API (auth required)

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/notifications` | List for current user (`limit`, optional `cursor`) |
| `GET` | `/notifications/unread-count` | `{ count }` |
| `PATCH` | `/notifications/:id/read` | Set `readAt` (own rows only) |
| `POST` | `/notifications/read-all` | Mark all unread as read for current user |

Shared Zod schemas live in `packages/shared` where useful for request validation.

### Frontend data

- Hooks via TanStack Query: list + unread count
- `refetchInterval: 30_000`
- Shared `NotificationBell` used in admin header and storefront header
- Click item → mark read (optimistic) → navigate `href` when present
- Guests: hide customer bell

---

## 2. Design tokens, Tailwind, sidebar

### Tokens

Map current `apps/web/src/styles/tokens.ts` into CSS variables on `:root`, then Tailwind theme:

| Token | Example value | Utility examples |
|-------|---------------|------------------|
| canvas / adminCanvas / bg | `#EDE8E0` / `#F4F1EC` / `#F7F4EF` | `bg-canvas`, `bg-admin-canvas` |
| ink | `#1C1917` | `bg-ink`, `text-ink` |
| cognac / cognacDark | `#A94D28` / `#8F3F20` | `bg-cognac`, `text-cognac` |
| tan | `#E8B58C` | `bg-tan` |
| card / border / subtle | white / `#E7E2D9` / `#FAF7F2` | `bg-card`, `border-border` |
| text / muted scales | existing | `text-text`, `text-muted` |
| green / amber / danger | existing | semantic utilities |
| fonts | Archivo / Instrument Sans / Space Mono | `font-display`, `font-body`, `font-mono` |

- Retire widespread `style={{...}}` and `t.*` imports across `apps/web`
- Keep `tile(n)` (or equivalent) for product placeholder gradients only

### Tailwind setup

- Tailwind **v4** in `apps/web` via Vite
- `global.css`: `@import "tailwindcss"`, `@theme` / CSS variables, base resets
- Convert all storefront + admin UI files (~24) to utilities; preserve current visual language

### Sidebar toggle

**Root cause today:** dual sidebar (always-on desktop + mobile drawer) with unused class hooks and no responsive CSS; hamburger only moves the off-screen copy.

**Fix:**

- Single sidebar instance
- Desktop (`lg+`): hamburger fully hides/shows the sidebar (not icon-rail); preference in `localStorage`
- Mobile (`<lg`): off-canvas drawer + overlay; close (X) visible
- State name: `sidebarOpen`

---

## 3. UI, errors, verification

### Admin / customer bell UI

- Bell + unread badge (badge hidden at 0)
- Dropdown: title, body snippet, relative time, unread indicator
- “Mark all as read”
- Empty state: “No notifications yet”
- Unknown `type`: still render `title` / `body`

### Customer specifics

- Same component in `StoreLayout` when `user` is logged in
- Customer-facing types primarily order lifecycle (+ any `system` for that user)

### Error handling

- List/count fetch failure: fail soft (empty/previous data), retry on next poll
- Mark-read failure: optimistic UI with rollback
- Auth 401: clear session per existing auth patterns

### Verification checklist

- [ ] Place order → admin(s) and customer receive notifications
- [ ] Status change / payment / bulk / product CRUD emit expected rows
- [ ] Unread badge updates; mark one / mark all clears correctly
- [ ] Sidebar toggles on desktop and mobile
- [ ] Home + admin dashboard visual spot-check after Tailwind migration
- [ ] `pnpm` build for web + api succeeds

---

## File touch map (expected)

**API:** `Notification` model, controller, routes; emit hooks in order/product/admin/upload flows  
**Shared:** notification types / schemas as needed  
**Web:** Tailwind config/CSS tokens; `NotificationBell` + hooks; `AdminLayout`, `StoreLayout`; convert remaining pages/components off inline styles

## Open follow-ups (explicitly later)

- Email digest or transactional mail
- SSE upgrade if poll latency becomes painful
- Per-user notification preferences
