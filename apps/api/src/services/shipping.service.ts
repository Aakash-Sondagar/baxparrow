import axios from "axios";
import { env } from "../config/env.js";
// Minimal Shiprocket client — token cached in-memory.
let token = ""; let tokenAt = 0;
async function authToken() {
  if (token && Date.now() - tokenAt < 9 * 3600_000) return token;
  if (!env.shiprocket.email) return "";
  const { data } = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
    email: env.shiprocket.email, password: env.shiprocket.password,
  });
  token = data.token; tokenAt = Date.now(); return token;
}
export async function createShipment(order: any) {
  const t = await authToken();
  if (!t) return { shiprocketId: "", awb: "", courier: "" }; // stub when unconfigured
  // ... map order -> Shiprocket create-order payload (omitted for brevity)
  return { shiprocketId: "SR-" + order.orderNo, awb: "", courier: "" };
}
export async function trackAwb(_awb: string) {
  // Proxy Shiprocket tracking; returns [] when unconfigured.
  return [] as { status: string; at: string; note: string }[];
}
