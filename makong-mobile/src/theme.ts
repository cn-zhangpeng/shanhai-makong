/**
 * 山海设计 tokens：宣纸 × 墨色 × 朱砂 × 鎏金。
 * 与鸿蒙版保持一致的色值，移动端换算为 points / dp。
 */

export const C = {
  pageTop: "#F9F6F0",
  pageBottom: "#F4EFE4",
  page: "#F7F4EE",
  surface: "#FFFFFF",
  surfaceAlt: "#F1EDE5",
  border: "#E6DDCD",
  borderLight: "#EFE8DB",
  divider: "#EBE4D7",
  ink: "#26211B",
  brand: "#A83E2C",
  brandDark: "#8C3021",
  brandSoft: "#F8EAE5",
  brandLine: "#ECCFC8",
  gold: "#B8894F",
  goldSoft: "#F4EBDC",
  text: "#221E19",
  text2: "#5C5449",
  text3: "#8F8677",
  danger: "#C23A32",
  dangerSoft: "#FBE9E7",
  cream: "#FFF8EF",
} as const;

export const R = { sm: 10, md: 14, lg: 18, xl: 24 } as const;
export const PAD = 18;

export const paperGradient = `linear-gradient(180deg, ${C.pageTop} 0%, ${C.pageBottom} 100%)`;
export const inkGradient = "linear-gradient(150deg, #332B23 0%, #1D1814 100%)";

export const cardShadow = "0 4px 16px rgba(58, 44, 28, 0.06)";
export const floatShadow = "0 10px 26px rgba(58, 44, 28, 0.14)";
export const sealShadow = "0 5px 14px rgba(168, 62, 44, 0.28)";
export const fabShadow = "0 8px 20px rgba(168, 62, 44, 0.35)";

/** 返回一个小号字距标签样式（用于 SHANHAI · 码 控）。 */
export function tinyBrand(): { fontSize: number; letterSpacing: number; color: string; fontWeight: "600" } {
  return { fontSize: 9, letterSpacing: 2.4, color: C.gold, fontWeight: "600" };
}
