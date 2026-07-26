import { useNavigate, useParams } from "react-router-dom";
export default function Confirm() {
  const nav = useNavigate();
  const { no } = useParams();
  return (
    <section className="mx-auto max-w-[680px] px-4 pt-14 pb-[70px] text-center sm:px-7">
      <div className="mx-auto mb-[22px] grid h-[72px] w-[72px] place-items-center rounded-full bg-green-bg text-[36px] text-green">✓</div>
      <h1 className="m-0 mb-2.5 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">Order confirmed!</h1>
      <p className="m-0 mb-1.5 text-base text-muted">Thank you — we've emailed your confirmation and receipt.</p>
      <p className="m-0 mb-[30px] font-mono text-sm text-cognac">Order #{no}</p>
      <div className="mb-5 rounded-[15px] border border-border bg-card p-6 text-left">
        {[["Estimated delivery","21–23 July 2026"],["Shipping via","Shiprocket · Surface"],["Paid","₹3,436"]].map(([k, v], i) =>
          <div key={k} className={`flex justify-between gap-3 ${i < 2 ? "mb-3.5" : "mb-0"}`}><span className="text-sm text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>)}
      </div>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={() => nav("/order/" + no + "/track")} className="cursor-pointer rounded-[11px] border-none bg-ink px-[26px] py-3.5 font-semibold text-bg">Track order</button>
        <button onClick={() => nav("/")} className="cursor-pointer rounded-[11px] border border-border bg-white px-[26px] py-3.5 font-semibold">Continue shopping</button>
      </div>
    </section>
  );
}
