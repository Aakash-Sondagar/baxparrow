# Task 3 Report: StoreLayout Tailwind migration

**Status:** DONE  
**Date:** 2026-07-26  
**Commits:** none (per user instruction)

## What was implemented

### Step 1 — Rewrite `StoreLayout.tsx`
Replaced inline-style layout with Tailwind token utilities per brief:

- **Promo bar:** `bg-cognac`, centered text, preserved copy and `#FBEEE4` text color.
- **Header:** sticky with `bg-bg/92 backdrop-blur-[8px]`, logo, nav links (`text-text2 hover:text-cognac`), search button, cart badge.
- **Auth gate:** imported `useAuth`; Bell icon placeholder renders only when `user` is logged in (Task 9 slot).
- **Main:** `animate-bxfade` utility (defined in `global.css` from Task 1).
- **Footer:** four-column grid, ink background, footer links, copyright bar.
- **Removed** `import { t } from "../styles/tokens"` — zero inline `style` props remain.

Unicode preserved from original (middle dots ·, rupee ₹, ellipsis …, em dash —).

## Files changed

| File | Change |
|------|--------|
| `apps/web/src/components/StoreLayout.tsx` | Full rewrite: Tailwind layout, `useAuth` + Bell placeholder |

## What was tested

1. **TypeScript + production build:** `pnpm run build` in `apps/web`
   - `tsc` passed
   - Vite build succeeded (CSS bundle ~19.02 kB)

2. **Linter:** no diagnostics on `StoreLayout.tsx`

3. **Grep verification:** no `t.` import or `style={` in StoreLayout

4. **Visual spot-check:** NOT performed — no browser session available. Requires visit to `/` to confirm header, promo bar, footer match prior look.

## Self-review

- Brief constraints satisfied: Tailwind tokens only, Bell placeholder when logged in, no commit.
- Footer columns typed `as const` (replaces prior `any` cast).
- Buttons given explicit `type="button"` (brief pattern; improves a11y).
- Heart button unchanged (no handler in original).
- Nav links still route to `/shop` as before.

## Concerns

1. **Visual QA pending:** Build/typecheck only; promo bar, sticky header blur, cart badge, and footer colors should be spot-checked in browser.

2. **Bell visibility:** Only appears for authenticated users — correct per Task 9 prep, but may look different from old layout (which had no bell at all).

3. **Responsive layout:** Brief uses fixed desktop grid; no mobile breakpoints added (matches prior inline layout).

## Next steps (out of scope)

- Task 9: Replace Bell placeholder with `<NotificationBell />`.
- Manual visual QA at `/` per brief Step 2.
