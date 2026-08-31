import { env } from "../config/env.js";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** ASCII-safe money — YOPmail/old clients mangled UTF-8 ₹ into â‚¹ */
function inr(n: number): string {
  return "Rs " + Number(n || 0).toLocaleString("en-IN");
}

const brand = {
  cognac: "#A94D28",
  ink: "#1A1612",
  tan: "#E8D5C0",
  muted: "#6B635A",
  border: "#E8E0D6",
  card: "#FAF7F2",
  bg: "#F3EEE6",
};

function siteUrl(): string {
  return (env.mail.siteUrl || env.clientUrl).replace(/\/+$/, "");
}

function shell(title: string, body: string): string {
  const site = siteUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:Arial,Helvetica,sans-serif;color:${brand.ink}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${brand.border};border-radius:14px;overflow:hidden">
        <tr><td style="background:${brand.ink};padding:20px 24px">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${brand.tan}">Baxsparrow</div>
          <div style="font-size:12px;color:#A89B8C;margin-top:4px">${esc(title)}</div>
        </td></tr>
        <tr><td style="padding:24px">${body}</td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid ${brand.border};font-size:12px;color:${brand.muted}">
          Baxsparrow · Byculla, Mumbai<br/>
          <a href="${esc(site)}" style="color:${brand.cognac}">${esc(site.replace(/^https?:\/\//, ""))}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function welcomeEmailHtml(name: string): { subject: string; html: string; text: string } {
  const first = (name || "there").trim().split(/\s+/)[0] || "there";
  const site = siteUrl();
  const shop = `${site}/shop`;
  const account = `${site}/account`;
  const html = shell(
    "Welcome",
    `<p style="margin:0 0 10px;font-size:22px;font-weight:700;line-height:1.3">Welcome, ${esc(first)}.</p>
     <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${brand.muted}">
       Your Baxsparrow account is ready. Track orders, save your details, and shop bags from Mumbai.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0"><tr>
       <td style="background:${brand.cognac};border-radius:10px">
         <a href="${esc(shop)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">Shop bags</a>
       </td>
       <td style="padding-left:14px">
         <a href="${esc(account)}" style="color:${brand.cognac};font-weight:700;font-size:14px;text-decoration:none">My orders</a>
       </td>
     </tr></table>`
  );
  return {
    subject: "Welcome to Baxsparrow",
    html,
    text: `Welcome, ${first}. Your Baxsparrow account is ready. Shop: ${shop} · Orders: ${account}`,
  };
}

export function passwordResetEmailHtml(name: string, resetUrl: string): { subject: string; html: string; text: string } {
  const first = (name || "there").trim().split(/\s+/)[0] || "there";
  const url = esc(resetUrl);
  const html = shell(
    "Reset your password",
    `<p style="margin:0 0 10px;font-size:22px;font-weight:700;line-height:1.3">Password reset</p>
     <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${brand.muted}">
       Hi ${esc(first)}, we received a request to reset your Baxsparrow password. This link expires in 1 hour and can be used once. If you didn't ask for this, you can safely ignore this email.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0"><tr>
       <td style="background:${brand.cognac};border-radius:10px">
         <a href="${url}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">Reset password</a>
       </td>
     </tr></table>
     <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:${brand.muted};word-break:break-all">
       Or copy this link into your browser:<br/>${url}
     </p>`
  );
  return {
    subject: "Reset your Baxsparrow password",
    html,
    text: `Reset your Baxsparrow password (expires in 1 hour): ${resetUrl}`,
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

function kvRow(label: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  return `<tr>
    <td width="92" valign="top" style="padding:7px 12px 7px 0;font-size:12px;color:${brand.muted};white-space:nowrap">${esc(label)}</td>
    <td valign="top" style="padding:7px 0;font-size:13px;color:${brand.ink};line-height:1.45">${esc(v)}</td>
  </tr>`;
}

function looksEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function deliverTable(order: OrderMailData): string {
  const a = order.address;
  const email = (a.email || order.email || "").trim();
  const street = (a.address || "").trim();
  const who = [a.firstName, a.lastName].filter(Boolean).join(" ").trim() || order.name;
  const skipStreet = looksEmail(street) && street.toLowerCase() === email.toLowerCase();
  const rows = [
    kvRow("Name", who),
    kvRow("Address", skipStreet ? "" : street),
    kvRow("City", a.city || ""),
    kvRow("PIN", a.pin || ""),
    kvRow("Mobile", a.phone || ""),
    kvRow("Email", email),
  ]
    .filter(Boolean)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function lineRows(items: OrderMailItem[]): string {
  return items
    .map((i) => {
      const meta = [i.color, i.size, `Qty ${Number(i.qty || 1)}`].filter(Boolean).join(" · ");
      const price = Number(i.price || 0) * Number(i.qty || 1);
      return `<tr>
        <td valign="top" style="padding:12px 16px 12px 0;border-bottom:1px solid ${brand.border}">
          <span style="display:block;font-size:14px;font-weight:700;color:${brand.ink}">${esc(i.name || "Item")}</span>
          <span style="display:block;font-size:12px;color:${brand.muted};padding-top:3px">${esc(meta)}</span>
        </td>
        <td valign="top" align="right" style="padding:12px 0;border-bottom:1px solid ${brand.border};font-size:14px;white-space:nowrap">${inr(price)}</td>
      </tr>`;
    })
    .join("");
}

function totalsBlock(a: OrderMailData["amounts"]): string {
  const rows: [string, string, boolean?][] = [
    ["MRP", inr(a.mrp ?? 0)],
    ["Discount", a.discount ? `- ${inr(a.discount)}` : "-"],
    ["Selling price", inr(a.subtotal ?? 0)],
    ["GST (18% incl.)", inr(a.gst ?? 0)],
    ["Shipping", (a.shipping ?? 0) === 0 ? "FREE" : inr(a.shipping ?? 0)],
  ];
  return (
    rows
      .map(
        ([k, v]) =>
          `<tr>
            <td style="padding:5px 16px 5px 0;font-size:13px;color:${brand.muted}">${esc(k)}</td>
            <td align="right" style="padding:5px 0;font-size:13px;white-space:nowrap">${v}</td>
          </tr>`
      )
      .join("") +
    `<tr>
      <td style="padding:12px 16px 0 0;font-size:16px;font-weight:800;border-top:1px solid ${brand.border}">Total</td>
      <td align="right" style="padding:12px 0 0;font-size:16px;font-weight:800;white-space:nowrap;border-top:1px solid ${brand.border}">${inr(a.total ?? 0)}</td>
    </tr>`
  );
}

export function orderConfirmationEmail(order: OrderMailData): {
  subject: string;
  html: string;
  text: string;
} {
  const site = siteUrl();
  const track = `${site}/order/${encodeURIComponent(order.orderNo)}/track`;
  const first =
    order.address.firstName ||
    (order.name || "there").trim().split(/\s+/)[0] ||
    "there";
  const when = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN")
    : new Date().toLocaleString("en-IN");

  const html = shell(
    "Order confirmation",
    `<p style="margin:0 0 6px;font-size:22px;font-weight:700;line-height:1.25">Payment confirmed</p>
     <p style="margin:0 0 18px;font-size:14px;color:${brand.muted};line-height:1.5">Hi ${esc(first)}, thanks for your order.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px">
       <tr>
         <td valign="top" style="padding:10px 12px 10px 0;border-top:1px solid ${brand.border};border-bottom:1px solid ${brand.border}">
           <span style="display:block;font-size:11px;color:${brand.muted};letter-spacing:0.04em">ORDER</span>
           <span style="display:block;font-size:14px;font-weight:700;color:${brand.cognac};padding-top:3px">${esc(order.orderNo)}</span>
         </td>
         <td valign="top" align="right" style="padding:10px 0;border-top:1px solid ${brand.border};border-bottom:1px solid ${brand.border}">
           <span style="display:block;font-size:11px;color:${brand.muted};letter-spacing:0.04em">TOTAL</span>
           <span style="display:block;font-size:14px;font-weight:700;padding-top:3px">${inr(order.amounts.total ?? 0)}</span>
         </td>
       </tr>
       <tr>
         <td colspan="2" style="padding:8px 0 0;font-size:12px;color:${brand.muted}">${esc(when)}${order.paymentId ? ` &nbsp;·&nbsp; ${esc(order.paymentId)}` : ""}</td>
       </tr>
     </table>
     <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;color:${brand.muted}">DELIVER TO</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${brand.card};border-radius:10px">
       <tr><td style="padding:12px 14px">${deliverTable(order)}</td></tr>
     </table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineRows(order.items)}</table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px">${totalsBlock(order.amounts)}</table>
     <p style="margin:0 0 18px;font-size:12px;color:${brand.muted}">GST included in selling price where applicable.</p>
     <table role="presentation" cellpadding="0" cellspacing="0"><tr>
       <td style="background:${brand.cognac};border-radius:10px">
         <a href="${esc(track)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">Track order</a>
       </td>
     </tr></table>`
  );
  return {
    subject: `Order confirmed · ${order.orderNo}`,
    html,
    text: `Order ${order.orderNo} confirmed. Total ${inr(order.amounts.total ?? 0)}. Track: ${track}`,
  };
}
