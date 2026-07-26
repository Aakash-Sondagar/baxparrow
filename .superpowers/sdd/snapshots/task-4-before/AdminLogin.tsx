import { useState } from "react";
import { t } from "../../styles/tokens";
import { useAuth } from "../../features/auth/AuthContext";
export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@baxparrow.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const field = { width: "100%", marginTop: 6, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none" } as const;
  const submit = async (e: any) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await login(email, password); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Login failed"); setBusy(false); }
  };
  return (
    <div style={{ minHeight: "100vh", background: t.adminCanvas, display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: t.ink, color: t.tan, fontFamily: t.displayFont, fontWeight: 800, fontSize: 18, display: "grid", placeItems: "center" }}>B</span>
          <div><div style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 18 }}>Baxparrow</div><div style={{ fontFamily: t.monoFont, fontSize: 11, color: t.muted2 }}>ADMIN SIGN IN</div></div>
        </div>
        <label style={{ fontSize: 13, color: t.text3 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={field} />
        <label style={{ fontSize: 13, color: t.text3, display: "block", marginTop: 14 }}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={field} />
        {err && <div style={{ color: t.danger, fontSize: 13, marginTop: 12 }}>{err}</div>}
        <button disabled={busy} style={{ width: "100%", marginTop: 20, background: t.cognac, color: "#fff", border: "none", borderRadius: 11, padding: 14, fontWeight: 700, cursor: "pointer", opacity: busy ? .6 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>
        <p style={{ fontSize: 12, color: t.muted2, marginTop: 14, textAlign: "center" }}>Seeded dev login prefilled. Change in production.</p>
      </form>
    </div>
  );
}
