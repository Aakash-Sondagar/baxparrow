import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Always load apps/api/.env — pnpm dev from repo root may leave cwd != apps/api
const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: join(apiRoot, ".env") });

const req = (k: string, d?: string) => process.env[k] ?? d ?? "";

/** Browser Origin never has a trailing slash — strip so CORS matches. */
function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

const clientUrl = normalizeOrigin(req("CLIENT_URL", "https://baxparrow-mu.vercel.app"));
/** Optional extra origins: comma-separated (Vercel preview + custom domain). */
const extra = req("CLIENT_URLS")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: req("MONGODB_URI", "mongodb://localhost:27017/baxparrow"),
  jwtAccess: req("JWT_ACCESS_SECRET", "dev-access"),
  jwtRefresh: req("JWT_REFRESH_SECRET", "dev-refresh"),
  clientUrl,
  /** Allowed browser origins for CORS */
  corsOrigins: [...new Set([clientUrl, ...extra, "http://localhost:5173"])],
  razorpay: { keyId: req("RAZORPAY_KEY_ID"), keySecret: req("RAZORPAY_KEY_SECRET") },
  shiprocket: { email: req("SHIPROCKET_EMAIL"), password: req("SHIPROCKET_PASSWORD") },
  cloudinary: {
    cloudName: req("CLOUDINARY_CLOUD_NAME"),
    apiKey: req("CLOUDINARY_API_KEY"),
    apiSecret: req("CLOUDINARY_API_SECRET"),
    folder: req("CLOUDINARY_FOLDER", "baxparrow"),
  },
  resend: {
    apiKey: req("RESEND_API_KEY"),
  },
  brevo: {
    apiKey: req("BREVO_API_KEY"),
  },
  mail: {
    /** "brevo" | "resend" | "" (auto: prefer Brevo if key set) */
    provider: req("MAIL_PROVIDER"),
    /** e.g. Baxsparrow <orders@baxparrow.online> */
    from: req("MAIL_FROM", "Baxsparrow <onboarding@resend.dev>"),
    /** Public site URL used in emails (not CORS). Defaults to CLIENT_URL. */
    siteUrl: normalizeOrigin(req("MAIL_SITE_URL") || clientUrl),
  },
};
