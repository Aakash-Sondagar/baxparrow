# Task 1: Tailwind v4 + design tokens

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/styles/tokens.ts`

**Interfaces:**
- Produces: Tailwind utilities `bg-canvas`, `bg-admin-canvas`, `bg-bg`, `bg-ink`, `text-ink`, `bg-cognac`, `text-cognac`, `bg-cognac-dark`, `bg-tan`, `bg-card`, `border-border`, `bg-subtle`, `text-text`, `text-text2`, `text-text3`, `text-muted`, `text-muted2`, `text-green`, `bg-green-bg`, `text-amber`, `text-danger`, `font-display`, `font-body`, `font-mono`; `tile(n)` still exported from `tokens.ts`

- [ ] **Step 1: Install Tailwind packages in `apps/web`**

Run from repo root:

```bash
pnpm --filter @baxparrow/web add -D tailwindcss @tailwindcss/vite
```

Expected: packages appear in `apps/web/package.json` `devDependencies`.

- [ ] **Step 2: Register Vite plugin**

Replace `apps/web/vite.config.ts` with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@baxparrow/shared": fileURLToPath(new URL("../../packages/shared/src", import.meta.url)),
    },
  },
  server: { port: 5173 },
});
```

- [ ] **Step 3: Rewrite `global.css` with tokens + `@theme`**

Replace `apps/web/src/styles/global.css` with the full CSS from the plan (see plan Task 1 Step 3) — `:root` CSS variables for all brand colors/fonts, `@theme` mapping, `@layer base` resets, `bxfade` keyframes, `@utility animate-bxfade`.

- [ ] **Step 4: Slim `tokens.ts` — keep `tile()` AND temporary deprecated `t` object**

Keep `tile(n)` as specified. Also keep temporary compatibility export during migration:

```ts
/** @deprecated Remove after Tailwind migration completes */
export const t = {
  bg: "var(--color-bg)",
  canvas: "var(--color-canvas)",
  adminCanvas: "var(--color-admin-canvas)",
  ink: "var(--color-ink)",
  cognac: "var(--color-cognac)",
  cognacDark: "var(--color-cognac-dark)",
  tan: "var(--color-tan)",
  card: "var(--color-card)",
  border: "var(--color-border)",
  subtle: "var(--color-subtle)",
  text: "var(--color-text)",
  text2: "var(--color-text2)",
  text3: "var(--color-text3)",
  muted: "var(--color-muted)",
  muted2: "var(--color-muted2)",
  green: "var(--color-green)",
  greenBg: "var(--color-green-bg)",
  amber: "var(--color-amber)",
  danger: "var(--color-danger)",
  displayFont: "var(--font-display)",
  bodyFont: "var(--font-body)",
  monoFont: "var(--font-mono)",
};
```

- [ ] **Step 5: Smoke-check Vite starts**

Run: `pnpm --filter @baxparrow/web dev`  
Expected: server on `:5173` without Tailwind/Vite plugin errors. Stop after confirm.

- [ ] **Step 6: SKIP COMMIT** — no git repo / user forbids commits unless asked. Do not run git commit.
