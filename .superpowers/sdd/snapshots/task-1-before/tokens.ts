export const t = {
  bg: "#F7F4EF",
  canvas: "#EDE8E0",
  adminCanvas: "#F4F1EC",
  ink: "#1C1917",
  cognac: "#A94D28",
  cognacDark: "#8F3F20",
  tan: "#E8B58C",
  card: "#FFFFFF",
  border: "#E7E2D9",
  subtle: "#FAF7F2",
  text: "#292524",
  text2: "#44403C",
  text3: "#57534E",
  muted: "#78716C",
  muted2: "#A8A29E",
  green: "#3F7D5B",
  greenBg: "#EAF3ED",
  amber: "#B4772A",
  danger: "#B4523A",
  displayFont: "'Archivo', sans-serif",
  bodyFont: "'Instrument Sans', system-ui, sans-serif",
  monoFont: "'Space Mono', monospace",
};

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
    ["#EEDCDA", "#E5CDCB"]
  ];
  const [a, b] = pal[n % pal.length];
  return `repeating-linear-gradient(135deg,${a},${a} 12px,${b} 12px,${b} 24px)`;
};
