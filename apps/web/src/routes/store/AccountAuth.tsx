import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { loginSchema, registerSchema } from "@baxparrow/shared";
import { useAuth } from "../../features/auth/AuthContext";

const fieldOk =
  "mt-1.5 w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-cognac";
const fieldBad =
  "mt-1.5 w-full rounded-[10px] border border-danger px-3.5 py-3 text-sm outline-none focus:border-danger";
const label = "text-[13px] text-text3";

type Mode = "login" | "signup";
type FieldKey = "name" | "email" | "password";

export default function AccountAuth({ embedded }: { embedded?: boolean }) {
  const { login, register, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next") || "/account";
  const initial: Mode =
    loc.pathname.includes("signup") || params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<Mode>(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErr, setFieldErr] = useState<Partial<Record<FieldKey, string>>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && !embedded) return <Navigate to="/account" replace />;

  const clearField = (k: FieldKey) => {
    if (fieldErr[k]) setFieldErr((fe) => ({ ...fe, [k]: undefined }));
    if (err) setErr("");
  };

  const validateLocal = () => {
    const parsed =
      mode === "signup"
        ? registerSchema.safeParse({ name, email, password })
        : loginSchema.safeParse({ email, password });
    if (parsed.success) {
      setFieldErr({});
      return parsed.data;
    }
    const nextErr: Partial<Record<FieldKey, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as FieldKey | undefined;
      if (key && !nextErr[key]) nextErr[key] = issue.message;
    }
    setFieldErr(nextErr);
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const data = validateLocal();
    if (!data) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const d = data as { name: string; email: string; password: string };
        await register(d.name, d.email, d.password);
      } else {
        const d = data as { email: string; password: string };
        await login(d.email, d.password);
      }
      nav(next, { replace: true });
    } catch (ex: any) {
      const fields = ex?.response?.data?.fields as Record<string, string> | undefined;
      if (fields) {
        const nextErr: Partial<Record<FieldKey, string>> = {};
        for (const k of ["name", "email", "password"] as const) {
          if (fields[k]) nextErr[k] = fields[k];
        }
        if (Object.keys(nextErr).length) setFieldErr(nextErr);
      }
      setErr(ex?.response?.data?.error ?? (mode === "signup" ? "Sign up failed" : "Login failed"));
      setBusy(false);
    }
  };

  const cls = (k: FieldKey) => (fieldErr[k] ? fieldBad : fieldOk);

  const form = (
    <form
      noValidate
      onSubmit={submit}
      className={
        embedded ? "" : "w-full max-w-[400px] rounded-[15px] border border-border bg-card p-5 sm:p-7"
      }
    >
      <div className="mb-5 flex rounded-[10px] border border-border bg-subtle p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setErr("");
              setFieldErr({});
            }}
            className={`flex-1 cursor-pointer rounded-[8px] border-0 py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-card text-ink shadow-sm" : "bg-transparent text-muted2"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      <p className="m-0 mb-4 text-[13px] text-muted2">
        {mode === "login"
          ? "See your orders in one place."
          : "Create account — past guest orders with this email attach automatically."}
      </p>
      {mode === "signup" && (
        <div className="mb-3.5">
          <label className={label}>Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value.slice(0, 80));
              clearField("name");
            }}
            autoComplete="name"
            maxLength={80}
            className={cls("name")}
          />
          {fieldErr.name && <div className="mt-1 text-[12px] text-danger">{fieldErr.name}</div>}
        </div>
      )}
      <div className="mb-3.5">
        <label className={label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value.replace(/\s/g, "").slice(0, 100));
            clearField("email");
          }}
          autoComplete="email"
          maxLength={100}
          className={cls("email")}
        />
        {fieldErr.email && <div className="mt-1 text-[12px] text-danger">{fieldErr.email}</div>}
      </div>
      <div>
        <label className={label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value.slice(0, 72));
            clearField("password");
          }}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          maxLength={72}
          className={cls("password")}
        />
        {fieldErr.password && (
          <div className="mt-1 text-[12px] text-danger">{fieldErr.password}</div>
        )}
        {mode === "signup" && !fieldErr.password && (
          <p className="m-0 mt-1.5 text-[12px] text-muted2">At least 6 characters</p>
        )}
      </div>
      {err && <div className="mt-3 text-[13px] text-danger">{err}</div>}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full cursor-pointer rounded-[11px] border-none bg-cognac p-3.5 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      {!embedded && (
        <p className="mt-4 text-center text-[13px] text-muted2">
          <Link to="/shop" className="text-cognac">
            Continue shopping
          </Link>
        </p>
      )}
    </form>
  );

  if (embedded) return form;

  return (
    <section className="mx-auto flex max-w-[1100px] flex-col items-center px-4 pt-10 pb-[70px] sm:px-7">
      <h1 className="m-0 mb-2 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[32px]">
        Your account
      </h1>
      <p className="m-0 mb-7 text-center text-sm text-muted2">Log in or sign up to track orders</p>
      {form}
    </section>
  );
}
