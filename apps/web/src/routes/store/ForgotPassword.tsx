import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "@baxparrow/shared";
import { api } from "../../lib/api";

const fieldOk =
  "mt-1.5 w-full rounded-[10px] border border-border px-3.5 py-3 text-sm outline-none focus:border-cognac";
const fieldBad =
  "mt-1.5 w-full rounded-[10px] border border-danger px-3.5 py-3 text-sm outline-none focus:border-danger";
const label = "text-[13px] text-text3";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailErr(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    setEmailErr("");
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email: parsed.data.email });
      setSent(true);
    } catch (ex: any) {
      setErr(ex?.response?.data?.error ?? "Could not send reset link. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  const card = (
    <div className="w-full max-w-[400px] rounded-[15px] border border-border bg-card p-5 sm:p-7">
      {sent ? (
        <>
          <div className="mb-1.5 font-display text-[17px] font-bold text-ink">Check your inbox</div>
          <p className="m-0 mb-5 text-[13.5px] leading-relaxed text-muted">
            If an account exists for <span className="font-semibold text-ink">{email}</span>, a reset
            link is on its way. The link expires in 1 hour.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-[11px] border border-border bg-card px-5 py-2.5 text-center text-[13.5px] font-semibold text-ink"
          >
            Back to log in
          </Link>
        </>
      ) : (
        <form noValidate onSubmit={submit}>
          <p className="m-0 mb-4 text-[13px] text-muted2">
            Enter your email and we’ll send you a link to reset your password.
          </p>
          <div className="mb-3.5">
            <label className={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.replace(/\s/g, "").slice(0, 100));
                if (emailErr) setEmailErr("");
                if (err) setErr("");
              }}
              autoComplete="email"
              maxLength={100}
              className={emailErr ? fieldBad : fieldOk}
            />
            {emailErr && <div className="mt-1 text-[12px] text-danger">{emailErr}</div>}
          </div>
          {err && <div className="mt-1 text-[13px] text-danger">{err}</div>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full cursor-pointer rounded-[11px] border-none bg-cognac p-3.5 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <p className="mt-4 text-center text-[13px] text-muted2">
            Remembered it? <Link to="/login" className="font-semibold text-cognac">Log in</Link>
          </p>
        </form>
      )}
    </div>
  );

  return (
    <section className="mx-auto flex max-w-[1100px] flex-col items-center px-4 pt-10 pb-[70px] sm:px-7">
      <h1 className="m-0 mb-2 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[32px]">
        Forgot password
      </h1>
      <p className="m-0 mb-7 text-center text-sm text-muted2">Reset your Baxparrow password</p>
      {card}
    </section>
  );
}
