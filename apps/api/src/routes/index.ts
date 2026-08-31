import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { validate } from "../middleware/validate.js";
import { auth, optionalAuth, requireRole } from "../middleware/auth.js";
import { registerSchema, loginSchema, addToCartSchema, createOrderSchema, productSchema, wholesaleLeadSchema, categorySchema, updateOrderStatusSchema, requestReturnSchema, updateReturnSchema, forgotPasswordSchema, resetPasswordSchema } from "@baxparrow/shared";
import * as A from "../controllers/auth.controller.js";
import * as P from "../controllers/product.controller.js";
import * as C from "../controllers/cart.controller.js";
import * as O from "../controllers/order.controller.js";
import * as Ad from "../controllers/admin.controller.js";
import * as U from "../controllers/upload.controller.js";
import * as N from "../controllers/notification.controller.js";
import * as S from "../controllers/settings.controller.js";
import { Category } from "../models/Category.js";
const upload = multer();
const r = Router();
const authLimit = rateLimit({ windowMs: 15 * 60_000, max: 30 });
const loginLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: { error: "Too many login attempts. Try again later." },
});
const forgotLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  message: { error: "Too many requests. Try again later." },
});
const resetLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 });

// auth
r.post("/auth/register", authLimit, validate(registerSchema), A.register);
r.post("/auth/login", loginLimit, validate(loginSchema), A.login);
r.post("/auth/forgot-password", forgotLimit, validate(forgotPasswordSchema), A.forgotPassword);
r.post("/auth/reset-password", resetLimit, validate(resetPasswordSchema), A.resetPassword);
r.post("/auth/logout", A.logout);
r.get("/auth/me", auth, A.me);
r.get("/me/orders", auth, O.myOrders);

// customer-scoped image upload (return photos) — signs into the returns folder only
r.post("/uploads/sign", auth, U.signReturnUpload);

// catalog (public)
r.get("/products", P.list);
r.get("/products/:slug", P.bySlug);
r.get("/categories", async (_req, res) => res.json(await Category.find().sort("order")));
r.get("/settings", S.getPublicSettings);
r.post("/leads/wholesale", validate(wholesaleLeadSchema), (_req, res) => res.json({ ok: true }));

// cart (guest via X-Cart-Key, or logged-in user)
r.get("/cart", optionalAuth, C.getCart);
r.post("/cart", optionalAuth, validate(addToCartSchema), C.addItem);
r.patch("/cart", optionalAuth, C.setItems);

// orders + payments (guest checkout allowed → optionalAuth)
r.post("/orders", optionalAuth, validate(createOrderSchema), O.createOrder);
r.post("/payments/verify", optionalAuth, O.verifyPayment);
r.get("/orders/:no/track", optionalAuth, O.track);
r.post("/orders/:no/return", auth, validate(requestReturnSchema), O.requestReturnController);

// admin
r.post("/admin/uploads/sign", auth, requireRole("admin"), U.signUpload);
r.get("/admin/products", auth, requireRole("admin"), Ad.listProducts);
r.get("/admin/products/:id", auth, requireRole("admin"), P.byId);
r.post("/admin/products", auth, requireRole("admin"), validate(productSchema), P.create);
r.patch("/admin/products/:id", auth, requireRole("admin"), P.update);
r.delete("/admin/products/:id", auth, requireRole("admin"), P.remove);
r.post("/admin/products/bulk", auth, requireRole("admin"), upload.single("file"), Ad.bulkImport);
r.get("/admin/orders", auth, requireRole("admin"), Ad.listOrders);
r.patch("/admin/orders/:no/status", auth, requireRole("admin"), validate(updateOrderStatusSchema), Ad.updateOrderStatus);
r.patch("/admin/orders/:no/return", auth, requireRole("admin"), validate(updateReturnSchema), Ad.updateReturnController);
r.get("/admin/metrics", auth, requireRole("admin"), Ad.metrics);
r.get("/admin/categories", auth, requireRole("admin"), Ad.listCategories);
r.post("/admin/categories", auth, requireRole("admin"), validate(categorySchema), Ad.createCategory);
r.patch("/admin/categories/:id", auth, requireRole("admin"), Ad.updateCategory);
r.delete("/admin/categories/:id", auth, requireRole("admin"), Ad.deleteCategory);
r.get("/admin/settings", auth, requireRole("admin"), S.getAdminSettings);
r.patch("/admin/settings", auth, requireRole("admin"), S.updateSettings);

// notifications (any authenticated role)
r.get("/notifications", auth, N.list);
r.get("/notifications/unread-count", auth, N.unreadCount);
r.patch("/notifications/:id/read", auth, N.markRead);
r.post("/notifications/read-all", auth, N.markAllRead);

export default r;
