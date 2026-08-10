import { api } from "../../lib/api";
import type { CartItem } from "../cart/CartContext";

function cartHeaders() {
  const k = localStorage.getItem("bx_cart_key");
  return k ? { "X-Cart-Key": k } : {};
}

export async function createOrder(address: any, items: CartItem[]) {
  const payload = {
    address,
    items: items.map((i) => ({
      product: i.id,
      qty: i.qty,
      ...(i.color ? { color: i.color } : {}),
      ...(i.size ? { size: i.size } : {}),
    })),
  };
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

export async function myOrders() {
  return (await api.get("/me/orders")).data as Array<{
    _id: string;
    orderNo: string;
    status: string;
    amounts: { total: number };
    createdAt: string;
    items: Array<{ name?: string; qty?: number; color?: string }>;
    payment?: { status?: string };
  }>;
}
