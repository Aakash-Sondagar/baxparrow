import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
const rzp = env.razorpay.keyId
  ? new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret })
  : null;
export async function createRzpOrder(amountPaise: number, receipt: string) {
  if (!rzp) return { id: "order_stub_" + receipt, amount: amountPaise, stub: true };
  return rzp.orders.create({ amount: amountPaise, currency: "INR", receipt });
}
export function verifySignature(orderId: string, paymentId: string, signature: string) {
  if (!env.razorpay.keySecret) return true; // allow in dev/stub mode
  const expected = crypto.createHmac("sha256", env.razorpay.keySecret)
    .update(orderId + "|" + paymentId).digest("hex");
  return expected === signature;
}
