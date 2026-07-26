### Task 4: Convert remaining admin pages to Tailwind

**Files:**
- Modify: `apps/web/src/routes/admin/Dashboard.tsx`
- Modify: `apps/web/src/routes/admin/Products.tsx`
- Modify: `apps/web/src/routes/admin/ProductForm.tsx`
- Modify: `apps/web/src/routes/admin/Orders.tsx`
- Modify: `apps/web/src/routes/admin/Categories.tsx`
- Modify: `apps/web/src/routes/admin/BulkUpload.tsx`
- Modify: `apps/web/src/routes/admin/AdminLogin.tsx`
- Modify: `apps/web/src/routes/admin/ProtectedAdmin.tsx` (only if it has styles)

**Interfaces:**
- Consumes: token utilities; no `t.` color/font imports

**Conversion map (apply everywhere):**

| Old | New |
|-----|-----|
| `t.adminCanvas` / `t.bg` / `t.canvas` | `bg-admin-canvas` / `bg-bg` / `bg-canvas` |
| `t.ink` | `text-ink` / `bg-ink` |
| `t.cognac` | `text-cognac` / `bg-cognac` |
| `t.card` + border | `bg-card border border-border rounded-[14px]` |
| `t.displayFont` | `font-display` |
| `t.monoFont` | `font-mono` |
| `t.green` / `t.amber` | `text-green` / `text-amber` |
| inline padding/flex | Tailwind spacing/flex utilities |

- [ ] **Step 1: Convert `Dashboard.tsx` first as the reference**

Remove `import { t } from ...`. Replace every `style={{...}}` with className utilities using the map above. Keep Recharts colors as hex props if the chart API requires strings (`#A94D28`, `#E7E2D9`).

- [ ] **Step 2: Convert remaining admin route files the same way**

For each file listed above: delete `t` import (if present), replace inline styles with utilities. Keep behavior unchanged.

- [ ] **Step 3: Grep for leftover admin inline tokens**

Run:

```bash
rg "from [\"'].*styles/tokens|style=\{\{" apps/web/src/routes/admin -n
```

Expected: no `tokens` imports except possibly none; `style={{` only for dynamic chart/widths if unavoidable â€” prefer Tailwind arbitrary values.

- [ ] **Step 4: Spot-check admin pages**

Visit dashboard, products, orders, categories, bulk, login â€” layout intact.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add apps/web/src/routes/admin
git commit -m "refactor(admin): migrate admin pages to Tailwind"
```

---


## Extra
- DO NOT commit.
- Convert ALL listed admin pages fully off inline styles / t imports.
- Keep Recharts color props as hex if required.

