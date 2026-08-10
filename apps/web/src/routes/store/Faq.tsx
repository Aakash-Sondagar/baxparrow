import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Where are Baxparrow bags made?",
    a: "In our own manufacturing unit in Byculla, Mumbai. We handle design, production, and dispatch from India.",
  },
  {
    q: "Do you offer wholesale / B2B orders?",
    a: "Yes. MOQ starts at 50 units per style. Custom branding and tiered pricing available. Quotes usually within 24 hours — use the Wholesale / Contact page.",
  },
  {
    q: "How long does shipping take?",
    a: "Most metro orders ship within 2–4 business days after payment. Free shipping on retail orders over ₹999. Full shipping policy page coming soon.",
  },
  {
    q: "What is your return policy?",
    a: "Retail orders: 7-day returns, no questions asked, on unused items in original condition. Wholesale returns follow the terms on your quote. Details on Returns (placeholder for now).",
  },
  {
    q: "Is there a warranty?",
    a: "Yes — 1-year warranty on manufacturing defects for bags sold through our store. Wear-and-tear and misuse are not covered. See Warranty for the full page (placeholder).",
  },
  {
    q: "Which payment methods do you accept?",
    a: "UPI, cards, and netbanking via Razorpay Checkout at payment time.",
  },
  {
    q: "Can I track my order?",
    a: "After checkout you get a confirmation with your order number. Use that link from your email / confirmation page to track status.",
  },
  {
    q: "How do I place a custom or school kit order?",
    a: "Email wholesale@baxparrow.example with styles, quantities, branding needs, and delivery city — or use Contact. We reply with a quote.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-10 pb-[60px] sm:px-7">
      <div className="mb-2 font-mono text-[13px] text-muted2">Home / FAQ</div>
      <h1 className="m-0 mb-2 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
        Frequently asked questions
      </h1>
      <p className="m-0 mb-8 max-w-[520px] text-[15px] leading-relaxed text-muted">
        Quick answers about Baxparrow retail, wholesale, shipping, and warranty.
      </p>

      <div className="flex flex-col gap-2.5">
        {FAQS.map((item, i) => {
          const on = open === i;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-[14px] border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpen(on ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-5 py-4 text-left"
              >
                <span className="font-display text-[15px] font-bold text-ink sm:text-base">
                  {item.q}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted2 transition-transform duration-200 ${
                    on ? "rotate-180" : ""
                  }`}
                />
              </button>
              {on && (
                <div className="border-t border-border px-5 py-4 text-[14px] leading-relaxed text-text3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-[14px] text-muted">
        Still stuck?{" "}
        <Link to="/contact" className="font-semibold">
          Contact us
        </Link>
        .
      </p>
    </section>
  );
}
