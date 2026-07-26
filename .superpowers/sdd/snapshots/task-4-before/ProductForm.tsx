import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "../../styles/tokens";
import { uploadImage } from "../../lib/cloudinary";
import { createProduct } from "../../features/products/mutations";
const field = { width: "100%", marginTop: 6, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none" } as const;
const label = { fontSize: 13, color: t.text3, fontWeight: 600 } as const;
const card = { background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 } as const;
const h = { fontFamily: t.displayFont, fontWeight: 700, fontSize: 16, marginBottom: 18 } as const;
export default function ProductForm() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", category: "Office Bags", sku: "", price: "", mrp: "", stock: "", status: "active" });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    try { const urls = await Promise.all([...files].map(uploadImage)); setImages(p => [...p, ...urls]); }
    catch (e: any) { setErr(e?.message ?? "Upload failed — is Cloudinary configured?"); }
  };
  const save = async () => {
    setErr(""); setBusy(true);
    try {
      await createProduct({
        name: form.name, description: form.description, category: form.category, sku: form.sku,
        price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock || 0),
        images, status: form.status,
      });
      nav("/admin/products");
    } catch (e: any) { setErr(e?.response?.data?.error ?? "Save failed"); setBusy(false); }
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={card}>
          <div style={h}>Product details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><label style={label}>Product name</label><input value={form.name} onChange={set("name")} placeholder="e.g. Cortez Messenger Bag" style={field} /></div>
            <div><label style={label}>Description</label><textarea value={form.description} onChange={set("description")} rows={4} placeholder="Materials, dimensions, features…" style={{ ...field, resize: "vertical" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={label}>Category</label><select value={form.category} onChange={set("category")} style={field}><option>Office Bags</option><option>School Bags</option><option>Handbags</option><option>Leather Bags</option><option>Sport Bags</option><option>Suitcases</option><option>Beach Bags</option><option>Travel Bags</option><option>Wallets</option></select></div>
              <div><label style={label}>SKU</label><input value={form.sku} onChange={set("sku")} placeholder="BX-OFF-014" style={{ ...field, fontFamily: t.monoFont }} /></div>
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={h}>Pricing &amp; inventory</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div><label style={label}>Price (₹)</label><input value={form.price} onChange={set("price")} placeholder="1499" style={{ ...field, fontFamily: t.monoFont }} /></div>
            <div><label style={label}>MRP (₹)</label><input value={form.mrp} onChange={set("mrp")} placeholder="2199" style={{ ...field, fontFamily: t.monoFont }} /></div>
            <div><label style={label}>Stock</label><input value={form.stock} onChange={set("stock")} placeholder="120" style={{ ...field, fontFamily: t.monoFont }} /></div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={card}>
          <div style={{ ...h, marginBottom: 14 }}>Images</div>
          <label style={{ border: "2px dashed #D6CFC4", borderRadius: 12, padding: 32, textAlign: "center", background: "#FBFAF7", display: "block", cursor: "pointer" }}>
            <input type="file" accept="image/*" multiple onChange={e => onFiles(e.target.files)} style={{ display: "none" }} />
            <div style={{ fontSize: 26, marginBottom: 8, color: t.muted2 }}>⇪</div>
            <div style={{ fontSize: 13, color: t.muted }}>Drag images or <span style={{ color: t.cognac, fontWeight: 600 }}>browse</span></div>
            <div style={{ fontSize: 11, color: t.muted2, marginTop: 4, fontFamily: t.monoFont }}>Uploaded to Cloudinary</div>
          </label>
          {images.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
            {images.map(u => <img key={u} src={u} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 9 }} />)}
          </div>}
        </div>
        <div style={card}>
          <div style={{ ...h, marginBottom: 12 }}>Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["active","draft"].map(s => <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))} style={{ flex: 1, background: form.status === s ? t.ink : "#fff", color: form.status === s ? "#fff" : t.muted, border: form.status === s ? "none" : `1px solid ${t.border}`, borderRadius: 9, padding: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{s}</button>)}
          </div>
        </div>
        {err && <div style={{ color: t.danger, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => nav("/admin/products")} style={{ flex: 1, background: "#fff", border: `1px solid ${t.border}`, borderRadius: 11, padding: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={busy} onClick={save} style={{ flex: 2, background: t.cognac, color: "#fff", border: "none", borderRadius: 11, padding: 13, fontWeight: 700, cursor: "pointer", opacity: busy ? .6 : 1 }}>{busy ? "Saving…" : "Save product"}</button>
        </div>
      </div>
    </div>
  );
}
