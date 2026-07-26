import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
export function useAdminOrders(status: string) {
  return useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => (await api.get("/admin/orders", { params: status === "All" ? {} : { status } })).data as any[],
  });
}
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ no, status }: { no: string; status: string }) =>
      (await api.patch(`/admin/orders/${no}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
}
export type MetricsData = {
  revenue: number;
  orders: number;
  products: number;
  lowStock?: number;
  aov: number;
  chart?: { day: string; v: number }[];
  topCategories?: { name: string; pct: number }[];
};
export function useMetrics() {
  return useQuery<MetricsData>({ queryKey: ["metrics"], retry: false,
    queryFn: async () => (await api.get("/admin/metrics")).data });
}
