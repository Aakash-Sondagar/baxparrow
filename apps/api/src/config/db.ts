import mongoose from "mongoose";
import { env } from "./env.js";
import { ensureCartIndexes } from "../models/Cart.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("[db] connected");
  await ensureCartIndexes();
}
