### Task 5: Convert storefront pages + shared components

**Files:**
- Modify: `apps/web/src/routes/store/Home.tsx`
- Modify: `apps/web/src/routes/store/Listing.tsx`
- Modify: `apps/web/src/routes/store/Product.tsx`
- Modify: `apps/web/src/routes/store/Cart.tsx`
- Modify: `apps/web/src/routes/store/Checkout.tsx`
- Modify: `apps/web/src/routes/store/Confirm.tsx`
- Modify: `apps/web/src/routes/store/Search.tsx`
- Modify: `apps/web/src/routes/store/Track.tsx`
- Modify: `apps/web/src/components/ProductCard.tsx`
- Modify: `apps/web/src/routes/admin/AdminLogin.tsx` if missed
- Modify: `apps/web/src/styles/tokens.ts` â€” remove deprecated `t` when unused

**Interfaces:**
- Consumes: `tile()` from `tokens.ts` for placeholders only

- [ ] **Step 1: Convert `ProductCard.tsx` and `Home.tsx`**

Use `tile(n)` via `style={{ backgroundImage: tile(i) }}` only for the gradient placeholder (allowed exception). All other styling via Tailwind.

- [ ] **Step 2: Convert remaining store routes**

Same conversion map as Task 4.

- [ ] **Step 3: Remove deprecated `t` from `tokens.ts`**

Confirm zero imports:

```bash
rg "\bt\b.*tokens|from [\"'].*tokens[\"']" apps/web/src -n
```

Expected: only `tile` imports. Then delete the deprecated `t` object from `tokens.ts`, leaving only `tile`.

- [ ] **Step 4: Build web**

Run: `pnpm --filter @baxparrow/web build`  
Expected: `tsc && vite build` succeeds.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add apps/web/src
git commit -m "refactor(web): finish Tailwind migration for storefront"
```

---


## Extra
- DO NOT commit.
- After conversion, remove deprecated t from tokens.ts leaving only tile().
- Build must pass.

