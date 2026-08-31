import { api } from "./api";
// Signs via our API, then uploads the file straight to Cloudinary. Returns the secure URL.
// signPath defaults to the admin route; customers pass "/uploads/sign" (returns folder).
export async function uploadImage(file: File, signPath = "/admin/uploads/sign"): Promise<string> {
  const { data: sig } = await api.post(signPath);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const json = await res.json();
  return json.secure_url as string;
}
