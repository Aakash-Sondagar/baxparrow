import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";

type Slide = {
  _id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaEnabled: boolean;
  imageUrl: string;
  enabled: boolean;
};

type CatTile = {
  name: string;
  tag: string;
  subtitle: string;
  imageUrl: string;
  categoryFilter: string;
  enabled: boolean;
};

type Settings = {
  promoEnabled: boolean;
  promoText: string;
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

const emptySlide = (): Slide => ({
  eyebrow: "EST. MUMBAI · SINCE 2019",
  title: "",
  subtitle: "",
  ctaLabel: "Shop now",
  ctaHref: "/shop",
  secondaryCtaLabel: "Wholesale enquiry",
  secondaryCtaHref: "/contact",
  secondaryCtaEnabled: true,
  imageUrl: "",
  enabled: true,
});

const emptyCat = (): CatTile => ({
  name: "",
  tag: "",
  subtitle: "",
  imageUrl: "",
  categoryFilter: "",
  enabled: true,
});

const field =
  "mt-1.5 w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-cognac";
const label = "text-[12px] font-semibold text-muted";

export default function UiSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api.get("/admin/settings")).data as Settings,
  });

  const [promoEnabled, setPromoEnabled] = useState(true);
  const [promoText, setPromoText] = useState("");
  const [carousel, setCarousel] = useState<Slide[]>([]);
  const [bestsellersEnabled, setBestsellersEnabled] = useState(true);
  const [bestsellersTitle, setBestsellersTitle] = useState("Bestsellers this week");
  const [bestsellersLinkLabel, setBestsellersLinkLabel] = useState("Shop all →");
  const [bestsellersLinkHref, setBestsellersLinkHref] = useState("/shop");
  const [bestsellersLimit, setBestsellersLimit] = useState(8);
  const [homeCategoriesEnabled, setHomeCategoriesEnabled] = useState(true);
  const [homeCategoriesTitle, setHomeCategoriesTitle] = useState("Shop by category");
  const [homeCategoriesLinkLabel, setHomeCategoriesLinkLabel] = useState("View all →");
  const [homeCategoriesLinkHref, setHomeCategoriesLinkHref] = useState("/shop");
  const [homeCategories, setHomeCategories] = useState<CatTile[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!data) return;
    setPromoEnabled(data.promoEnabled);
    setPromoText(data.promoText ?? "");
    setBestsellersEnabled(data.bestsellersEnabled !== false);
    setBestsellersTitle(data.bestsellersTitle ?? "Bestsellers this week");
    setBestsellersLinkLabel(data.bestsellersLinkLabel ?? "Shop all →");
    setBestsellersLinkHref(data.bestsellersLinkHref ?? "/shop");
    setBestsellersLimit(data.bestsellersLimit ?? 8);
    setHomeCategoriesEnabled(data.homeCategoriesEnabled !== false);
    setHomeCategoriesTitle(data.homeCategoriesTitle ?? "Shop by category");
    setHomeCategoriesLinkLabel(data.homeCategoriesLinkLabel ?? "View all →");
    setHomeCategoriesLinkHref(data.homeCategoriesLinkHref ?? "/shop");
    setHomeCategories(
      (data.homeCategories ?? []).map((t) => ({
        name: t.name ?? "",
        tag: t.tag ?? "",
        subtitle: t.subtitle ?? "",
        imageUrl: t.imageUrl ?? "",
        categoryFilter: t.categoryFilter ?? t.name ?? "",
        enabled: t.enabled !== false,
      }))
    );
    setCarousel(
      (data.carousel ?? []).map((s) => ({
        eyebrow: s.eyebrow ?? "EST. MUMBAI · SINCE 2019",
        title: s.title ?? "",
        subtitle: s.subtitle ?? "",
        ctaLabel: s.ctaLabel ?? "Shop now",
        ctaHref: s.ctaHref ?? "/shop",
        secondaryCtaLabel: s.secondaryCtaLabel ?? "Wholesale enquiry",
        secondaryCtaHref: s.secondaryCtaHref ?? "/contact",
        secondaryCtaEnabled: s.secondaryCtaEnabled !== false,
        imageUrl: s.imageUrl ?? "",
        enabled: s.enabled !== false,
      }))
    );
  }, [data]);

  const save = useMutation({
    mutationFn: async () =>
      (
        await api.patch("/admin/settings", {
          promoEnabled,
          promoText,
          carousel,
          bestsellersEnabled,
          bestsellersTitle,
          bestsellersLinkLabel,
          bestsellersLinkHref,
          bestsellersLimit,
          homeCategoriesEnabled,
          homeCategoriesTitle,
          homeCategoriesLinkLabel,
          homeCategoriesLinkHref,
          homeCategories,
        })
      ).data,
    onSuccess: () => {
      setMsg("Saved");
      setErr("");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
      setTimeout(() => setMsg(""), 2000);
    },
    onError: (e: any) => {
      setErr(e?.response?.data?.error ?? "Save failed");
      setMsg("");
    },
  });

  const updateSlide = (i: number, patch: Partial<Slide>) => {
    setCarousel((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const updateCat = (i: number, patch: Partial<CatTile>) => {
    setHomeCategories((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };

  if (isLoading) return <div className="text-sm text-muted">Loading settings…</div>;

  return (
    <div className="mx-auto max-w-[820px] flex flex-col gap-5">
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="mb-1 font-display text-base font-bold">Promo tip bar</div>
        <p className="m-0 mb-4 text-[13px] text-muted">
          Top cognac strip on the storefront. Toggle off to hide.
        </p>
        <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={promoEnabled}
            onChange={(e) => setPromoEnabled(e.target.checked)}
            className="h-4 w-4 accent-cognac"
          />
          Show promo bar
        </label>
        <label className={label}>Promo text</label>
        <textarea
          value={promoText}
          onChange={(e) => setPromoText(e.target.value)}
          rows={2}
          placeholder="Monsoon Sale · Flat 20% off…"
          className={`${field} resize-y`}
          disabled={!promoEnabled}
        />
      </div>

      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-base font-bold">Home carousel</div>
            <p className="m-0 mt-1 text-[13px] text-muted">Slides on the customer homepage hero.</p>
          </div>
          <button
            type="button"
            onClick={() => setCarousel((c) => [...c, emptySlide()])}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-border bg-admin-canvas px-3 py-2 text-[13px] font-semibold hover:bg-subtle"
          >
            <Plus size={15} /> Add slide
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {carousel.length === 0 && (
            <div className="rounded-[10px] border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No slides yet. Add one for the homepage hero.
            </div>
          )}
          {carousel.map((slide, i) => (
            <div key={i} className="rounded-[12px] border border-border bg-admin-canvas p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted2">SLIDE {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold">
                    <input
                      type="checkbox"
                      checked={slide.enabled}
                      onChange={(e) => updateSlide(i, { enabled: e.target.checked })}
                      className="accent-cognac"
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => setCarousel((c) => c.filter((_, idx) => idx !== i))}
                    className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[12px] font-semibold text-danger"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={label}>Eyebrow / kicker</label>
                  <input
                    value={slide.eyebrow}
                    onChange={(e) => updateSlide(i, { eyebrow: e.target.value })}
                    className={field}
                    placeholder="EST. MUMBAI · SINCE 2019"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Title</label>
                  <input
                    value={slide.title}
                    onChange={(e) => updateSlide(i, { title: e.target.value })}
                    className={field}
                    placeholder="Carry with confidence."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Subtitle</label>
                  <textarea
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
                    rows={2}
                    className={`${field} resize-y`}
                  />
                </div>
                <div>
                  <label className={label}>Primary CTA label</label>
                  <input
                    value={slide.ctaLabel}
                    onChange={(e) => updateSlide(i, { ctaLabel: e.target.value })}
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Primary CTA link</label>
                  <input
                    value={slide.ctaHref}
                    onChange={(e) => updateSlide(i, { ctaHref: e.target.value })}
                    className={field}
                    placeholder="/shop"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-muted">
                    <input
                      type="checkbox"
                      checked={slide.secondaryCtaEnabled}
                      onChange={(e) =>
                        updateSlide(i, { secondaryCtaEnabled: e.target.checked })
                      }
                      className="accent-cognac"
                    />
                    Show wholesale / secondary button
                  </label>
                </div>
                <div>
                  <label className={label}>Secondary CTA label</label>
                  <input
                    value={slide.secondaryCtaLabel}
                    onChange={(e) => updateSlide(i, { secondaryCtaLabel: e.target.value })}
                    className={field}
                    placeholder="Wholesale enquiry"
                    disabled={!slide.secondaryCtaEnabled}
                  />
                </div>
                <div>
                  <label className={label}>Secondary CTA link</label>
                  <input
                    value={slide.secondaryCtaHref}
                    onChange={(e) => updateSlide(i, { secondaryCtaHref: e.target.value })}
                    className={field}
                    placeholder="/contact"
                    disabled={!slide.secondaryCtaEnabled}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Image URL (optional)</label>
                  <input
                    value={slide.imageUrl}
                    onChange={(e) => updateSlide(i, { imageUrl: e.target.value })}
                    className={field}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-base font-bold">Shop by category</div>
            <p className="m-0 mt-1 text-[13px] text-muted">Homepage category tiles.</p>
          </div>
          <button
            type="button"
            onClick={() => setHomeCategories((c) => [...c, emptyCat()])}
            disabled={!homeCategoriesEnabled}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-border bg-admin-canvas px-3 py-2 text-[13px] font-semibold hover:bg-subtle disabled:opacity-50"
          >
            <Plus size={15} /> Add tile
          </button>
        </div>
        <label className="mb-4 mt-3 flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={homeCategoriesEnabled}
            onChange={(e) => setHomeCategoriesEnabled(e.target.checked)}
            className="h-4 w-4 accent-cognac"
          />
          Show category section
        </label>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Section title</label>
            <input
              value={homeCategoriesTitle}
              onChange={(e) => setHomeCategoriesTitle(e.target.value)}
              className={field}
              disabled={!homeCategoriesEnabled}
            />
          </div>
          <div>
            <label className={label}>Link label</label>
            <input
              value={homeCategoriesLinkLabel}
              onChange={(e) => setHomeCategoriesLinkLabel(e.target.value)}
              className={field}
              disabled={!homeCategoriesEnabled}
            />
          </div>
          <div>
            <label className={label}>Link href</label>
            <input
              value={homeCategoriesLinkHref}
              onChange={(e) => setHomeCategoriesLinkHref(e.target.value)}
              className={field}
              disabled={!homeCategoriesEnabled}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {homeCategories.map((t, i) => (
            <div key={i} className="rounded-[12px] border border-border bg-admin-canvas p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted2">TILE {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold">
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={(e) => updateCat(i, { enabled: e.target.checked })}
                      className="accent-cognac"
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => setHomeCategories((c) => c.filter((_, idx) => idx !== i))}
                    className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[12px] font-semibold text-danger"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Name</label>
                  <input
                    value={t.name}
                    onChange={(e) => updateCat(i, { name: e.target.value })}
                    className={field}
                    placeholder="Travel Bags"
                  />
                </div>
                <div>
                  <label className={label}>Tag</label>
                  <input
                    value={t.tag}
                    onChange={(e) => updateCat(i, { tag: e.target.value })}
                    className={field}
                    placeholder="TRAVEL"
                  />
                </div>
                <div>
                  <label className={label}>Subtitle</label>
                  <input
                    value={t.subtitle}
                    onChange={(e) => updateCat(i, { subtitle: e.target.value })}
                    className={field}
                    placeholder="110 styles"
                  />
                </div>
                <div>
                  <label className={label}>Shop filter (category name)</label>
                  <input
                    value={t.categoryFilter}
                    onChange={(e) => updateCat(i, { categoryFilter: e.target.value })}
                    className={field}
                    placeholder="Travel Bags"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Image URL (optional)</label>
                  <input
                    value={t.imageUrl}
                    onChange={(e) => updateCat(i, { imageUrl: e.target.value })}
                    className={field}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="mb-1 font-display text-base font-bold">Bestsellers section</div>
        <p className="m-0 mb-4 text-[13px] text-muted">Homepage product strip below categories.</p>
        <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={bestsellersEnabled}
            onChange={(e) => setBestsellersEnabled(e.target.checked)}
            className="h-4 w-4 accent-cognac"
          />
          Show bestsellers section
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Section title</label>
            <input
              value={bestsellersTitle}
              onChange={(e) => setBestsellersTitle(e.target.value)}
              className={field}
              disabled={!bestsellersEnabled}
            />
          </div>
          <div>
            <label className={label}>Link label</label>
            <input
              value={bestsellersLinkLabel}
              onChange={(e) => setBestsellersLinkLabel(e.target.value)}
              className={field}
              disabled={!bestsellersEnabled}
            />
          </div>
          <div>
            <label className={label}>Link href</label>
            <input
              value={bestsellersLinkHref}
              onChange={(e) => setBestsellersLinkHref(e.target.value)}
              className={field}
              placeholder="/shop"
              disabled={!bestsellersEnabled}
            />
          </div>
          <div>
            <label className={label}>Products to show (1–24)</label>
            <input
              type="number"
              min={1}
              max={24}
              value={bestsellersLimit}
              onChange={(e) => setBestsellersLimit(Number(e.target.value) || 8)}
              className={field}
              disabled={!bestsellersEnabled}
            />
          </div>
        </div>
      </div>

      {(msg || err) && (
        <div className={`text-[13px] font-semibold ${err ? "text-danger" : "text-green"}`}>
          {err || msg}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="cursor-pointer rounded-[11px] border-none bg-cognac px-6 py-3 text-[14px] font-bold text-white hover:bg-cognac-dark disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
