import { Mail, MapPin, Phone, Clock } from "lucide-react";

const DETAILS = [
  {
    icon: Phone,
    label: "Phone",
    value: "+91 98765 43210",
    hint: "Mon–Sat, 10am–6pm IST",
  },
  {
    icon: Mail,
    label: "Email",
    value: "wholesale@baxparrow.example",
    hint: "Quotes within 24 hours",
  },
  {
    icon: MapPin,
    label: "Showroom",
    value: "12/A, Byculla Industrial Estate, Mumbai 400011",
    hint: "Visits by appointment",
  },
  {
    icon: Clock,
    label: "Bulk MOQ",
    value: "50 units per style",
    hint: "Custom branding available",
  },
] as const;

export default function Contact() {
  return (
    <section className="mx-auto max-w-[840px] px-4 pt-10 pb-[60px] sm:px-7">
      <div className="mb-2 font-mono text-[13px] text-muted2">Home / Contact</div>
      <h1 className="m-0 mb-2 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
        Wholesale &amp; contact
      </h1>
      <p className="m-0 mb-8 max-w-[540px] text-[15px] leading-relaxed text-muted">
        Dummy contact page for now. Reach us for bulk quotes, school kits, or custom branding.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {DETAILS.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="rounded-[14px] border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-cognac">
              <Icon size={18} />
              <span className="text-[12px] font-bold tracking-wide uppercase">{label}</span>
            </div>
            <div className="font-display text-[17px] font-bold text-ink">{value}</div>
            <div className="mt-1 text-[13px] text-muted">{hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[16px] border border-border bg-[#F6ECE4] px-6 py-5">
        <div className="font-display text-base font-bold text-ink">Request a bulk quote</div>
        <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">
          Email <b className="text-ink">wholesale@baxparrow.example</b> with styles, quantity, and
          delivery city. Form coming later — this page is placeholder data only.
        </p>
      </div>
    </section>
  );
}
