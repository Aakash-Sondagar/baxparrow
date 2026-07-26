import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export type ProductListParams = {
  q?: string;
  category?: string;
  status?: string;
  page?: string;
  limit?: string;
  sort?: string;
  min?: string;
  max?: string;
};

export function useProducts(
  params: ProductListParams = {},
  opts?: { enabled?: boolean }
) {
  return useQuery({
    enabled: opts?.enabled ?? true,
    queryKey: ["products", params],
    queryFn: async () =>
      (await api.get("/products", { params })).data as {
        items: any[];
        total: number;
        page: number;
        pages: number;
      },
  });
}

/** Admin catalog — all statuses, regex search on name/sku/category */
export function useAdminProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () =>
      (await api.get("/admin/products", { params })).data as {
        items: any[];
        total: number;
        page: number;
        pages: number;
      },
  });
}

export function useProduct(slug?: string) {
  return useQuery({
    enabled: !!slug,
    queryKey: ["product", slug],
    queryFn: async () => (await api.get("/products/" + slug)).data,
  });
}
