import type { Request, Response } from "express";
import { getSiteSettings } from "../models/SiteSettings.js";

function publicPayload(s: Awaited<ReturnType<typeof getSiteSettings>>) {
  return {
    promoEnabled: s.promoEnabled,
    promoText: s.promoText,
    carousel: (s.carousel ?? []).filter((c: any) => c.enabled !== false),
    bestsellersEnabled: s.bestsellersEnabled !== false,
    bestsellersTitle: s.bestsellersTitle || "Bestsellers this week",
    bestsellersLinkLabel: s.bestsellersLinkLabel || "Shop all →",
    bestsellersLinkHref: s.bestsellersLinkHref || "/shop",
    bestsellersLimit: Math.min(24, Math.max(1, Number(s.bestsellersLimit) || 8)),
    homeCategoriesEnabled: s.homeCategoriesEnabled !== false,
    homeCategoriesTitle: s.homeCategoriesTitle || "Shop by category",
    homeCategoriesLinkLabel: s.homeCategoriesLinkLabel || "View all →",
    homeCategoriesLinkHref: s.homeCategoriesLinkHref || "/shop",
    homeCategories: (s.homeCategories ?? []).filter((c: any) => c.enabled !== false),
  };
}

export async function getPublicSettings(_req: Request, res: Response) {
  const s = await getSiteSettings();
  res.json(publicPayload(s));
}

export async function getAdminSettings(_req: Request, res: Response) {
  const s = await getSiteSettings();
  res.json(s);
}

export async function updateSettings(req: Request, res: Response) {
  const s = await getSiteSettings();
  if (typeof req.body.promoEnabled === "boolean") s.promoEnabled = req.body.promoEnabled;
  if (typeof req.body.promoText === "string") s.promoText = req.body.promoText.trim();
  if (typeof req.body.bestsellersEnabled === "boolean") {
    s.bestsellersEnabled = req.body.bestsellersEnabled;
  }
  if (typeof req.body.bestsellersTitle === "string") {
    s.bestsellersTitle = req.body.bestsellersTitle.trim() || "Bestsellers this week";
  }
  if (typeof req.body.bestsellersLinkLabel === "string") {
    s.bestsellersLinkLabel = req.body.bestsellersLinkLabel.trim() || "Shop all →";
  }
  if (typeof req.body.bestsellersLinkHref === "string") {
    s.bestsellersLinkHref = req.body.bestsellersLinkHref.trim() || "/shop";
  }
  if (req.body.bestsellersLimit != null) {
    const n = Number(req.body.bestsellersLimit);
    if (!Number.isNaN(n)) s.bestsellersLimit = Math.min(24, Math.max(1, Math.round(n)));
  }
  if (typeof req.body.homeCategoriesEnabled === "boolean") {
    s.homeCategoriesEnabled = req.body.homeCategoriesEnabled;
  }
  if (typeof req.body.homeCategoriesTitle === "string") {
    s.homeCategoriesTitle = req.body.homeCategoriesTitle.trim() || "Shop by category";
  }
  if (typeof req.body.homeCategoriesLinkLabel === "string") {
    s.homeCategoriesLinkLabel = req.body.homeCategoriesLinkLabel.trim() || "View all →";
  }
  if (typeof req.body.homeCategoriesLinkHref === "string") {
    s.homeCategoriesLinkHref = req.body.homeCategoriesLinkHref.trim() || "/shop";
  }
  if (Array.isArray(req.body.homeCategories)) {
    s.homeCategories = req.body.homeCategories.map((t: any) => ({
      name: String(t.name ?? "").trim() || "Category",
      tag: String(t.tag ?? "").trim(),
      subtitle: String(t.subtitle ?? "").trim(),
      imageUrl: String(t.imageUrl ?? "").trim(),
      categoryFilter: String(t.categoryFilter ?? t.name ?? "").trim(),
      enabled: t.enabled !== false,
    })) as any;
  }
  if (Array.isArray(req.body.carousel)) {
    s.carousel = req.body.carousel.map((slide: any) => ({
      eyebrow: String(slide.eyebrow ?? "").trim(),
      title: String(slide.title ?? "").trim() || "Untitled",
      subtitle: String(slide.subtitle ?? ""),
      ctaLabel: String(slide.ctaLabel ?? "Shop now"),
      ctaHref: String(slide.ctaHref ?? "/shop"),
      secondaryCtaLabel: String(slide.secondaryCtaLabel ?? "Wholesale enquiry"),
      secondaryCtaHref: String(slide.secondaryCtaHref ?? "/contact"),
      secondaryCtaEnabled: slide.secondaryCtaEnabled !== false,
      imageUrl: String(slide.imageUrl ?? ""),
      enabled: slide.enabled !== false,
    }));
  }
  await s.save();
  res.json(s);
}
