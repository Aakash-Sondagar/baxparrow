import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
export const validate = (schema: ZodTypeAny): RequestHandler => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
  req.body = parsed.data; next();
};
