import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { inr } from "../../lib/format";
import { useMetrics, useAdminOrders } from "../../features/orders/adminHooks";

const badge = (s: string) => {
  const m: Record<string, string> = {
    delivered: "bg-green-bg text-green",
    shipped: "bg-[#E9EEF6] text-[#3B6DB0]",
    processing: "bg-[#FBF1E5] text-amber",
    pending: "bg-[#F3EFEA] text-muted",
  };
  return `text-xs font-bold px-[11px] py-1 rounded-full ${m[s] ?? m.pending}`;
};
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : "";

export default function Dashboard() {
  const { data: m } = useMetrics();
  const { data: orderList } = useAdminOrders("All");
  const orders = orderList?.items ?? [];

  const chartData = m?.chart && m.chart.length > 0 ? m.chart : [
    { day: "Mon", v: 0 }, { day: "Tue", v: 0 }, { day: "Wed", v: 0 },
    { day: "Thu", v: 0 }, { day: "Fri", v: 0 }, { day: "Sat", v: 0 }, { day: "Sun", v: 0 }
  ];

  const topCategories = m?.topCategories && m.topCategories.length > 0 ? m.topCategories : [];

  const stats: [string, string, string, string][] = [
    ["Revenue (30d)", m ? inr(m.revenue) : "₹0", m?.revenue ? "▲ Live Total" : "No sales yet", "text-green"],
    ["Orders", m ? String(m.orders) : "0", m?.orders ? "▲ Total orders" : "No orders yet", "text-green"],
    ["Products live", m ? String(m.products) : "0", `${m?.lowStock ?? 0} low stock`, "text-amber"],
    ["Avg order value", m ? inr(m.aov) : "₹0", "Average per order", "text-cognac"],
  ];

  const recent = orders.slice(0, 5);

  return (
    <>
      <div className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {stats.map(([l, v, d, c]) => (
          <div key={l} className="rounded-[14px] border border-border bg-card p-5">
            <div className="mb-2.5 text-[13px] text-muted">{l}</div>
            <div className="font-display text-[26px] font-extrabold">{v}</div>
            <div className={`mt-1.5 text-[12.5px] font-semibold ${c}`}>{d}</div>
          </div>
        ))}
      </div>

      <div className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <div className="rounded-[14px] border border-border bg-card p-[22px]">
          <div className="mb-5 font-display text-base font-bold">Revenue · last 7 days</div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontFamily: "monospace", fontSize: 11, fill: "#A8A29E" }} />
                <Tooltip formatter={(value: any) => [inr(Number(value)), "Revenue"]} labelStyle={{ color: "#1C1917", fontWeight: 700 }} />
                <Bar dataKey="v" radius={[7, 7, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? "#A94D28" : "#E2C6A9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[14px] border border-border bg-card p-[22px]">
          <div className="mb-[18px] font-display text-base font-bold">Top categories</div>
          <div className="flex flex-col gap-4">
            {topCategories.length === 0 && <div className="text-[13px] text-muted">No products categorized yet.</div>}
            {topCategories.map(({ name, pct }) => (
              <div key={name}>
                <div className="mb-1.5 flex justify-between text-[13.5px]">
                  <span className="font-semibold text-text2">{name}</span>
                  <span className="font-mono text-muted">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-[5px] bg-[#F0EBE3]">
                  <div className="h-full bg-cognac transition-[width] duration-[400ms] ease-in-out" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="border-b border-b-[#F0EBE3] px-[22px] py-[18px] font-display text-base font-bold">Recent orders</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left font-mono text-[11px] text-muted2">
                {["ORDER", "CUSTOMER", "TOTAL", "STATUS", "DATE"].map(h => (
                  <th key={h} className="px-[22px] py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-muted">
                    No orders yet — they'll appear here after checkout.
                  </td>
                </tr>
              )}
              {recent.map((o: any) => (
                <tr key={o.orderNo} className="border-t border-t-[#F0EBE3]">
                  <td className="px-[22px] py-[13px] font-mono font-bold text-cognac">{o.orderNo}</td>
                  <td className="p-[13px] font-semibold">{o.address?.firstName ?? "Guest"}</td>
                  <td className="p-[13px] font-body tabular-nums">{inr(o.amounts?.total ?? 0)}</td>
                  <td className="p-[13px]"><span className={badge(o.status)}>{cap(o.status)}</span></td>
                  <td className="px-[22px] py-[13px] text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
