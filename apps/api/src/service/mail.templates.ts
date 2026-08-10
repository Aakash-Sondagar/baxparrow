import { env } from "../config/env.js";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(n: number): string {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

const brand = {
  cognac: "#8B4513",
  ink: "#1A1612",
  muted: "#6B635A",
  border: "#E8E0D6",
  card: "#FAF7F2",
};

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#F3EEE6;font-family:Georgia,'Times New Roman',serif;color:${brand.ink}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEE6;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid ${brand.border};border-radius:14px;overflow:hidden">
        <tr><td style="background:${brand.ink};padding:18px 24px">
          <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#E8D5C0">Baxsparrow</div>
          <div style="font-size:12px;color:#A89B8C;margin-top:2px">${esc(title)}</div>
        </td></tr>
        <tr><td style="padding:28px 24px">${body}</td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid ${brand.border};font-size:12px;color:${brand.muted}">
          Baxsparrow · Byculla, Mumbai<br/>
          <a href="${esc(env.clientUrl)}" style="color:${brand.cognac}">${esc(env.clientUrl)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function welcomeEmailHtml(name: string): { subject: string; html: string; text: string } {
  const first = (name || "there").trim().split(/\s+/)[0] || "there";
  const shop = `${env.clientUrl}/shop`;
  const account = `${env.clientUrl}/account`;
  const html = shell(
    "Welcome",
    `<p style="margin:0 0 12px;font-size:22px;font-weight:700">Welcome, ${esc(first)}.</p>
     <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${brand.muted}">
       Your Baxsparrow account is ready. Track orders, save your details, and shop bags from Mumbai.
     </p>
     <p style="margin:0 0 22px">
       <a href="${esc(shop)}" style="display:inline-block;background:${brand.cognac};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px">Shop bags</a>
       &nbsp;
       <a href="${esc(account)}" style="display:inline-block;color:${brand.cognac};font-weight:700;font-size:14px;padding:12px 8px">My orders</a>
     </p>
     <p style="margin:0;font-size:13px;color:${brand.muted}">Questions? Reply to this email or visit our FAQ.</p>`
  );
  return {
    subject: "Welcome to Baxsparrow",
    html,
    text: `Welcome, ${first}. Your Baxsparrow account is ready. Shop: ${shop} · Orders: ${account}`,
  };
}

export type OrderMailItem = {
  name?: string;
  color?: string;
  size?: string;
  qty?: number;
  price?: number;
};

export type OrderMailData = {
  orderNo: string;
  email: string;
  name: string;
  items: OrderMailItem[];
  amounts: {
    subtotal?: number;
    mrp?: number;
    discount?: number;
    discountPct?: number;
    shipping?: number;
    gst?: number;
    total?: number;
  };
  address: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    pin?: string;
    phone?: string;
    email?: string;
  };
  paymentId?: string;
  createdAt?: Date | string;
};

function lineRows(items: OrderMailItem[]): string {
  return items
    .map((i) => {
      const meta = [i.color, i.size].filter(Boolean).join(" · ");
      const qty = Number(i.qty || 1);
      const price = Number(i.price || 0);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${brand.border};font-size:14px">
          <div style="font-weight:600">${esc(i.name || "Item")}</div>
          ${meta ? `<div style="font-size:12px;color:${brand.muted}">${esc(meta)}</div>` : ""}
          <div style="font-size:12px;color:${brand.muted}">Qty ${qty}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${brand.border};text-align:right;font-size:14px;white-space:nowrap">${esc(inr(price * qty))}</td>
      </tr>`;
    })
    .join("");
}

function totalsBlock(a: OrderMailData["amounts"]): string {
  const rows: [string, string][] = [
    ["MRP", inr(a.mrp ?? 0)],
    ["Discount", a.discount ? `−${inr(a.discount)}` : "—"],
    ["Selling price", inr(a.subtotal ?? 0)],
    ["GST (18% incl.)", inr(a.gst ?? 0)],
    ["Shipping", (a.shipping ?? 0) === 0 ? "FREE" : inr(a.shipping ?? 0)],
  ];
  return (
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 0;font-size:13px;color:${brand.muted}">${esc(k)}</td>
           <td style="padding:4px 0;font-size:13px;text-align:right">${esc(v)}</td></tr>`
      )
      .join("") +
    `<tr><td style="padding:12px 0 0;font-size:16px;font-weight:800;border-top:1px solid ${brand.border}">Total</td>
     <td style="padding:12px 0 0;font-size:16px;font-weight:800;text-align:right;border-top:1px solid ${brand.border}">${esc(inr(a.total ?? 0))}</td></tr>`
  );
}

export function buildInvoiceHtml(order: OrderMailData): string {
  const who = [order.address.firstName, order.address.lastName].filter(Boolean).join(" ") || order.name;
  const addr = [
    order.address.address,
    [order.address.city, order.address.pin].filter(Boolean).join(" "),
    order.address.phone ? `Mobile: ${order.address.phone}` : "",
    order.address.email || order.email,
  ]
    .filter(Boolean)
    .join("<br/>");
  const when = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Invoice ${esc(order.orderNo)}</title></head>
<body style="font-family:Georgia,serif;color:${brand.ink};max-width:640px;margin:24px auto;padding:0 16px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
    <div>
      <div style="font-size:22px;font-weight:800">Baxsparrow</div>
      <div style="font-size:12px;color:${brand.muted}">Tax invoice / order receipt</div>
    </div>
    <div style="text-align:right;font-size:13px">
      <div><strong>${esc(order.orderNo)}</strong></div>
      <div style="color:${brand.muted}">${esc(when)}</div>
      ${order.paymentId ? `<div style="color:${brand.muted}">Pay ID: ${esc(order.paymentId)}</div>` : ""}
    </div>
  </div>
  <div style="margin-bottom:20px;padding:14px;background:${brand.card};border-radius:10px;font-size:13px;line-height:1.5">
    <strong>Bill to</strong><br/>${esc(who)}<br/>${addr}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0">${lineRows(order.items)}</table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">${totalsBlock(order.amounts)}</table>
  <p style="margin-top:28px;font-size:12px;color:${brand.muted}">GST included in selling price where applicable. Thank you for shopping with Baxsparrow.</p>
</body></html>`;
}

export function orderConfirmationEmail(order: OrderMailData): {
  subject: string;
  html: string;
  text: string;
  invoiceHtml: string;
} {
  const track = `${env.clientUrl}/order/${encodeURIComponent(order.orderNo)}/track`;
  const first =
    order.address.firstName ||
    (order.name || "there").trim().split(/\s+/)[0] ||
    "there";
  const invoiceHtml = buildInvoiceHtml(order);
  const html = shell(
    "Order confirmation",
    `<p style="margin:0 0 8px;font-size:22px;font-weight:700">Payment confirmed</p>
     <p style="margin:0 0 6px;font-size:14px;color:${brand.muted}">Hi ${esc(first)}, thanks for your order.</p>
     <p style="margin:0 0 18px;font-family:ui-monospace,monospace;font-size:13px;color:${brand.cognac}">${esc(order.orderNo)} · ${esc(inr(order.amounts.total ?? 0))}</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">${lineRows(order.items)}</table>
     <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">${totalsBlock(order.amounts)}</table>
     <p style="margin:0 0 22px">
       <a href="${esc(track)}" style="display:inline-block;background:${brand.cognac};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px">Track order</a>
     </p>
     <p style="margin:0;font-size:13px;color:${brand.muted}">Invoice attached as HTML — open or print it for your records.</p>`
  );
  return {
    subject: `Order confirmed · ${order.orderNo}`,
    html,
    text: `Order ${order.orderNo} confirmed. Total ${inr(order.amounts.total ?? 0)}. Track: ${track}`,
    invoiceHtml,
  };
}
