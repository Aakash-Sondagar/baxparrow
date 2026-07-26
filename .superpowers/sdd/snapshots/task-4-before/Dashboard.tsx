import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { t } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useMetrics, useAdminOrders } from "../../features/orders/adminHooks";

const badge = (s: string) => {
  const m: Record<string,[string,string]> = { delivered:[t.greenBg,t.green], shipped:["#E9EEF6","#3B6DB0"], processing:["#FBF1E5",t.amber], pending:["#F3EFEA",t.muted] };
  const [bg, fg] = m[s] ?? m.pending; return { background: bg, color: fg, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20 };
};
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : "";

export default function Dashboard() {
  const { data: m } = useMetrics();
  const { data: orders = [] } = useAdminOrders("All");

  const chartData = m?.chart && m.chart.length > 0 ? m.chart : [
    { day: "Mon", v: 0 }, { day: "Tue", v: 0 }, { day: "Wed", v: 0 },
    { day: "Thu", v: 0 }, { day: "Fri", v: 0 }, { day: "Sat", v: 0 }, { day: "Sun", v: 0 }
  ];

  const topCategories = m?.topCategories && m.topCategories.length > 0 ? m.topCategories : [];

  const stats: [string, string, string, string][] = [
    ["Revenue (30d)", m ? inr(m.revenue) : "₹0", m?.revenue ? "▲ Live Total" : "No sales yet", t.green],
    ["Orders", m ? String(m.orders) : "0", m?.orders ? "▲ Total orders" : "No orders yet", t.green],
    ["Products live", m ? String(m.products) : "0", `${m?.lowStock ?? 0} low stock`, t.amber],
    ["Avg order value", m ? inr(m.aov) : "₹0", "Average per order", t.cognac],
  ];

  const recent = orders.slice(0, 5);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 22 }}>
        {stats.map(([l, v, d, c]) => (
          <div key={l} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, color: t.muted, marginBottom: 10 }}>{l}</div>
            <div style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 26 }}>{v}</div>
            <div style={{ fontSize: 12.5, color: c, marginTop: 6, fontWeight: 600 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 22 }}>
        <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Revenue · last 7 days</div>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontFamily: "monospace", fontSize: 11, fill: t.muted2 }} />
                <Tooltip formatter={(value: any) => [inr(Number(value)), "Revenue"]} labelStyle={{ color: t.ink, fontWeight: 700 }} />
                <Bar dataKey="v" radius={[7, 7, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? t.cognac : "#E2C6A9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: t.displayFont, fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Top categories</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {topCategories.length === 0 && <div style={{ fontSize: 13, color: t.muted }}>No products categorized yet.</div>}
            {topCategories.map(({ name, pct }) => (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
                  <span style={{ color: t.text2, fontWeight: 600 }}>{name}</span>
                  <span style={{ fontFamily: t.monoFont, color: t.muted }}>{pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, background: "#F0EBE3", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: t.cognac, width: `${pct}%`, transition: "width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #F0EBE3", fontFamily: t.displayFont, fontWeight: 700, fontSize: 16 }}>Recent orders</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 600 }}>
            <thead>
              <tr style={{ textAlign: "left", color: t.muted2, fontFamily: t.monoFont, fontSize: 11 }}>
                {["ORDER", "CUSTOMER", "TOTAL", "STATUS", "DATE"].map(h => (
                  <th key={h} style={{ padding: "12px 22px", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: "center", color: t.muted }}>
                    No orders yet — they'll appear here after checkout.
                  </td>
                </tr>
              )}
              {recent.map((o: any) => (
                <tr key={o.orderNo} style={{ borderTop: "1px solid #F0EBE3" }}>
                  <td style={{ padding: "13px 22px", fontFamily: t.monoFont, color: t.cognac, fontWeight: 700 }}>{o.orderNo}</td>
                  <td style={{ padding: 13, fontWeight: 600 }}>{o.address?.firstName ?? "Guest"}</td>
                  <td style={{ padding: 13, fontFamily: t.monoFont }}>{inr(o.amounts?.total ?? 0)}</td>
                  <td style={{ padding: 13 }}><span style={badge(o.status)}>{cap(o.status)}</span></td>
                  <td style={{ padding: "13px 22px", color: t.muted }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
