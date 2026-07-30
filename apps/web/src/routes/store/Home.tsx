import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tile } from "../../styles/tokens";
import { useProducts } from "../../features/products/hooks";
import { ProductCard } from "../../components/ProductCard";
import { Reveal } from "../../components/Reveal";
import { api } from "../../lib/api";

const TRUST = [
  ["Made in Mumbai", "Own manufacturing unit"],
  ["1-year warranty", "On all bags"],
  ["Free shipping", "On orders over ₹999"],
  ["7-day returns", "No questions asked"],
];

type Slide = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaEnabled?: boolean;
  imageUrl?: string;
};

type CatTile = {
  name: string;
  tag?: string;
  subtitle?: string;
  imageUrl?: string;
  categoryFilter?: string;
};

type PublicSettings = {
  carousel: Slide[];
  bestsellersEnabled: boolean;
  bestsellersTitle: string;
  bestsellersLinkLabel: string;
  bestsellersLinkHref: string;
  bestsellersLimit: number;
  homeCategoriesEnabled: boolean;
  homeCategoriesTitle: string;
  homeCategoriesLinkLabel: string;
  homeCategoriesLinkHref: string;
  homeCategories: CatTile[];
};

const FALLBACK: Slide[] = [
  {
    eyebrow: "EST. MUMBAI · SINCE 2019",
    title: "Carry with confidence.",
    subtitle:
      "Handcrafted school, office, travel & leather bags — made in India, built to last. Shop retail or order in bulk for your team.",
    ctaLabel: "Shop the collection",
    ctaHref: "/shop",
    secondaryCtaLabel: "Wholesale enquiry",
    secondaryCtaHref: "/contact",
    secondaryCtaEnabled: true,
  },
];

const FALLBACK_CATS: CatTile[] = [
  { name: "School Bags", tag: "SCHOOL", subtitle: "128 styles", categoryFilter: "School Bags" },
  { name: "Office Bags", tag: "OFFICE", subtitle: "96 styles", categoryFilter: "Office Bags" },
  { name: "Handbags", tag: "HANDBAG", subtitle: "142 styles", categoryFilter: "Handbags" },
  { name: "Leather Bags", tag: "LEATHER", subtitle: "74 styles", categoryFilter: "Leather Bags" },
  { name: "Sport Bags", tag: "SPORT", subtitle: "88 styles", categoryFilter: "Sport Bags" },
  { name: "Suitcases", tag: "LUGGAGE", subtitle: "61 styles", categoryFilter: "Suitcases" },
  { name: "Beach Bags", tag: "BEACH", subtitle: "43 styles", categoryFilter: "Beach Bags" },
  { name: "Travel Bags", tag: "TRAVEL", subtitle: "110 styles", categoryFilter: "Travel Bags" },
];

