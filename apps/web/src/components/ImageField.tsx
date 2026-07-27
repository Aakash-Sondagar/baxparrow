import { useRef, useState } from "react";
import { uploadImage } from "../lib/cloudinary";

const field =
  "mt-1.5 w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-cognac";
const labelCls = "text-[12px] font-semibold text-muted";

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function ImageField({ value, onChange, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploadErr("");
    try {
      setUploading(true);
      const url = await uploadImage(file);
      onChange(url);
    } catch (e: any) {
      setUploadErr(e?.message ?? "Upload failed — is Cloudinary configured?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="sm:col-span-2">
      <label className={labelCls}>Image URL (optional)</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={field}
        placeholder="https://…"
        disabled={disabled}
      />
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-muted2">or</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-[9px] border border-border bg-admin-canvas px-3 py-2 text-[12px] font-semibold hover:bg-subtle disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload to Cloudinary"}
        </button>
        {value && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("")}
            className="cursor-pointer border-0 bg-transparent text-[12px] font-semibold text-danger disabled:opacity-60"
          >
            Clear
          </button>
        )}
      </div>
      {uploadErr && <div className="mt-1.5 text-[12px] text-danger">{uploadErr}</div>}
      {value && (
        <img
          src={value}
          alt=""
          className="mt-2.5 h-20 w-20 rounded-[9px] border border-border object-cover"
        />
      )}
    </div>
  );
}
