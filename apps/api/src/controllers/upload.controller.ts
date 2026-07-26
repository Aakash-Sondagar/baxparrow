import type { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
// Returns a signature the browser uses to upload directly to Cloudinary.
export function signUpload(_req: Request, res: Response) {
  if (!env.cloudinary.cloudName) return res.status(400).json({ error: "Cloudinary not configured" });
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: env.cloudinary.folder };
  const signature = cloudinary.utils.api_sign_request(params, env.cloudinary.apiSecret);
  res.json({
    signature, timestamp, folder: env.cloudinary.folder,
    apiKey: env.cloudinary.apiKey, cloudName: env.cloudinary.cloudName,
  });
}
