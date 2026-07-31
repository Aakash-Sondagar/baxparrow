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
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/v1", routes);
app.use(errorHandler);
connectDB().then(() =>
  app.listen(env.port, "0.0.0.0", () => console.log("[api] :" + env.port))
);
