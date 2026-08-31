import { useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const field = "mt-1.5 w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none";
  const submit = async (e: any) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await login(email, password); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Login failed"); setBusy(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-admin-canvas px-4">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-ink font-display text-lg font-extrabold text-tan">B</span>
          <div><div className="font-display text-lg font-extrabold">Baxparrow</div><div className="font-mono text-[11px] text-muted2">ADMIN SIGN IN</div></div>
        </div>
        <label className="text-[13px] text-text3">Email</label>
        <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className={field} />
        <label className="mt-3.5 block text-[13px] text-text3">Password</label>
        <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={field} />
        {err && <div className="mt-3 text-[13px] text-danger">{err}</div>}
        <button disabled={busy} className="mt-5 w-full cursor-pointer rounded-[11px] border-none bg-cognac p-3.5 font-bold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
