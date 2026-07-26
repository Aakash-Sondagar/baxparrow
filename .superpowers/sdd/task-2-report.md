# Task 2 Report: AdminLayout Tailwind + working sidebar toggle

**Status:** DONE  
**Date:** 2026-07-26  
**Commits:** none (per user instruction)

## What was implemented

### Step 1 — Rewrite `AdminLayout.tsx`
Replaced the inline-style layout with the brief's Tailwind implementation:

- **Single `sidebarOpen` state** persisted to `localStorage` under key `bx_admin_sidebar` (`"1"` / `"0"`).
- **Desktop (≥1024px):** sidebar wrapper uses `hidden lg:block` and toggles `lg:hidden` when closed — full hide/show, not an icon rail.
- **Mobile (<1024px):** fixed drawer (`translate-x`) + dim overlay; close via X button, overlay click, or nav link click.
- **Media-query sync:** on mount and when crossing below `lg`, sidebar auto-closes on mobile.
- **Header:** hamburger toggles `sidebarOpen` on all breakpoints; `aria-expanded` / `aria-label` on toggle button.
- **NotificationBell slot:** Bell icon placeholder button (no cognac dot); Task 9 replaces with `<NotificationBell />`.
- **Removed** `import { t } from "../../styles/tokens"` — layout now uses Tailwind token utilities from Task 1 (`bg-ink`, `bg-admin-canvas`, `font-display`, `text-bg`, etc.).

### Tailwind adjustments (per plan note)
Default theme lacks `z-90` / `z-100`; used arbitrary values:
- `z-[90]` (overlay)
- `z-[100]` (drawer)
- `py-[22px]` / `mb-[22px]` instead of `py-5.5` / `mb-5.5` (matches prior 22px inline padding)

All other classes match the brief.

## Files changed

| File | Change |
|------|--------|
| `apps/web/src/routes/admin/AdminLayout.tsx` | Full rewrite: Tailwind layout, unified sidebar toggle, localStorage persistence |

## What was tested

1. **TypeScript + production build:** `npm run build` in `apps/web`
   - `tsc` passed
   - Vite build succeeded (CSS bundle ~15.36 kB, includes scanned Tailwind utilities)

2. **Linter:** no diagnostics on `AdminLayout.tsx`

3. **Manual toggle verification:** NOT performed — no browser session available in this environment. Requires logged-in visit to `/admin/dashboard` to confirm:
   - Desktop hamburger fully hides/shows sidebar; refresh preserves preference
   - Mobile drawer + overlay; X / overlay / nav link close drawer
   - No duplicate ghost sidebar

## Self-review

- Brief constraints satisfied: single sidebar, `bx_admin_sidebar` key, desktop full hide/show, Bell placeholder, no commit.
- Old dual-sidebar bug fixed: previously desktop sidebar was always visible alongside mobile drawer; now desktop and mobile paths are mutually exclusive via responsive classes.
- Mobile close button now visible (`lg:hidden` on X button vs old `display: none` + unused `.mobile-close` CSS class).
- `NAV` typed `as const`; nav icons and labels unchanged.
- Logout flow unchanged (`handleLogout` → `logout()` → navigate `/admin`).
- Hamburger works on desktop and mobile (same state), matching brief.

## Concerns

1. **Visual QA pending:** Build/typecheck only; toggle behavior, animation, and token colors should be spot-checked in browser at desktop and mobile widths.

2. **Resize behavior:** Crossing below `lg` forces `sidebarOpen` to `false` (per brief). Resizing back to desktop restores state from localStorage on next full page load, but not automatically on resize — acceptable per spec.

3. **Duplicate sidebar DOM:** Desktop and mobile each render the same `sidebar` JSX node tree (two instances in DOM). Only one is visible at a time; brief pattern, not a functional bug.

4. **Bell placeholder simplified:** Removed the cognac notification dot from the old inline layout; Task 9 will wire real bell UI.

## Next steps (out of scope)

- Task 9: Replace Bell placeholder with `<NotificationBell />`.
- Manual QA checklist from brief (desktop toggle + mobile drawer).
