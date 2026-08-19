import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { MAX_PRODUCT_IMAGES, youtubeVideoId } from "@baxparrow/shared";
import { uploadImage } from "../../lib/cloudinary";
import { createProduct, fetchAdminProduct, updateProduct } from "../../features/products/mutations";
import { api } from "../../lib/api";

const field =
  "mt-1.5 w-full rounded-[10px] border border-border bg-bg px-3.5 py-3 text-sm outline-none focus:border-cognac";
const label = "text-[13px] font-semibold text-text3";
const card = "rounded-[14px] border border-border bg-card p-6";
const h = "mb-[18px] font-display text-base font-bold";

type Variant = {
  color: string;
  sku: string;
  price: string;
  mrp: string;
  stock: string;
  images: string[];
  youtubeUrl: string;
};

function emptyVariant(partial?: Partial<Variant>): Variant {
  return {
    color: "",
    sku: "",
    price: "",
    mrp: "",
    stock: "0",
    images: [],
    youtubeUrl: "",
    ...partial,
  };
}

function ChipEditor({
  values,
  onChange,
  placeholder,
  hint,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  hint: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v) || values.length >= 12) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-admin-canvas px-2.5 py-1 text-[12px] font-semibold"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="cursor-pointer border-0 bg-transparent p-0 text-muted2 hover:text-danger"
              aria-label={`Remove ${v}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={field + " mt-0"}
        />
        <button
          type="button"
          onClick={add}
          className="mt-0 shrink-0 cursor-pointer rounded-[10px] border border-border bg-admin-canvas px-3 text-[13px] font-semibold"
        >
          Add
        </button>
      </div>
      <p className="mt-1.5 m-0 text-[11px] text-muted2">{hint}</p>
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ vi: number; replaceAt: number | null }>({
    vi: 0,
    replaceAt: null,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Office Bags",
    status: "draft",
  });
  const [variants, setVariants] = useState<Variant[]>([emptyVariant()]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(!isEdit);

  const { data: catsData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get("/admin/categories")).data as { items: { name: string }[] },
  });
  const categories = catsData?.items?.map((c) => c.name) ?? [
    "Office Bags",
    "School Bags",
    "Handbags",
    "Leather Bags",
    "Sport Bags",
    "Suitcases",
    "Beach Bags",
    "Travel Bags",
    "Wallets",
  ];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchAdminProduct(id);
        if (cancelled) return;
        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          category: p.category ?? "Office Bags",
          status: p.status ?? "draft",
        });
        setSizes(p.sizes ?? []);
        if (Array.isArray(p.variants) && p.variants.length) {
          setVariants(
            p.variants.map((v: any) =>
              emptyVariant({
                color: v.color ?? "",
                sku: v.sku ?? "",
                price: String(v.price ?? ""),
                mrp: String(v.mrp ?? ""),
                stock: String(v.stock ?? 0),
                images: (v.images ?? []).slice(0, MAX_PRODUCT_IMAGES),
                youtubeUrl: v.youtubeUrl ?? p.youtubeUrl ?? "",
              })
            )
          );
        } else {
          // Legacy product → one colour variant from top-level fields
          const color = p.colors?.[0] || "Default";
          setVariants([
            emptyVariant({
              color,
              sku: p.sku ?? "",
              price: String(p.price ?? ""),
              mrp: String(p.mrp ?? ""),
              stock: String(p.stock ?? 0),
              images: (p.images ?? []).slice(0, MAX_PRODUCT_IMAGES),
              youtubeUrl: p.youtubeUrl ?? "",
            }),
          ]);
        }
        setLoaded(true);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.response?.data?.error ?? "Failed to load product");
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const patchVariant = (i: number, patch: Partial<Variant>) => {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };

  const setVariantSku = (i: number, raw: string) => {
    const sku = raw.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    patchVariant(i, { sku });
  };

  const addVariant = () => {
    if (variants.length >= 12) return;
    setVariants((v) => [...v, emptyVariant()]);
  };

  const removeVariant = (i: number) => {
    setVariants((v) => (v.length <= 1 ? v : v.filter((_, idx) => idx !== i)));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    const { vi, replaceAt } = uploadTarget.current;
    uploadTarget.current.replaceAt = null;

    try {
      setUploading(true);
      const current = variants[vi]?.images ?? [];
      if (replaceAt != null && files[0]) {
        const url = await uploadImage(files[0]);
        patchVariant(vi, {
          images: current.map((u, i) => (i === replaceAt ? url : u)),
        });
        return;
      }
      const room = MAX_PRODUCT_IMAGES - current.length;
      if (room <= 0) {
        setErr(`Max ${MAX_PRODUCT_IMAGES} images per colour`);
        return;
      }
      const picked = [...files].slice(0, room);
      const urls = await Promise.all(picked.map(uploadImage));
      patchVariant(vi, {
        images: [...current, ...urls].slice(0, MAX_PRODUCT_IMAGES),
      });
      if (files.length > room) {
        setErr(`Only ${room} more image(s) allowed (max ${MAX_PRODUCT_IMAGES})`);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed — is Cloudinary configured?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setErr("");
    if (!variants.length) {
      setErr("Add at least one colour variant");
      return;
    }
    for (const v of variants) {
      if (!v.color.trim()) {
        setErr("Each colour variant needs a colour name");
        return;
      }
      if (!v.sku.trim()) {
        setErr(`SKU required for colour "${v.color}"`);
        return;
      }
    }
    const skus = variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      setErr("Colour SKUs must be unique");
      return;
    }

    setBusy(true);
    const normalized = variants.map((v) => ({
      color: v.color.trim(),
      sku: v.sku.trim().toUpperCase(),
      price: Number(v.price) || 0,
      mrp: Number(v.mrp) || 0,
      stock: Number(v.stock || 0),
      images: v.images.slice(0, MAX_PRODUCT_IMAGES),
      youtubeUrl: v.youtubeUrl.trim(),
    }));
    const primary = normalized[0];
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      sku: primary.sku,
      price: primary.price,
      mrp: primary.mrp,
      stock: normalized.reduce((a, v) => a + v.stock, 0),
      images: primary.images,
      colors: normalized.map((v) => v.color),
      sizes,
      variants: normalized,
      status: form.status,
    };
    try {
      if (isEdit && id) await updateProduct(id, body);
      else await createProduct(body);
      nav("/admin/products");
    } catch (e: any) {
      setErr(
        e?.response?.data?.error ??
          (e?.response?.data?.details ? "Validation failed" : "Save failed")
      );
      setBusy(false);
    }
  };

  if (!loaded) {
    return <div className="text-sm text-muted">Loading product…</div>;
  }

  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        className="hidden"
      />

      <div className={card}>
        <div className={h}>Product details</div>
        <div className="flex flex-col gap-4">
          <div>
            <label className={label}>Product name</label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. XYZ Office Bag"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              placeholder="Materials, dimensions, features…"
              className={`${field} resize-y`}
            />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className={label}>Category</label>
              <select value={form.category} onChange={set("category")} className={field}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Sizes (shared)</label>
              <ChipEditor
                values={sizes}
                onChange={setSizes}
                placeholder="S, M, L…"
                hint="Optional. Same sizes for every colour."
              />
            </div>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-base font-bold">Colour variants</div>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Each colour gets own SKU, price, stock, images, and YouTube video.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            disabled={variants.length >= 12}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-border bg-admin-canvas px-3 py-2 text-[13px] font-semibold disabled:opacity-50"
          >
            <Plus size={15} /> Add colour
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {variants.map((v, vi) => (
            <div key={vi} className="rounded-[12px] border border-border bg-admin-canvas p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-muted2">
                  COLOUR {vi + 1}
                  {vi === 0 ? " · PRIMARY (listing)" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(vi)}
                  disabled={variants.length <= 1}
                  className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[12px] font-semibold text-danger disabled:opacity-40"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Colour</label>
                  <input
                    value={v.color}
                    onChange={(e) => patchVariant(vi, { color: e.target.value })}
                    placeholder="Red / #C41E3A / Black"
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>SKU</label>
                  <input
                    value={v.sku}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setVariantSku(vi, e.target.value)
                    }
                    placeholder="BX-OFF-RED"
                    className={`${field} font-mono uppercase`}
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className={label}>Selling price (₹)</label>
                  <input
                    value={v.price}
                    onChange={(e) => patchVariant(vi, { price: e.target.value })}
                    placeholder="1499"
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <label className={label}>MRP (₹)</label>
                  <input
                    value={v.mrp}
                    onChange={(e) => patchVariant(vi, { mrp: e.target.value })}
                    placeholder="2199"
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <label className={label}>Stock</label>
                  <input
                    value={v.stock}
                    onChange={(e) => patchVariant(vi, { stock: e.target.value })}
                    placeholder="40"
                    className={`${field} font-mono`}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className={label}>YouTube video (optional)</label>
                <input
                  value={v.youtubeUrl}
                  onChange={(e) => patchVariant(vi, { youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
                  className={field}
                />
                {youtubeVideoId(v.youtubeUrl) && (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeVideoId(v.youtubeUrl)}/mqdefault.jpg`}
                    alt=""
                    className="mt-2 h-16 w-28 rounded-[8px] object-cover"
                  />
                )}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <label className={label}>Images</label>
                  <span className="font-mono text-[11px] text-muted2">
                    {v.images.length}/{MAX_PRODUCT_IMAGES}
                  </span>
                </div>
                {v.images.length < MAX_PRODUCT_IMAGES && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      uploadTarget.current = { vi, replaceAt: null };
                      fileRef.current?.click();
                    }}
                    className="mb-2 flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#D6CFC4] bg-[#FBFAF7] px-4 py-5 text-center text-[13px] text-muted disabled:opacity-60"
                  >
                    {uploading ? "Uploading…" : "Upload images for this colour"}
                  </button>
                )}
                {v.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {v.images.map((u, ii) => (
                      <div
                        key={`${u}-${ii}`}
                        className="group relative aspect-square overflow-hidden rounded-[9px]"
                      >
                        <img src={u} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-black/55 to-transparent p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              uploadTarget.current = { vi, replaceAt: ii };
                              fileRef.current?.click();
                            }}
                            className="inline-flex cursor-pointer items-center rounded-md border-0 bg-white/95 px-1 py-0.5 text-[10px] font-bold"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchVariant(vi, {
                                images: v.images.filter((_, j) => j !== ii),
                              })
                            }
                            className="inline-flex cursor-pointer items-center rounded-md border-0 bg-white/95 px-1 py-0.5 text-[10px] font-bold text-danger"
                          >
                            <X size={10} />
                          </button>
                        </div>
                        {ii === 0 && (
                          <span className="absolute top-1 left-1 rounded bg-ink/80 px-1 py-0.5 font-mono text-[8px] font-bold text-white">
                            MAIN
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className={`${h} mb-3`}>Status</div>
        <div className="flex gap-2">
          {["active", "draft"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: s }))}
              className={`flex-1 cursor-pointer rounded-[9px] p-2.5 text-[13px] font-semibold capitalize ${
                form.status === s
                  ? "border-none bg-ink text-white"
                  : "border border-border bg-card text-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="text-[13px] text-danger">{err}</div>}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => nav("/admin/products")}
          className="flex-1 cursor-pointer rounded-[11px] border border-border bg-card p-3.5 font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || uploading}
          onClick={save}
          className="flex-[2] cursor-pointer rounded-[11px] border-none bg-cognac p-3.5 font-bold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Save product"}
        </button>
      </div>
    </div>
  );
}
