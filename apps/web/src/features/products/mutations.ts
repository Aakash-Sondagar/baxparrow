import { api } from "../../lib/api";
export async function createProduct(body: any) {
  return (await api.post("/admin/products", body)).data;
}
export async function fetchAdminProduct(id: string) {
  return (await api.get(`/admin/products/${id}`)).data;
}
export async function updateProduct(id: string, body: any) {
  return (await api.patch(`/admin/products/${id}`, body)).data;
}
export async function deleteProduct(id: string) {
  await api.delete(`/admin/products/${id}`);
}
export async function bulkImport(file: File) {
  const form = new FormData();
  form.append("file", file);
  return (await api.post("/admin/products/bulk", form)).data as { imported: number; errors: any[] };
}
