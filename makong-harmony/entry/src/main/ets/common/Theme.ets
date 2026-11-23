/**
 * 山海设计 tokens：宣纸 × 墨色 × 朱砂 × 鎏金。
 *
 * 与「山海」系列其他鸿蒙端保持一致：
 * 暖白纸底、白卡浮于纸面（1px 发丝边 + 极淡阴影）、大圆角、墨色三阶文字，
 * 朱砂只给主操作与当前态，金色只做点缀。
 */

// ---- 投影 ----
export const CARD_SHADOW: ShadowOptions = {
  radius: 16,
  color: 'rgba(58, 44, 28, 0.06)',
  offsetX: 0,
  offsetY: 4
}

export const FLOAT_SHADOW: ShadowOptions = {
  radius: 22,
  color: 'rgba(58, 44, 28, 0.10)',
  offsetX: 0,
  offsetY: 6
}

export const SEAL_SHADOW: ShadowOptions = {
  radius: 14,
  color: 'rgba(168, 62, 44, 0.30)',
  offsetX: 0,
  offsetY: 5
}

// ---- 渐变 ----
/** 墨色卡片：续卷横幅等深色块 */
export const INK_GRADIENT: LinearGradient = {
  angle: 150,
  colors: [['#332B23', 0], ['#1D1814', 1]]
}

/** 纸面轻微渐变，避免大片纯色显得平 */
export const PAPER_GRADIENT: LinearGradient = {
  angle: 180,
  colors: [['#F9F6F0', 0], ['#F4EFE4', 1]]
}

// ---- 圆角 ----
export const R_SM: number = 10
export const R_MD: number = 14
export const R_LG: number = 18
export const R_XL: number = 24
export const R_PILL: number = 999

// ---- 间距 ----
export const PAD: number = 16
export const HEAD_TOP: number = 14
export const CARD_GAP: number = 12
