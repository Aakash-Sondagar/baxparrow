import { sendMail } from "./mail.service.js";
import { orderConfirmationEmail, welcomeEmailHtml, type OrderMailData } from "./mail.templates.js";

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const msg = welcomeEmailHtml(name);
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
    attachments: [
      {
        filename: `Baxsparrow-Invoice-${order.orderNo}.html`,
        content: msg.invoiceHtml,
        contentType: "text/html",
      },
    ],
  });
}
