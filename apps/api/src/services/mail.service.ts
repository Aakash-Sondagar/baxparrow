import { Resend } from "resend";
import { env } from "../config/env.js";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = env.resend.apiKey.trim();
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key, { baseUrl: "https://api.resend.com" });
  }
  return resendClient;
}

function parseFrom(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || "Baxsparrow", email: m[2].trim() };
  return { name: "Baxsparrow", email: from.trim() };
}

export type MailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
};

type Provider = "brevo" | "resend" | "none";

function activeProvider(): Provider {
  if (env.mail.provider === "brevo" || (!env.mail.provider && env.brevo.apiKey.trim())) {
    return env.brevo.apiKey.trim() ? "brevo" : "none";
  }
  if (env.mail.provider === "resend" || (!env.mail.provider && env.resend.apiKey.trim())) {
    return env.resend.apiKey.trim() ? "resend" : "none";
  }
  if (env.brevo.apiKey.trim()) return "brevo";
  if (env.resend.apiKey.trim()) return "resend";
  return "none";
}

function explainError(message: string): string {
  if (/only send testing emails to your own email/i.test(message)) {
    return (
      message +
      " — Resend onboarding@resend.dev cannot deliver to real inboxes reliably. Use Brevo (BREVO_API_KEY) or verify a domain."
    );
  }
  if (/could not be resolved/i.test(message)) {
    return message + " — Network/DNS to mail API failed (retry).";
  }
  return message;
}

async function sendBrevo(input: SendMailInput): Promise<{ ok: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  const sender = parseFrom(env.mail.from);
  const attachment = input.attachments?.map((a) => {
    const buf = typeof a.content === "string" ? Buffer.from(a.content, "utf8") : a.content;
    return {
      name: a.filename,
      content: buf.toString("base64"),
    };
  });

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.brevo.apiKey.trim(),
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
      attachment: attachment?.length ? attachment : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = body;
    try {
      const j = JSON.parse(body) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* keep raw */
    }
    return { ok: false, error: msg };
  }
  return { ok: true };
}

async function sendResend(input: SendMailInput): Promise<{ ok: boolean; error?: string }> {
  const client = getResend();
  if (!client) return { ok: false, error: "Resend not configured" };

  const { error } = await client.emails.send({
    from: env.mail.from,
    to: input.to.trim().toLowerCase(),
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: typeof a.content === "string" ? Buffer.from(a.content, "utf8") : a.content,
      contentType: a.contentType,
    })),
  });

  if (error) return { ok: false, error: error.message ?? String(error) };
  return { ok: true };
}

/** Fire-and-forget safe: logs + no throw when skipped/fail. */
export async function sendMail(input: SendMailInput): Promise<boolean> {
  const provider = activeProvider();
  if (provider === "none") {
    console.warn("[mail] skipped — set BREVO_API_KEY (recommended) or RESEND_API_KEY");
    return false;
  }

  const to = input.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    console.warn("[mail] skipped — invalid to:", input.to);
    return false;
  }

  try {
    const result =
      provider === "brevo" ? await sendBrevo(input) : await sendResend(input);

    if (!result.ok) {
      console.error(`[mail] ${provider} error:`, explainError(result.error ?? "unknown"));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err);
    return false;
  }
}

export function mailEnabled(): boolean {
  return activeProvider() !== "none";
}
