# Baxparrow — E-Commerce Monorepo

React + TypeScript storefront & admin · Node/Express + Mongoose API · MongoDB.
The UI is wired to the API (products, cart, checkout+Razorpay, tracking, admin CRUD, bulk upload, metrics).

## Quick start
```bash
pnpm install
docker compose up -d          # local MongoDB (or use Atlas via MONGODB_URI)
cp .env.example apps/api/.env
cp .env.example apps/web/.env
pnpm --filter @baxparrow/api seed   # sample products + admin user
pnpm dev                      # api :4000 · web :5173
```

- Storefront: http://localhost:5173
- Admin: http://localhost:5173/admin  →  **admin@baxparrow.com / admin123**

## Integrations
Cloudinary · Razorpay · Shiprocket · Google OAuth — see **INTEGRATION.md** for step-by-step key setup.
Everything runs in **stub mode** without keys (checkout auto-completes, images/tracking show samples) so you can develop end-to-end before signing up for anything.

## Layout
- `apps/web`  — Vite + React Router + TanStack Query
- `apps/api`  — Express + Mongoose + Zod
- `packages/shared` — Zod schemas + types shared by both
