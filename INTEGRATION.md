# Baxparrow — Integration & Configuration Guide

All third-party keys live in **`apps/api/.env`** (server-side secrets) and **`apps/web/.env`** (only the public, publishable IDs). Never put a *secret* in a `VITE_` variable — those are shipped to the browser.

Copy the templates first:
```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

---

## A · Cloudinary (product images)

Used by the admin **Add product** and image uploads. Flow: the browser asks our API for a **signature** (`POST /admin/uploads/sign`), then uploads the file **directly to Cloudinary** — the image bytes never pass through our server.

### Steps
1. Create a free account at **https://cloudinary.com** → open the **Dashboard**.
2. Copy three values from "Product Environment Credentials":
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. (Optional) Under **Settings → Upload**, create a folder e.g. `baxparrow`.

### `apps/api/.env`
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret
CLOUDINARY_FOLDER=baxparrow
```
No web-side key needed — the cloud name is returned by the sign endpoint.

> Until these are set, the sign endpoint returns *"Cloudinary not configured"* and the image dropzone shows an upload error, but you can still save products with no images.

---

## B · Razorpay (payments)

Server creates the order (`POST /orders` → Razorpay Order) and **verifies the signature** on callback (`POST /payments/verify`). The browser opens **Razorpay Checkout** with the publishable Key ID.

### Steps
1. Sign up at **https://razorpay.com** and complete KYC (India business).
2. **Settings → API Keys → Generate Key** (start in **Test Mode**).
3. You get a **Key ID** (`rzp_test_xxx`, public) and a **Key Secret** (private — server only).
4. Test cards / UPI: use Razorpay's test values (e.g. UPI `success@razorpay`).
5. Go live later by switching to **Live Mode** and regenerating keys.

### `apps/api/.env`
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-secret
```
### `apps/web/.env`
```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

> **Dev/stub mode:** with no keys set, the server returns a stub order id and the frontend completes payment automatically — so the whole checkout → confirmation → tracking flow is demoable without an account. Add real keys to exercise the live gateway.

---

## C · Shiprocket (shipping & tracking)

On successful payment the server creates a Shiprocket shipment and stores the **AWB**; the tracking page reads status from it. Auth uses your Shiprocket account email/password to fetch a token (cached ~9h).

### Steps
1. Create an account at **https://www.shiprocket.in** and add a pickup address.
2. **Settings → API → Configure** → create **API User credentials** (a dedicated email + password, separate from your dashboard login).
3. Use those API-user credentials below.

### `apps/api/.env`
```
SHIPROCKET_EMAIL=api-user@yourdomain.com
SHIPROCKET_PASSWORD=api-user-password
```

> Until set, `createShipment`/`trackAwb` return stubs and the tracking page shows the sample timeline. The `createShipment` payload mapping (weight, dimensions, pickup location) is stubbed in `services/shipping.service.ts` — complete it with your product dimensions and pickup nickname before going live.

---

## D · Google OAuth (optional login)

The web "Continue with Google" button redirects to `/auth/google` on the API. Wire it with **passport-google-oauth20** (backend route not scaffolded — add when needed).

### Steps
1. **Google Cloud Console** → create a project → **APIs & Services → Credentials**.
2. **Create OAuth client ID** → *Web application*.
3. Authorized redirect URI: `http://localhost:4000/api/v1/auth/google/callback` (and your prod URL).
4. Copy **Client ID** and **Client Secret**.

### `apps/api/.env`
```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

---

## Deploy notes
- **MongoDB Atlas M0:** create a cluster, add a database user, allowlist `0.0.0.0/0` (or Render's IPs), copy the SRV string into `MONGODB_URI`.
- **Render (API):** root dir `apps/api`, build `pnpm install && pnpm --filter @baxparrow/api build`, start `node dist/index.js`. Add all `apps/api/.env` vars in the dashboard. Set `CLIENT_URL` to your Vercel URL.
- **Vercel (web):** root dir `apps/web`, framework Vite. Add `VITE_API_URL` (`https://your-api.onrender.com/api/v1`) and `VITE_RAZORPAY_KEY_ID`.
- After first deploy, run the seed once against Atlas: `MONGODB_URI="<atlas>" pnpm --filter @baxparrow/api seed`.

## What's wired to the API now
| Screen | Endpoint |
|---|---|
| Home / Listing / Search | `GET /products` |
| Product detail | `GET /products/:slug` |
| Checkout → pay | `POST /orders` → Razorpay → `POST /payments/verify` |
| Order tracking | `GET /orders/:no/track` |
| Admin login | `POST /auth/login` (role guard) |
| Admin dashboard | `GET /admin/metrics`, `GET /admin/orders` |
| Admin products | `GET /products`, `POST /admin/products` |
| Admin add-product images | `POST /admin/uploads/sign` → Cloudinary |
| Admin bulk upload | `POST /admin/products/bulk` |
| Admin orders | `GET /admin/orders`, `PATCH /admin/orders/:no/status` |
