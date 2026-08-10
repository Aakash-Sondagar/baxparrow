import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny): RequestHandler => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({
      error: "Validation failed",
      fields,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  req.body = parsed.data;
  next();
};
