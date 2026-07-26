# Task 1 Report: Tailwind v4 + design tokens

**Status:** DONE  
**Date:** 2026-07-26  
**Commits:** none (per user instruction)

## What was implemented

### Step 1 — Install Tailwind packages
- Ran `pnpm --filter @baxparrow/web add -D tailwindcss @tailwindcss/vite` from repo root.
- Added to `apps/web/package.json` devDependencies:
  - `tailwindcss`: `^4.3.3`
  - `@tailwindcss/vite`: `^4.3.3`

### Step 2 — Register Vite plugin
- Replaced `apps/web/vite.config.ts` with plan-specified config importing `@tailwindcss/vite` and registering `tailwindcss()` alongside `react()`.

### Step 3 — Rewrite `global.css`
- Replaced `apps/web/src/styles/global.css` with full plan content:
  - `@import "tailwindcss"`
  - `:root` CSS variables for all brand colors and fonts
  - `@theme` block mapping tokens to Tailwind theme (colors + font families)
  - `@layer base` resets (box-sizing, body typography, link colors, form inherit)
  - `bxfade` keyframes + `@utility animate-bxfade`

### Step 4 — Slim `tokens.ts`
- Kept `tile(n)` helper unchanged (product placeholder gradients).
- Added deprecated temporary `t` export mapping to CSS variable references (`var(--color-*)`, `var(--font-*)`) so existing inline-style imports continue working during migration.

## Files changed

| File | Change |
|------|--------|
| `apps/web/package.json` | Added `tailwindcss`, `@tailwindcss/vite` devDependencies |
| `pnpm-lock.yaml` | Lockfile updated by pnpm install |
| `apps/web/vite.config.ts` | Registered Tailwind Vite plugin |
| `apps/web/src/styles/global.css` | Full rewrite with tokens + `@theme` + base layer |
| `apps/web/src/styles/tokens.ts` | Slimmed to `tile()` + deprecated `t` compat export |

## What was tested

1. **Dev smoke-check (required):** `pnpm --filter @baxparrow/web dev`
   - Vite v5.4.21 ready in ~3.7s
   - Server on `http://localhost:5173/` with no Tailwind/Vite plugin errors
   - Server stopped after confirmation

2. **Production build (extra verification):** `pnpm --filter @baxparrow/web build`
   - `tsc` passed
   - Vite build succeeded; CSS bundle emitted (`index-sIc6z7WN.css`, 10.69 kB)

## Self-review

- All four specified files modified per brief; Step 6 (commit) skipped as instructed.
- `global.css` is already imported in `apps/web/src/main.tsx` — no entry-point change needed.
- Temporary `t` export preserves backward compatibility for components still using inline styles with `t.cognac`, `t.bg`, etc.; values now resolve via CSS vars defined in `:root`.
- `@theme` color keys match expected Tailwind utilities (`bg-canvas`, `text-ink`, `border-border`, etc.).
- Font theme keys use `--font-family-display/body/mono` pattern per plan, producing `font-display`, `font-body`, `font-mono` utilities.
- No linter errors on modified TypeScript files.

## Concerns

1. **Migration still pending:** Components still use inline `style={{ ... t.* }}` — visual parity depends on CSS vars being loaded (they are via `global.css`). Font tokens changed from quoted family strings to `var(--font-display)` etc.; should behave identically once CSS is applied, but worth spot-checking in Task 2+ layout conversions.

2. **Tailwind utilities unused yet:** No component classes migrated in this task; utility availability inferred from `@theme` setup, not manually exercised in JSX.

3. **Chunk size warning:** Production build warns about 787 kB JS chunk — pre-existing, unrelated to this task.

## Next steps (out of scope for Task 1)

- Task 2+: Convert layouts/components from inline `t` usage to Tailwind utility classes.
- Remove deprecated `t` export once migration completes.
