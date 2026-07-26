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
