import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="mx-auto max-w-[840px] px-4 pt-10 pb-[60px] sm:px-7">
      <div className="mb-2 font-mono text-[13px] text-muted2">Home / About</div>
      <h1 className="m-0 mb-3 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
        About Baxparrow
      </h1>
      <p className="m-0 mb-8 max-w-[560px] text-[15px] leading-relaxed text-muted">
        Manufacturer &amp; wholesaler of bags from Byculla, Mumbai. Built for schools, offices,
        travellers, and retailers who need bags that last.
      </p>

      <div className="mb-8 overflow-hidden rounded-[18px] bg-[linear-gradient(120deg,#241E19,#3A2D23)] px-6 py-10 text-bg sm:px-10">
        <span className="font-mono text-[11px] tracking-[.18em] text-tan">EST. MUMBAI · SINCE 2019</span>
        <h2 className="mt-3 mb-3 font-display text-[26px] font-extrabold tracking-[-.02em] sm:text-[30px]">
          Carry with confidence.
        </h2>
        <p className="m-0 max-w-[480px] text-[15px] leading-relaxed text-[#D8CFC5]">
          We design and manufacture school, office, travel, leather, and specialty bags in our own
          unit — retail for everyday carry, wholesale for teams that need volume and custom branding.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Own unit", "Made in Mumbai — manufacturing under our roof"],
          ["1,000+ styles", "School to suitcase, retail & bulk stock"],
          ["B2B ready", "MOQ 50 · custom branding · 24h quotes"],
        ].map(([t, s]) => (
          <div key={t} className="rounded-[14px] border border-border bg-card p-5">
            <div className="font-display text-[16px] font-bold text-ink">{t}</div>
            <div className="mt-1.5 text-[13px] leading-relaxed text-muted">{s}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 space-y-4 text-[15px] leading-relaxed text-text3">
        <h2 className="m-0 font-display text-[22px] font-bold tracking-[-.02em] text-ink">
          What we make
        </h2>
        <p className="m-0">
          School bags, office &amp; laptop bags, handbags, leather goods, sport bags, suitcases,
          beach bags, travel bags, wallets, and custom runs for institutions.
        </p>
        <p className="m-0">
          Every bag ships with a 1-year warranty mindset: materials and stitching checked before
          dispatch from Byculla. Free shipping on orders over ₹999; 7-day returns on retail orders.
        </p>
      </div>

      <div className="mb-8 rounded-[14px] border border-border bg-card p-6">
        <h2 className="m-0 mb-2 font-display text-[18px] font-bold text-ink">Visit &amp; wholesale</h2>
        <p className="m-0 mb-4 text-[14px] leading-relaxed text-muted">
          Showroom: 12/A, Byculla Industrial Estate, Mumbai 400011 — visits by appointment.
          Bulk quotes via{" "}
          <Link to="/contact" className="font-semibold">
            wholesale contact
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="inline-flex rounded-[11px] border-none bg-ink px-5 py-3 text-[14px] font-semibold text-bg no-underline hover:text-bg"
          >
            Shop the collection
          </Link>
          <Link
            to="/contact"
            className="inline-flex rounded-[11px] border border-border bg-white px-5 py-3 text-[14px] font-semibold text-ink no-underline hover:text-ink"
          >
            Request bulk quote
          </Link>
        </div>
      </div>
    </section>
  );
}