export default function Home() {
  const nav = useNavigate();
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/settings")).data as PublicSettings,
    staleTime: 60_000,
  });

  const bestsellersOn = settings?.bestsellersEnabled !== false;
  const bestsellersLimit = settings?.bestsellersLimit ?? 8;
  const { data } = useProducts(
    { limit: String(bestsellersLimit) },
    { enabled: bestsellersOn }
  );

  const slides = (settings?.carousel?.length ? settings.carousel : FALLBACK) as Slide[];
  const [idx, setIdx] = useState(0);
  const slide = slides[Math.min(idx, slides.length - 1)] ?? FALLBACK[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    setIdx(0);
  }, [slides.length]);

  const showSecondary = slide.secondaryCtaEnabled !== false;
  const secondaryLabel = slide.secondaryCtaLabel || "Wholesale enquiry";
  const secondaryHref = slide.secondaryCtaHref || "/contact";

  const catsOn = settings?.homeCategoriesEnabled !== false;
  const catTiles =
    settings?.homeCategories?.length ? settings.homeCategories : FALLBACK_CATS;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 sm:px-7 sm:py-6">
      <div className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[20px] bg-[linear-gradient(120deg,#241E19,#3A2D23)] text-bg sm:min-h-[400px] md:min-h-[440px] md:flex-row">
        <div
          key={idx}
          className="animate-fade-up flex max-w-[560px] flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 md:px-14 md:py-16"
        >
          {(() => {
            const eyebrow =
              slide.eyebrow === undefined || slide.eyebrow === null
                ? "EST. MUMBAI · SINCE 2019"
                : slide.eyebrow;
            return eyebrow ? (
              <span className="mb-[18px] font-mono text-[10px] tracking-[.2em] text-tan sm:text-xs">
                {eyebrow}
              </span>
            ) : null;
          })()}
          <h1 className="m-0 mb-4 font-display text-[36px] font-extrabold leading-[1.02] tracking-[-.03em] sm:mb-5 sm:text-[44px] md:text-[56px]">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="m-0 mb-6 text-[15px] leading-[1.6] text-[#D8CFC5] sm:mb-8 sm:text-[17px]">
              {slide.subtitle}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3.5">
            <button
              onClick={() => nav(slide.ctaHref || "/shop")}
              className="cursor-pointer rounded-[11px] border-none bg-tan px-7 py-[15px] text-[15px] font-bold text-ink transition-[transform,filter] duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              {slide.ctaLabel || "Shop now"}
            </button>
            {showSecondary && (
              <button
                onClick={() => nav(secondaryHref)}
                className="cursor-pointer rounded-[11px] border border-[rgba(247,244,239,.35)] bg-transparent px-[26px] py-[15px] text-[15px] font-semibold text-bg transition-[background-color,border-color] duration-200 hover:border-[rgba(247,244,239,.6)] hover:bg-white/5 active:scale-[0.98]"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
          {slides.length > 1 && (
            <div className="mt-8 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-2 cursor-pointer rounded-full border-0 transition-all duration-300 ${
                    i === idx ? "w-7 bg-tan" : "w-2 bg-[rgba(247,244,239,.35)] hover:bg-[rgba(247,244,239,.55)]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div
          key={`img-${idx}`}
          className="animate-fade-in hidden min-h-[200px] flex-1 bg-[repeating-linear-gradient(135deg,#4A3A2D,#4A3A2D_14px,#43342825_14px,#433428_28px)] bg-cover bg-center sm:grid sm:place-items-center md:min-h-0"
          style={
            slide.imageUrl
              ? { backgroundImage: `url(${slide.imageUrl})`, backgroundSize: "cover" }
              : undefined
          }
        >
          {!slide.imageUrl && (
            <span className="font-mono text-xs text-[#C9B39E]">[ hero bag lifestyle shot ]</span>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {TRUST.map(([title, sub], i) => (
          <Reveal key={title} delay={(Math.min(i + 1, 4) as 1 | 2 | 3 | 4)}>
            <div className="rounded-[13px] border border-border bg-card px-4 py-3.5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-cognac/20 hover:shadow-sm sm:px-5 sm:py-[18px]">
              <div className="font-display text-[14px] font-bold sm:text-[15px]">{title}</div>
              <div className="mt-[3px] text-[12px] text-muted sm:text-[12.5px]">{sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
      {catsOn && (
        <Reveal>
          <section className="px-0 pt-9 pb-2">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <h2 className="m-0 font-display text-[22px] font-bold tracking-[-.02em] sm:text-[26px]">
                {settings?.homeCategoriesTitle || "Shop by category"}
              </h2>
              <Link
                to={settings?.homeCategoriesLinkHref || "/shop"}
                className="shrink-0 text-sm font-semibold"
              >
                {settings?.homeCategoriesLinkLabel || "View all →"}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4">
              {catTiles.map((c, i) => {
                const filter = c.categoryFilter || c.name;
                return (
                  <button
                    key={`${c.name}-${i}`}
                    onClick={() => nav(`/shop?category=${encodeURIComponent(filter)}`)}
                    className="group relative flex aspect-[1/0.82] cursor-pointer flex-col justify-end overflow-hidden rounded-[15px] border border-border p-4 text-left transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-cognac/30 hover:shadow-[0_10px_24px_rgba(28,25,23,0.1)]"
                    style={
                      c.imageUrl
                        ? {
                            backgroundImage: `linear-gradient(to top, rgba(0,0,0,.45), transparent 55%), url(${c.imageUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : { background: tile(i) }
                    }
                  >
                    {c.tag && (
                      <span
                        className={`absolute top-3 left-[14px] font-mono text-[10px] ${
                          c.imageUrl ? "text-white/80" : "text-[#9C8B7A]"
                        }`}
                      >
                        [ {c.tag} ]
                      </span>
                    )}
                    <span
                      className={`font-display text-base font-bold transition-transform duration-300 group-hover:translate-x-0.5 ${
                        c.imageUrl ? "text-white" : "text-[#26201B]"
                      }`}
                    >
                      {c.name}
                    </span>
                    {c.subtitle && (
                      <span className={`text-xs ${c.imageUrl ? "text-white/80" : "text-[#6E655C]"}`}>
                        {c.subtitle}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}
      {bestsellersOn && (
        <Reveal>
          <section className="py-9">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <h2 className="m-0 font-display text-[22px] font-bold tracking-[-.02em] sm:text-[26px]">
                {settings?.bestsellersTitle || "Bestsellers this week"}
              </h2>
              <Link
                to={settings?.bestsellersLinkHref || "/shop"}
                className="shrink-0 text-sm font-semibold"
              >
                {settings?.bestsellersLinkLabel || "Shop all →"}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-[18px] md:grid-cols-3 lg:grid-cols-4">
              {(data?.items ?? []).map((p, i) => (
                <ProductCard key={p._id} p={p} index={i} />
              ))}
            </div>
          </section>
        </Reveal>
      )}
      <Reveal>
        <section className="mb-10">
          <div className="flex flex-col items-stretch gap-8 rounded-[20px] bg-ink px-6 py-10 text-bg sm:px-10 sm:py-12 md:flex-row md:items-center md:gap-10 md:px-[52px]">
            <div className="flex-1">
              <span className="font-mono text-xs tracking-[.18em] text-tan">B2B / WHOLESALE</span>
              <h2 className="my-3 font-display text-[26px] font-extrabold tracking-[-.02em] sm:text-[34px]">
                Kitting out a school, office or store?
              </h2>
              <p className="m-0 mb-6 max-w-[520px] text-[15px] text-[#CDC4BA] sm:text-base">
                Custom branding, tiered pricing from MOQ 50, and dedicated dispatch. Get a quote within 24
                hours.
              </p>
              <button
                onClick={() => nav("/contact")}
                className="cursor-pointer rounded-[11px] border-none bg-tan px-[26px] py-[14px] text-[15px] font-bold text-ink transition-[transform,filter] duration-200 hover:brightness-105 active:scale-[0.98]"
              >
                Request bulk quote
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-[34px]">
              {[
                ["1000+", "styles in stock"],
                ["MOQ 50", "for custom orders"],
                ["24h", "quote turnaround"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-[24px] font-extrabold text-tan sm:text-[32px]">{n}</div>
                  <div className="text-[12px] text-[#CDC4BA] sm:text-[13px]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
