type Props = {
  crumb: string;
  title: string;
  blurb: string;
};

/** Minimal placeholder for policy pages not written yet. */
export default function BlankPolicy({ crumb, title, blurb }: Props) {
  return (
    <section className="mx-auto max-w-[680px] px-4 pt-10 pb-[60px] sm:px-7">
      <div className="mb-2 font-mono text-[13px] text-muted2">Home / {crumb}</div>
      <h1 className="m-0 mb-3 font-display text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
        {title}
      </h1>
      <p className="m-0 text-[15px] leading-relaxed text-muted">{blurb}</p>
      <div className="mt-8 rounded-[14px] border border-dashed border-border bg-card px-6 py-12 text-center">
        <div className="font-mono text-[12px] tracking-wide text-muted2">CONTENT COMING SOON</div>
        <p className="m-0 mt-2 text-[14px] text-muted">This page is a placeholder.</p>
      </div>
    </section>
  );
}
