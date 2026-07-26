/** Format INR. Prefer body/display fonts when rendering — Space Mono lacks ₹. */
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/** Number only (no currency symbol) for mono tables */
export const inrNum = (n: number) => n.toLocaleString("en-IN");
