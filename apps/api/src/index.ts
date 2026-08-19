import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { requestLog } from "./middleware/requestLog.js";

const app = express();
app.set("trust proxy", 1);
app.use(requestLog);
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // non-browser / same-origin tools (curl, health) → no Origin header
      if (!origin) return cb(null, true);
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      console.warn("[cors] blocked origin:", origin, "allowed:", env.corsOrigins);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/v1", routes);
app.use(errorHandler);

// Listen first so Railway /health passes; DB connect after (Atlas can be slow)
app.listen(env.port, "0.0.0.0", () => {
  console.log("[api] :" + env.port);
  const mail = env.brevo.apiKey.trim()
    ? "brevo"
    : env.resend.apiKey.trim()
      ? "resend"
      : "off";
  console.log("[mail] provider:", mail, "from:", env.mail.from, "site:", env.mail.siteUrl);
  connectDB().catch((err) => {
    console.error("[db] connect failed:", err?.message ?? err);
    process.exit(1);
  });
});

