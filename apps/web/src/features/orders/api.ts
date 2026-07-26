import { api } from "../../lib/api";
import type { CartItem } from "../cart/CartContext";

function cartHeaders() {
  const k = localStorage.getItem("bx_cart_key");
  return k ? { "X-Cart-Key": k } : {};
}

export async function createOrder(address: any, items: CartItem[]) {
  const payload = { address, items: items.map((i) => ({ product: i.id, qty: i.qty })) };
  return (
    await api.post("/orders", payload, { headers: cartHeaders() })
  ).data as { orderNo: string; razorpayOrderId: string; amount: number };
}

export async function verifyPayment(body: any) {
  return (await api.post("/payments/verify", body, { headers: cartHeaders() })).data;
}

export async function trackOrder(no: string) {
  return (await api.get(`/orders/${no}/track`)).data;
}
