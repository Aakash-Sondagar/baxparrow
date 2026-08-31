import type { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";

function signedUploadParams(res: Response, folder: string): boolean {
  if (!env.cloudinary.cloudName) {
    res.status(400).json({ error: "Cloudinary not configured" });
    return false;
  }
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, env.cloudinary.apiSecret);
  res.json({ signature, timestamp, folder, apiKey: env.cloudinary.apiKey, cloudName: env.cloudinary.cloudName });
  return true;
}

// Admin signature — uploads to the main product folder.
export function signUpload(_req: Request, res: Response) {
  signedUploadParams(res, env.cloudinary.folder);
}

// Customer signature — hard-scoped to the returns folder so a signed request
// can never target the product folder.
export function signReturnUpload(_req: Request, res: Response) {
  signedUploadParams(res, `${env.cloudinary.folder}/returns`);
}
