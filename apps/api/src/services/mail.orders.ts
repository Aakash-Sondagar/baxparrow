import { sendMail } from "./mail.service.js";
import { orderConfirmationEmail, passwordResetEmailHtml, welcomeEmailHtml, type OrderMailData } from "./mail.templates.js";

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const msg = welcomeEmailHtml(name);
  await sendMail({ to, ...msg });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const msg = passwordResetEmailHtml(name, resetUrl);
  await sendMail({ to, ...msg });
}

export async function sendOrderConfirmationEmail(order: OrderMailData): Promise<void> {
  const to = (order.email || order.address.email || "").trim();
  if (!to) {
    console.warn("[mail] order confirm skipped — no email on order", order.orderNo);
    return;
  }
  const msg = orderConfirmationEmail(order);
  await sendMail({
    to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
}
