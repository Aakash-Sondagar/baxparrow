import { Schema, model } from "mongoose";

const carouselSlideSchema = new Schema(
  {
    eyebrow: { type: String, default: "EST. MUMBAI · SINCE 2019" },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    ctaLabel: { type: String, default: "Shop now" },
    ctaHref: { type: String, default: "/shop" },
    secondaryCtaLabel: { type: String, default: "Wholesale enquiry" },
    secondaryCtaHref: { type: String, default: "/contact" },
    secondaryCtaEnabled: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { _id: true }
);

const homeCategoryTileSchema = new Schema(
  {
    name: { type: String, required: true },
    tag: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    categoryFilter: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { _id: true }
);

const DEFAULT_CAT_TILES = [
  { name: "School Bags", tag: "SCHOOL", subtitle: "128 styles", categoryFilter: "School Bags", enabled: true },
  { name: "Office Bags", tag: "OFFICE", subtitle: "96 styles", categoryFilter: "Office Bags", enabled: true },
  { name: "Handbags", tag: "HANDBAG", subtitle: "142 styles", categoryFilter: "Handbags", enabled: true },
  { name: "Leather Bags", tag: "LEATHER", subtitle: "74 styles", categoryFilter: "Leather Bags", enabled: true },
  { name: "Sport Bags", tag: "SPORT", subtitle: "88 styles", categoryFilter: "Sport Bags", enabled: true },
  { name: "Suitcases", tag: "LUGGAGE", subtitle: "61 styles", categoryFilter: "Suitcases", enabled: true },
  { name: "Beach Bags", tag: "BEACH", subtitle: "43 styles", categoryFilter: "Beach Bags", enabled: true },
  { name: "Travel Bags", tag: "TRAVEL", subtitle: "110 styles", categoryFilter: "Travel Bags", enabled: true },
];

const siteSettingsSchema = new Schema(
  {
    key: { type: String, unique: true, default: "default" },
    promoEnabled: { type: Boolean, default: true },
    promoText: {
      type: String,
      default: "Monsoon Sale · Flat 20% off Travel & Office ranges · Free shipping over ₹999",
    },
    carousel: {
      type: [carouselSlideSchema],
      default: [
        {
          eyebrow: "EST. MUMBAI · SINCE 2019",
          title: "Carry with confidence.",
          subtitle:
            "Handcrafted school, office, travel & leather bags — made in India, built to last.",
          ctaLabel: "Shop the collection",
          ctaHref: "/shop",
          secondaryCtaLabel: "Wholesale enquiry",
          secondaryCtaHref: "/contact",
          secondaryCtaEnabled: true,
          enabled: true,
        },
      ],
    },
    bestsellersEnabled: { type: Boolean, default: true },
    bestsellersTitle: { type: String, default: "Bestsellers this week" },
    bestsellersLinkLabel: { type: String, default: "Shop all →" },
    bestsellersLinkHref: { type: String, default: "/shop" },
    bestsellersLimit: { type: Number, default: 8 },
    homeCategoriesEnabled: { type: Boolean, default: true },
    homeCategoriesTitle: { type: String, default: "Shop by category" },
    homeCategoriesLinkLabel: { type: String, default: "View all →" },
    homeCategoriesLinkHref: { type: String, default: "/shop" },
    homeCategories: {
      type: [homeCategoryTileSchema],
      default: DEFAULT_CAT_TILES,
    },
  },
  { timestamps: true }
);

export const SiteSettings = model("SiteSettings", siteSettingsSchema);

export async function getSiteSettings() {
  let doc = await SiteSettings.findOne({ key: "default" });
  if (!doc) {
    doc = await SiteSettings.create({ key: "default" });
  }
  // Backfill home categories on old docs
  if (!doc.homeCategories?.length) {
    doc.homeCategories = DEFAULT_CAT_TILES as any;
    await doc.save();
  }
  return doc;
}
