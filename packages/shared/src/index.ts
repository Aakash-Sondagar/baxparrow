import { z } from "zod";

export const CATEGORIES = [
  "School Bags","Office Bags","Handbags","Leather Bags","Sport Bags",
  "Suitcases","Beach Bags","Travel Bags","Wallets","Purses","Custom Bags",
] as const;

export const Role = z.enum(["customer", "wholesale", "admin"]);
export type Role = z.infer<typeof Role>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email().max(100),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(100),
  password: z.string().min(1, "Password is required").max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(100),
});
export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Invalid reset link"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const MAX_PRODUCT_IMAGES = 6;

/** Extract YouTube video id from watch / youtu.be / embed / shorts URLs. */
export function youtubeVideoId(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.searchParams.get("v") && /^[\w-]{11}$/.test(u.searchParams.get("v")!))
        return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") && parts[1])
        return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null;
    }
  } catch {
    return null;
  }
  return null;
}

export const youtubeUrlSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || Boolean(youtubeVideoId(v)), {
    message: "Enter a valid YouTube link",
  });

export const variantSchema = z.object({
  color: z.string().min(1),
  sku: z
    .string()
    .min(2)
    .regex(/^[A-Z0-9_-]+$/, "SKU must be uppercase letters, numbers, - or _ only"),
  price: z.number().int().nonnegative(),
  mrp: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  images: z.array(z.string().url()).max(MAX_PRODUCT_IMAGES).default([]),
  youtubeUrl: youtubeUrlSchema,
});
export type VariantInput = z.infer<typeof variantSchema>;

export const productSchema = z.object({
  name: z.string().min(2),
  /** Primary / fallback SKU — synced from first variant when variants exist */
  sku: z
    .string()
    .min(2)
    .regex(/^[A-Z0-9_-]+$/, "SKU must be uppercase letters, numbers, - or _ only"),
  category: z.string().min(2),
  description: z.string().default(""),
  price: z.number().int().nonnegative(),
  mrp: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  images: z.array(z.string().url()).max(MAX_PRODUCT_IMAGES).default([]),
  colors: z.array(z.string().min(1)).max(12).default([]),
  sizes: z.array(z.string().min(1)).max(12).default([]),
  /** Per-colour inventory / price / SKU / images / video */
  variants: z.array(variantSchema).max(12).default([]),
  bulkPrice: z.number().int().nonnegative().optional(),
  moq: z.number().int().positive().optional(),
  status: z.enum(["active", "draft"]).default("active"),
});
export type ProductInput = z.infer<typeof productSchema>;

export const MAX_CART_QTY = 99;
export const MAX_CART_LINES = 50;

export const cartItemSchema = z.object({
  product: z.string(), color: z.string().optional(), size: z.string().optional(),
  qty: z.number().int().positive().max(MAX_CART_QTY),
});
export const addToCartSchema = cartItemSchema;

export const ADDRESS_LIMITS = {
  email: 100,
  firstName: 50,
  lastName: 50,
  address: 200,
  city: 80,
  pin: 6,
  phone: 10,
} as const;

const t = (max: number) => z.string().trim().max(max);

export const addressSchema = z.object({
  email: t(ADDRESS_LIMITS.email)
    .min(1, "Email is required")
    .email("Enter a valid email (e.g. you@email.com)"),
  firstName: t(ADDRESS_LIMITS.firstName)
    .min(1, "First name is required")
    .regex(/^[\p{L} .'-]+$/u, "First name: letters only"),
  lastName: t(ADDRESS_LIMITS.lastName)
    .min(1, "Last name is required")
    .regex(/^[\p{L} .'-]+$/u, "Last name: letters only"),
  address: t(ADDRESS_LIMITS.address).min(5, "Address is too short (min 5 characters)"),
  city: t(ADDRESS_LIMITS.city)
    .min(1, "City is required")
    .regex(/^[\p{L} .'-]+$/u, "City: letters only"),
  pin: t(ADDRESS_LIMITS.pin)
    .min(1, "PIN code is required")
    .regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
  phone: t(ADDRESS_LIMITS.phone)
    .min(1, "Mobile number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
});
export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(200).optional(),
});

export const RETURN_WINDOW_DAYS = 7;
export const RETURN_STATUSES = ["requested", "approved", "received", "refunded", "rejected"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_REASONS = [
  "Damaged or defective",
  "Wrong item delivered",
  "Not as described",
  "Quality not as expected",
  "Changed my mind",
  "Other",
] as const;
export const RETURN_OTHER = "Other";
export const MAX_RETURN_IMAGES = 4;
export const MAX_RETURN_IMAGE_BYTES = 5 * 1024 * 1024;

export function returnWindowOpen(deliveredAt?: string | Date | null, now = new Date()): boolean {
  if (!deliveredAt) return false;
  return now.getTime() - new Date(deliveredAt).getTime() <= RETURN_WINDOW_DAYS * 86_400_000;
}

export const requestReturnSchema = z
  .object({
    reason: z.enum(RETURN_REASONS),
    reasonDetail: z.string().trim().max(500).optional(),
    images: z.array(z.string().url()).min(1, "Add at least 1 photo").max(MAX_RETURN_IMAGES),
  })
  .refine((d) => d.reason !== RETURN_OTHER || (d.reasonDetail ?? "").trim().length >= 5, {
    message: "Please describe your reason",
    path: ["reasonDetail"],
  });

export const updateReturnSchema = z.object({
  status: z.enum(["approved", "received", "refunded", "rejected"]),
  note: z.string().max(300).optional(),
});

export const createOrderSchema = z.object({
  address: addressSchema,
  items: z.array(cartItemSchema).max(MAX_CART_LINES).optional(),
});

export const wholesaleLeadSchema = z.object({
  company: z.string(), name: z.string(), email: z.string().email(),
  phone: z.string(), message: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  image: z.string().url().optional().or(z.literal("")),
  order: z.number().int().nonnegative().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const NOTIFICATION_TYPES = [
  "order.new",
  "order.paid",
  "order.status",
  "return.requested",
  "return.updated",
  "return.refunded",
  "inventory.low",
  "inventory.out",
  "product.created",
  "product.updated",
  "product.deleted",
  "bulk.completed",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Types visible on storefront / to non-admin shoppers */
export const CUSTOMER_NOTIFICATION_TYPES = [
  "order.new",
  "order.paid",
  "order.status",
  "return.updated",
  "return.refunded",
  "system",
] as const;

export const GST_RATE = 0.18;
export const FREE_SHIPPING_OVER = 999;
export const FLAT_SHIPPING = 79;

/**
 * Selling price is GST-inclusive.
 * `gst` = tax portion inside subtotal (display only — not added again).
 * `total` = subtotal + shipping.
 */
export function computeTotals(subtotal: number, mrpTotal = 0) {
  const shipping = subtotal > FREE_SHIPPING_OVER || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const gst = Math.round(subtotal - subtotal / (1 + GST_RATE));
  const discountPct =
    mrpTotal > subtotal && mrpTotal > 0
      ? Math.round((1 - subtotal / mrpTotal) * 100)
      : 0;
  const discount = Math.max(0, mrpTotal - subtotal);
  return {
    subtotal,
    mrp: mrpTotal,
    discountPct,
    discount,
    shipping,
    gst,
    total: subtotal + shipping,
  };
}
