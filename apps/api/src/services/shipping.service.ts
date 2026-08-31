import axios from "axios";
import { env } from "../config/env.js";

const BASE = "https://apiv2.shiprocket.in/v1/external";

let token = "";
let tokenAt = 0;
let inflight: Promise<string> | null = null;

type Shipment = { shiprocketId: string; awb: string; courier: string };
type TrackEvent = { status: string; at: string; note: string };

function digits(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}

async function authToken() {
  if (token && Date.now() - tokenAt < 9 * 3600_000) return token;
  if (!env.shiprocket.email || !env.shiprocket.password) return "";
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await axios.post(`${BASE}/auth/login`, {
        email: env.shiprocket.email,
        password: env.shiprocket.password,
      });
      token = data.token;
      tokenAt = Date.now();
      return token;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

async function sr<T>(method: "get" | "post", path: string, body?: unknown) {
  const t = await authToken();
  if (!t) throw new Error("Shiprocket not configured");
  const { data } = await axios.request<T>({
    method,
    url: `${BASE}${path}`,
    data: body,
    headers: { Authorization: `Bearer ${t}` },
    timeout: 20_000,
  });
  return data;
}

async function stateFromPin(pin: string, fallbackCity: string) {
  try {
    const data = await sr<{ postcode_details?: { state?: string; city?: string } }>(
      "get",
      `/open/postcode/details?postcode=${encodeURIComponent(pin)}`
    );
    return data.postcode_details?.state || fallbackCity;
  } catch {
    return fallbackCity;
  }
}

function ymdHis(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function itemSku(orderNo: string, color: unknown, index: number) {
  const base = color
    ? `${orderNo}-${color}`
    : `${orderNo}-ITEM-${index + 1}`;
  return String(base).replace(/[^A-Z0-9_-]/gi, "").slice(0, 50) || `${orderNo}-ITEM-${index + 1}`;
}

export async function createShipment(order: any): Promise<Shipment> {
  const empty: Shipment = { shiprocketId: "", awb: "", courier: "" };
  if (!env.shiprocket.email) return empty;
  try {
    const addr = (order.address ?? {}) as Record<string, string>;
    const pin = String(addr.pin ?? "").trim();
    const city = String(addr.city ?? "").trim();
    const state = await stateFromPin(pin, city);
    const items = (order.items ?? []).map((i: any, idx: number) => ({
      name: String(i.name ?? "Item").slice(0, 200),
      sku: itemSku(String(order.orderNo), i.color, idx),
      units: Math.max(1, Number(i.qty) || 1),
      selling_price: String(i.price ?? 0),
    }));
    const qty = items.reduce((a: number, i: { units: number }) => a + i.units, 0) || 1;
    const weight = Math.max(0.5, Number(env.shiprocket.weightKg) * qty);

    const created = await sr<any>("post", "/orders/create/adhoc", {
      order_id: String(order.orderNo),
      order_date: ymdHis(order.createdAt ? new Date(order.createdAt) : new Date()),
      pickup_location: env.shiprocket.pickup,
      billing_customer_name: String(addr.firstName ?? "Customer"),
      billing_last_name: String(addr.lastName ?? ""),
      billing_address: String(addr.address ?? "").slice(0, 190),
      billing_address_2: "",
      billing_city: city,
      billing_pincode: pin,
      billing_state: state,
      billing_country: "India",
      billing_email: String(addr.email ?? ""),
      billing_phone: digits(String(addr.phone ?? "")),
      shipping_is_billing: true,
      order_items: items.length ? items : [{ name: "Order", sku: itemSku(String(order.orderNo), "", 0), units: 1, selling_price: String(order.amounts?.total ?? 0) }],
      payment_method: "Prepaid",
      sub_total: Number(order.amounts?.subtotal ?? order.amounts?.total ?? 0),
      length: env.shiprocket.lengthCm,
      breadth: env.shiprocket.breadthCm,
      height: env.shiprocket.heightCm,
      weight,
    });

    const shipmentId = String(created?.shipment_id ?? created?.payload?.shipment_id ?? "");
    const result: Shipment = {
      shiprocketId: shipmentId || String(created?.order_id ?? ""),
      awb: "",
      courier: "",
    };

    if (env.shiprocket.autoAwb && shipmentId) {
      try {
        const awbRes = await sr<any>("post", "/courier/assign/awb", { shipment_id: Number(shipmentId) });
        const data = awbRes?.response?.data ?? awbRes?.response ?? awbRes;
        result.awb = String(data?.awb_code ?? data?.awb ?? "");
        result.courier = String(data?.courier_name ?? data?.courier ?? "");
      } catch (err: any) {
        console.warn("[shiprocket] AWB assign skipped:", err?.response?.data?.message ?? err?.message);
      }
    }

    console.log("[shiprocket] order", order.orderNo, "shipment", result.shiprocketId, "awb", result.awb || "(pending KYC/wallet)");
    return result;
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? JSON.stringify(err?.response?.data ?? err?.message);
    console.error("[shiprocket] create failed", order?.orderNo, msg);
    return empty;
  }
}

export async function createReturnShipment(order: any): Promise<Shipment> {
  const empty: Shipment = { shiprocketId: "", awb: "", courier: "" };
  if (!env.shiprocket.email) return empty;
  try {
    const addr = (order.address ?? {}) as Record<string, string>;
    const pin = String(addr.pin ?? "").trim();
    const city = String(addr.city ?? "").trim();
    const state = await stateFromPin(pin, city);
    const items = (order.items ?? []).map((i: any, idx: number) => ({
      name: String(i.name ?? "Item").slice(0, 200),
      sku: itemSku(String(order.orderNo), i.color, idx),
      units: Math.max(1, Number(i.qty) || 1),
      selling_price: String(i.price ?? 0),
      hsn: "",
    }));
    const qty = items.reduce((a: number, i: { units: number }) => a + i.units, 0) || 1;
    const weight = Math.max(0.5, Number(env.shiprocket.weightKg) * qty);
    const phone = digits(String(addr.phone ?? ""));

    const created = await sr<any>("post", "/orders/create/return", {
      order_id: order.shipment?.shiprocketId || String(order.orderNo),
      order_date: ymdHis(order.createdAt ? new Date(order.createdAt) : new Date()),
      pickup_customer_name: String(addr.firstName ?? "Customer"),
      pickup_last_name: String(addr.lastName ?? ""),
      pickup_address: String(addr.address ?? "").slice(0, 190),
      pickup_address_2: "",
      pickup_city: city,
      pickup_pincode: pin,
      pickup_state: state,
      pickup_country: "India",
      pickup_email: String(addr.email ?? ""),
      pickup_phone: phone,
      shipping_customer_name: String(addr.firstName ?? "Customer"),
      shipping_last_name: String(addr.lastName ?? ""),
      shipping_address: String(addr.address ?? "").slice(0, 190),
      shipping_address_2: "",
      shipping_city: city,
      shipping_pincode: pin,
      shipping_state: state,
      shipping_country: "India",
      shipping_email: String(addr.email ?? ""),
      shipping_phone: phone,
      order_items: items.length ? items : [{ name: "Order", sku: itemSku(String(order.orderNo), "", 0), units: 1, selling_price: String(order.amounts?.total ?? 0), hsn: "" }],
      payment_method: "Prepaid",
      sub_total: Number(order.amounts?.subtotal ?? order.amounts?.total ?? 0),
      length: env.shiprocket.lengthCm,
      breadth: env.shiprocket.breadthCm,
      height: env.shiprocket.heightCm,
      weight,
    });

    const shipmentId = String(created?.shipment_id ?? created?.payload?.shipment_id ?? created?.order_id ?? "");
    console.log("[shiprocket] return order", order.orderNo, "shipment", shipmentId || "(pending)");
    return {
      shiprocketId: shipmentId,
      awb: String(created?.awb_code ?? created?.awb ?? ""),
      courier: String(created?.courier_name ?? created?.courier ?? ""),
    };
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? JSON.stringify(err?.response?.data ?? err?.message);
    console.error("[shiprocket] return create failed", order?.orderNo, msg);
    return empty;
  }
}

export async function trackAwb(awb: string): Promise<TrackEvent[]> {
  if (!awb || !env.shiprocket.email) return [];
  try {
    const data = await sr<any>("get", `/courier/track/awb/${encodeURIComponent(awb)}`);
    const points = data?.tracking_data?.shipment_track ?? data?.shipment_track ?? [];
    if (!Array.isArray(points)) return [];
    return points.map((p: any) => ({
      status: String(p.activity || p.status || "Update"),
      at: String(p.date || p.updated_at || new Date().toISOString()),
      note: [p.location, p["sr-status"]].filter(Boolean).join(" · "),
    }));
  } catch (err: any) {
    console.error("[shiprocket] track failed", awb, err?.response?.data ?? err?.message);
    return [];
  }
}
