import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordSchema } from "@baxparrow/shared";
import { useAuth } from "../../features/auth/AuthContext";

const fieldOk =
  "mt-1.5 w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-cognac";
const fieldBad =
  "mt-1.5 w-full rounded-[10px] border border-danger px-3.5 py-3 text-sm outline-none focus:border-danger";
const label = "text-[13px] text-text3";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const nav = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErr, setFieldErr] = useState<{ password?: string; confirm?: string }>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <Shell
        card={
          <div className="w-full max-w-[400px] rounded-[15px] border border-border bg-card p-5 sm:p-7 text-center">
            <div className="mb-1.5 font-display text-[17px] font-bold text-ink">Invalid reset link</div>
            <p className="m-0 mb-5 text-[13.5px] text-muted">
              This reset link is missing or malformed. Request a new one to continue.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block rounded-[11px] border-none bg-cognac px-5 py-2.5 text-[13.5px] font-bold text-white"
            >
              Request new link
            </Link>
          </div>
        }
      />
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setFieldErr({ confirm: "Passwords don’t match" });
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setFieldErr({ password: parsed.error.issues[0]?.message ?? "Invalid password" });
      return;
    }
    setFieldErr({});
    setBusy(true);
    try {
      await resetPassword(token, parsed.data.password);
      nav("/account", { replace: true });
    } catch (ex: any) {
      setErr(ex?.response?.data?.error ?? "Could not reset password. The link may have expired.");
      setBusy(false);
    }
  };

  return (
    <Shell
      card={
        <form noValidate onSubmit={submit} className="w-full max-w-[400px] rounded-[15px] border border-border bg-card p-5 sm:p-7">
          <div className="mb-3.5">
            <label className={label}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.slice(0, 72));
                if (fieldErr.password) setFieldErr((f) => ({ ...f, password: undefined }));
                if (err) setErr("");
              }}
              autoComplete="new-password"
              maxLength={72}
              className={fieldErr.password ? fieldBad : fieldOk}
            />
            {fieldErr.password ? (
              <div className="mt-1 text-[12px] text-danger">{fieldErr.password}</div>
            ) : (
              <p className="m-0 mt-1.5 text-[12px] text-muted2">At least 6 characters</p>
            )}
          </div>
          <div>
            <label className={label}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value.slice(0, 72));
                if (fieldErr.confirm) setFieldErr((f) => ({ ...f, confirm: undefined }));
                if (err) setErr("");
              }}
              autoComplete="new-password"
              maxLength={72}
              className={fieldErr.confirm ? fieldBad : fieldOk}
            />
            {fieldErr.confirm && <div className="mt-1 text-[12px] text-danger">{fieldErr.confirm}</div>}
          </div>
          {err && <div className="mt-3 text-[13px] text-danger">{err}</div>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full cursor-pointer rounded-[11px] border-none bg-cognac p-3.5 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Reset password"}
          </button>
        </form>
      }
    />
  );
}

function Shell({ card }: { card: React.ReactNode }) {
  return (
    <section className="mx-auto flex max-w-[1100px] flex-col items-center px-4 pt-10 pb-[70px] sm:px-7">
      <h1 className="m-0 mb-2 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[32px]">
        Set a new password
      </h1>
      <p className="m-0 mb-7 text-center text-sm text-muted2">Choose a new password for your account</p>
      {card}
    </section>
  );
}
