import { z } from "zod";

export const CATEGORIES = [
  "School Bags","Office Bags","Handbags","Leather Bags","Sport Bags",
  "Suitcases","Beach Bags","Travel Bags","Wallets","Purses","Custom Bags",
] as const;

export const Role = z.enum(["customer", "wholesale", "admin"]);
export type Role = z.infer<typeof Role>;

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["customer", "wholesale"]).default("customer"),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const MAX_PRODUCT_IMAGES = 6;

export const productSchema = z.object({
  name: z.string().min(2),
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
  bulkPrice: z.number().int().nonnegative().optional(),
  moq: z.number().int().positive().optional(),
  status: z.enum(["active", "draft"]).default("active"),
});
export type ProductInput = z.infer<typeof productSchema>;

export const cartItemSchema = z.object({
  product: z.string(), color: z.string().optional(), size: z.string().optional(),
  qty: z.number().int().positive(),
});
export const addToCartSchema = cartItemSchema;

export const addressSchema = z.object({
  firstName: z.string(), lastName: z.string(), email: z.string().email(),
  address: z.string(), city: z.string(), pin: z.string().min(4),
});
export const createOrderSchema = z.object({
  address: addressSchema,
  items: z.array(cartItemSchema).optional(),
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
  "system",
] as const;

export const GST_RATE = 0.18;
export const FREE_SHIPPING_OVER = 999;
export const FLAT_SHIPPING = 79;
export function computeTotals(subtotal: number) {
  const shipping = subtotal > FREE_SHIPPING_OVER || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const gst = Math.round(subtotal * GST_RATE);
  return { subtotal, shipping, gst, total: subtotal + shipping + gst };
}
