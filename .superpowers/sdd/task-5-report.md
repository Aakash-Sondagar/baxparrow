# Task 5 Report: Convert storefront pages + shared components to Tailwind; remove deprecated `t`

## Status: Complete

## Files converted
- `apps/web/src/components/ProductCard.tsx`
- `apps/web/src/routes/store/Home.tsx`
- `apps/web/src/routes/store/Listing.tsx`
- `apps/web/src/routes/store/Product.tsx`
- `apps/web/src/routes/store/Cart.tsx`
- `apps/web/src/routes/store/Checkout.tsx`
- `apps/web/src/routes/store/Confirm.tsx`
- `apps/web/src/routes/store/Search.tsx`
- `apps/web/src/routes/store/Track.tsx`
- `apps/web/src/routes/admin/AdminLogin.tsx` — checked, already clean from Task 4 (no changes needed)
- `apps/web/src/styles/tokens.ts` — deleted the deprecated `t` export entirely, leaving only `tile()`

All `import { t } from ".../styles/tokens"` statements removed. Every `style={{...}}` block converted to Tailwind `className` utilities using the same conversion map as Task 4 (`bg-card border border-border`, `font-display`/`font-mono`, `text-cognac`/`text-green`/`text-danger`, `bg-ink`/`text-bg`, arbitrary-value utilities like `px-[26px]`/`text-[13.5px]` for non-scale pixel values). Shared style-object factories (`fBtn` in `Listing.tsx`, `field`/`label` in `Checkout.tsx`) were converted to className-string factories.

## Remaining `style={{...}}` usages (expected/unavoidable, all data-driven — not tokens)
1. `tile(i)`/`tile(index)` placeholder backgrounds in `Home.tsx`, `Product.tsx`, `Cart.tsx`, `Checkout.tsx`, `ProductCard.tsx` — explicitly allowed per brief.
2. Per-item dynamic hex colors: colour-swatch `background: c` in `Product.tsx` (array of hex strings, can't be a static Tailwind class).
Static gradients (hero banner) and fixed asymmetric grid templates (e.g. `1fr 360px`) were converted to Tailwind arbitrary-value utilities (`bg-[linear-gradient(...)]`, `grid-cols-[1fr_360px]`) rather than left as inline styles, since they're static values.

## Verification
- `rg "from ['\"].*styles/tokens['\"]"` in `apps/web/src` → only `tile` imports remain (7 files: 7 store/admin files needing placeholders).
- `rg "\bt\.(bg|canvas|ink|cognac|...)\b"` across `apps/web/src` → zero matches (no leftover token property access).
- `pnpm --filter @baxparrow/web build` → **passes** (`tsc && vite build`, 0 errors).
- No linter errors on any edited file.
- `tokens.ts` now exports only `tile()`.

## Concerns
- Visual spot-check not performed in a browser (no dev server session); conversions were done value-for-value from original inline styles.
- Pre-existing bundle-size warning (~781 kB main chunk) unrelated to this task.

Report path: `.superpowers/sdd/task-5-report.md`
