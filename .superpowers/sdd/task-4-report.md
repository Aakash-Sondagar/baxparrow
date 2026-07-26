# Task 4 Report: Convert remaining admin pages to Tailwind

## Status: Complete

## Files converted
- `apps/web/src/routes/admin/Dashboard.tsx`
- `apps/web/src/routes/admin/Products.tsx`
- `apps/web/src/routes/admin/ProductForm.tsx`
- `apps/web/src/routes/admin/Orders.tsx`
- `apps/web/src/routes/admin/Categories.tsx`
- `apps/web/src/routes/admin/BulkUpload.tsx`
- `apps/web/src/routes/admin/AdminLogin.tsx`
- `apps/web/src/routes/admin/ProtectedAdmin.tsx` — no changes needed (no styles/`t` import present)

All `import { t } from "../../styles/tokens"` statements removed. Every `style={{...}}` block was replaced with Tailwind `className` utilities using the conversion map (`bg-card border border-border rounded-[14px]`, `font-display`, `font-mono`, `text-green`/`text-amber`/`text-cognac`/`text-danger`, `bg-admin-canvas`, etc.). Exact pixel values that don't map onto Tailwind's default spacing/sizing scale (e.g. `22px`, `18px`, `13.5px`) were preserved via arbitrary-value utilities (`p-[22px]`, `text-[13.5px]`) so the visual output is unchanged.

Shared inline style objects (`field`, `label`, `card`, `h` in `ProductForm.tsx`/`AdminLogin.tsx`, and `badge()` in `Dashboard.tsx`/`Orders.tsx`) were converted from style-object factories to className-string factories, keeping the same call-site ergonomics (`className={badge(status)}` instead of `style={badge(status)}`).

## Remaining `style={{...}}` usages (expected/unavoidable)
Grep for `style=\{\{` in `apps/web/src/routes/admin` still matches 3 lines, all intentional:
1. `Categories.tsx` / `Products.tsx` — `style={{ background: tile(i) }}` for the placeholder product/category tile gradients. `tile()` returns a `repeating-linear-gradient(...)` string that isn't expressible as a static Tailwind utility (this is explicitly called out as a `@deprecated`-adjacent, permanent helper in `styles/tokens.ts`, not a design token).
2. `Dashboard.tsx` — Recharts `<Tooltip labelStyle={{ color: "#1C1917", fontWeight: 700 }} />`. Recharts requires a plain style object/hex string for this prop; per the brief, Recharts colors were kept as hex literals instead of CSS-variable token references.
3. `Dashboard.tsx` — `style={{ width: `${pct}%` }}` on the top-categories progress bar fill, which is a data-driven percentage and must stay inline.

No leftover `from ".../styles/tokens"` imports of `t` remain (only the unrelated `tile` helper is still imported where used). Verified via:
```
Select-String -Path "apps/web/src/routes/admin/*.tsx" -Pattern "from [`"'].*styles/tokens|style=\{\{"
Select-String -Path "apps/web/src/routes/admin/*.tsx" -Pattern "\bt\.(bg|canvas|ink|cognac|card|border|muted|green|amber|display|mono|danger|text|adminCanvas)"
```
The second command (looking for any leftover `t.xxx` token property access) returned zero matches.

## Recharts colors
Kept as hex literals per the brief: `#A94D28` (cognac), `#E2C6A9` (bar fill secondary), `#A8A29E` (axis tick fill / muted2), `#1C1917` (tooltip label / ink). `#E9EEF6`/`#3B6DB0` (shipped badge) and other one-off hex badge colors (`#F3EFEA`, `#FBF1E5`) were already non-token colors in the original code and were preserved as Tailwind arbitrary-value classes (`bg-[#E9EEF6]`, `text-[#3B6DB0]`, etc.) rather than converted to token utilities, since they were never tokens to begin with.

## Build / verification
- `pnpm --filter @baxparrow/web build` → **passes** (`tsc && vite build`, 0 errors, build completed in ~7s).
- No linter errors reported for any edited file.
- No behavior changes: all event handlers, state, data fetching, and conditional rendering logic left untouched — only `style`→`className` conversions and the `badge()`/`field`/`label`/`card`/`h` factories switching from style objects to class strings.

## Concerns / follow-ups
- None blocking. The bundle-size warning (`784.82 kB` main chunk) printed by Vite is pre-existing and unrelated to this task (no code-splitting was introduced or removed).
- Visual spot-check was not performed in a browser (no dev server was launched in this session); conversions were done value-for-value from the original inline styles, and `tsc`/Tailwind class validity were confirmed via successful build.
