import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, X } from "lucide-react";
import { MAX_PRODUCT_IMAGES } from "@baxparrow/shared";
import { uploadImage } from "../../lib/cloudinary";
import { createProduct, fetchAdminProduct, updateProduct } from "../../features/products/mutations";
import { api } from "../../lib/api";

const field =
  "mt-1.5 w-full rounded-[10px] border border-border bg-bg px-3.5 py-3 text-sm outline-none focus:border-cognac";
const label = "text-[13px] font-semibold text-text3";
const card = "rounded-[14px] border border-border bg-card p-6";
const h = "mb-[18px] font-display text-base font-bold";

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
            {/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) && (
              <span
                className="inline-block h-3 w-3 rounded-full border border-border"
                style={{ background: v }}
              />
            )}
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
  const replaceIdx = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Office Bags",
    sku: "",
    price: "",
    mrp: "",
    stock: "",
    status: "draft",
  });
  const [images, setImages] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
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
          sku: p.sku ?? "",
          price: String(p.price ?? ""),
          mrp: String(p.mrp ?? ""),
          stock: String(p.stock ?? 0),
          status: p.status ?? "draft",
        });
        setImages((p.images ?? []).slice(0, MAX_PRODUCT_IMAGES));
        setColors(p.colors ?? []);
        setSizes(p.sizes ?? []);
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

  const setSku = (e: ChangeEvent<HTMLInputElement>) => {
    const sku = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    setForm((f) => ({ ...f, sku }));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    const replaceAt = replaceIdx.current;
    replaceIdx.current = null;

    try {
      setUploading(true);
      if (replaceAt != null && files[0]) {
        const url = await uploadImage(files[0]);
        setImages((prev) => prev.map((u, i) => (i === replaceAt ? url : u)));
        return;
      }
      const room = MAX_PRODUCT_IMAGES - images.length;
      if (room <= 0) {
        setErr(`Max ${MAX_PRODUCT_IMAGES} images per product`);
        return;
      }
      const picked = [...files].slice(0, room);
      const urls = await Promise.all(picked.map(uploadImage));
      setImages((p) => [...p, ...urls].slice(0, MAX_PRODUCT_IMAGES));
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

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const replaceImage = (i: number) => {
    replaceIdx.current = i;
    fileRef.current?.click();
  };

  const save = async () => {
    setErr("");
    setBusy(true);
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      sku: form.sku,
      price: Number(form.price),
      mrp: Number(form.mrp),
      stock: Number(form.stock || 0),
      images: images.slice(0, MAX_PRODUCT_IMAGES),
      colors,
      sizes,
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

  const canAddMore = images.length < MAX_PRODUCT_IMAGES;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-[18px]">
        <div className={card}>
          <div className={h}>Product details</div>
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>Product name</label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Cortez Messenger Bag"
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
                <label className={label}>SKU</label>
                <input
                  value={form.sku}
                  onChange={setSku}
                  placeholder="BX-OFF-014"
                  className={`${field} font-mono uppercase`}
                  disabled={isEdit}
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <p className="mt-1.5 m-0 text-[11px] text-muted2">
                  Uppercase A–Z, 0–9, - and _ only
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className={card}>
          <div className={h}>Pricing &amp; inventory</div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label className={label}>Selling price (₹)</label>
              <input
                value={form.price}
                onChange={set("price")}
                placeholder="1499"
                className={`${field} font-mono`}
              />
              <p className="mt-1.5 m-0 text-[11px] text-muted2">What customer pays</p>
            </div>
            <div>
              <label className={label}>MRP (₹)</label>
              <input
                value={form.mrp}
                onChange={set("mrp")}
                placeholder="2199"
                className={`${field} font-mono`}
              />
              <p className="mt-1.5 m-0 text-[11px] text-muted2">List / strike-through price</p>
            </div>
            <div>
              <label className={label}>Stock</label>
              <input
                value={form.stock}
                onChange={set("stock")}
                placeholder="120"
                className={`${field} font-mono`}
              />
            </div>
          </div>
        </div>
        <div className={card}>
          <div className={h}>Variants</div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={label}>Colours</label>
              <ChipEditor
                values={colors}
                onChange={setColors}
                placeholder="#3A2D23 or Brown"
                hint="Hex or name. Empty = hidden on store."
              />
            </div>
            <div>
              <label className={label}>Sizes</label>
              <ChipEditor
                values={sizes}
                onChange={setSizes}
                placeholder="S, M, L…"
                hint="Empty = size picker hidden on store."
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[18px]">
        <div className={card}>
          <div className={`${h} mb-1 flex items-baseline justify-between`}>
            <span>Images</span>
            <span className="font-mono text-[11px] font-normal text-muted2">
              {images.length}/{MAX_PRODUCT_IMAGES}
            </span>
          </div>
          <p className="m-0 mb-3 text-[12px] text-muted2">
            Max {MAX_PRODUCT_IMAGES} images. Replace or delete from thumbnails.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="hidden"
          />
          {canAddMore ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                replaceIdx.current = null;
                fileRef.current?.click();
              }}
              className="flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#D6CFC4] bg-[#FBFAF7] p-8 text-center disabled:opacity-60"
            >
              <div className="mb-2 text-[26px] text-muted2">⇪</div>
              <div className="text-[13px] text-muted">
                {uploading ? (
                  "Uploading…"
                ) : (
                  <>
                    Drag images or <span className="font-semibold text-cognac">browse</span>
                  </>
                )}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted2">Uploaded to Cloudinary</div>
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-admin-canvas px-4 py-3 text-center text-[13px] text-muted">
              Image limit reached ({MAX_PRODUCT_IMAGES}). Delete one to add another.
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((u, i) => (
                <div key={`${u}-${i}`} className="group relative aspect-square overflow-hidden rounded-[9px]">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => replaceImage(i)}
                      className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border-0 bg-white/95 px-1.5 py-1 text-[10px] font-bold text-ink"
                      title="Replace"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border-0 bg-white/95 px-1.5 py-1 text-[10px] font-bold text-danger"
                      title="Delete"
                    >
                      <X size={11} /> Del
                    </button>
                  </div>
                  {i === 0 && (
                    <span className="absolute top-1 left-1 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                      MAIN
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={card}>
          <div className={`${h} mb-3`}>Status</div>
          <div className="flex gap-2">
            {["active", "draft"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`flex-1 cursor-pointer rounded-[9px] p-2.5 text-[13px] font-semibold capitalize transition-colors duration-200 ${
                  form.status === s
                    ? "border-none bg-ink text-white"
                    : "border border-border bg-card text-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2.5 m-0 text-[12px] text-muted2">
            Active = live on store. Draft = hidden from shoppers.
          </p>
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
    </div>
  );
}
