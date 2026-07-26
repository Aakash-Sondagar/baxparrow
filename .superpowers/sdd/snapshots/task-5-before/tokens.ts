/** Product placeholder gradients — not expressible as static Tailwind utilities. */
export const tile = (n: number) => {
  const pal = [
    ["#E7D8C6", "#DFCCB5"],
    ["#DDE2E0", "#D2D8D6"],
    ["#EEE0CE", "#E6D5BF"],
    ["#E7CDB6", "#DDBFA3"],
    ["#DDE6DD", "#D0DBCF"],
    ["#DBDEE6", "#CED3DE"],
    ["#F0E6CC", "#EADCB8"],
    ["#DEDCD8", "#D3D0CB"],
    ["#EEDCDA", "#E5CDCB"],
  ];
  const [a, b] = pal[n % pal.length];
  return `repeating-linear-gradient(135deg,${a},${a} 12px,${b} 12px,${b} 24px)`;
};

/** @deprecated Remove after Tailwind migration completes */
export const t = {
  bg: "var(--color-bg)",
  canvas: "var(--color-canvas)",
  adminCanvas: "var(--color-admin-canvas)",
  ink: "var(--color-ink)",
  cognac: "var(--color-cognac)",
  cognacDark: "var(--color-cognac-dark)",
  tan: "var(--color-tan)",
  card: "var(--color-card)",
  border: "var(--color-border)",
  subtle: "var(--color-subtle)",
  text: "var(--color-text)",
  text2: "var(--color-text2)",
  text3: "var(--color-text3)",
  muted: "var(--color-muted)",
  muted2: "var(--color-muted2)",
  green: "var(--color-green)",
  greenBg: "var(--color-green-bg)",
  amber: "var(--color-amber)",
  danger: "var(--color-danger)",
  displayFont: "var(--font-display)",
  bodyFont: "var(--font-body)",
  monoFont: "var(--font-mono)",
};
