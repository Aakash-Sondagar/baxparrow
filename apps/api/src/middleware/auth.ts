import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export interface AuthReq extends Request { user?: { id: string; role: string } }
export const auth: RequestHandler = (req: AuthReq, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(h.slice(7), env.jwtAccess) as any; next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
};
// Attaches req.user when a valid token is present, but never blocks (guest checkout).
export const optionalAuth: RequestHandler = (req: AuthReq, _res, next) => {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    try { req.user = jwt.verify(h.slice(7), env.jwtAccess) as any; } catch { /* ignore */ }
  }
  next();
};
export const requireRole = (...roles: string[]): RequestHandler => (req: AuthReq, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  next();
};
