import "dotenv/config";
const req = (k: string, d?: string) => process.env[k] ?? d ?? "";
export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: req("MONGODB_URI", "mongodb://localhost:27017/baxparrow"),
  jwtAccess: req("JWT_ACCESS_SECRET", "dev-access"),
  jwtRefresh: req("JWT_REFRESH_SECRET", "dev-refresh"),
  clientUrl: req("CLIENT_URL", "https://baxparrow-mu.vercel.app"),
  razorpay: { keyId: req("RAZORPAY_KEY_ID"), keySecret: req("RAZORPAY_KEY_SECRET") },
  shiprocket: { email: req("SHIPROCKET_EMAIL"), password: req("SHIPROCKET_PASSWORD") },
  cloudinary: {
    cloudName: req("CLOUDINARY_CLOUD_NAME"),
    apiKey: req("CLOUDINARY_API_KEY"),
    apiSecret: req("CLOUDINARY_API_SECRET"),
    folder: req("CLOUDINARY_FOLDER", "baxparrow"),
  },
};
