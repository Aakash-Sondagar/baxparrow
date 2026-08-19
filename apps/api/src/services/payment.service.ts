import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

const rzp = env.razorpay.keyId
  ? new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret })
  : null;

export class PaymentError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "PaymentError";
    this.status = status;
  }
}

export async function createRzpOrder(amountPaise: number, receipt: string) {
  if (amountPaise < 100) {
    throw new PaymentError("Minimum order amount is ₹1", 400);
  }
  if (!rzp) return { id: "order_stub_" + receipt, amount: amountPaise, stub: true };
  try {
    return await rzp.orders.create({ amount: amountPaise, currency: "INR", receipt });
  } catch (err: any) {
    const status = err?.statusCode ?? err?.error?.statusCode;
    if (status === 401 || status === 403) {
      throw new PaymentError("Razorpay authentication failed", 401);
    }
    const msg = err?.error?.description ?? err?.message ?? "Razorpay order creation failed";
    throw new PaymentError(msg, 500);
  }
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  if (!env.razorpay.keySecret) return true; // allow in dev/stub mode
  const expected = crypto.createHmac("sha256", env.razorpay.keySecret)
    .update(orderId + "|" + paymentId).digest("hex");
  return expected === signature;
}
