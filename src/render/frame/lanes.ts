// lanes.ts —— 贴挂件的「道」（框架；施工单第五节裁定 3）：道按记号的种类命名，先后顺序是每个谱种的参数。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-6b；原来是 engrave() 里按编号的 later[2..12]）。
//   画法先画音符层，再往道上登记挂件（「画法分两次交」）；框架按这种谱给的先后一道一道执行（每一样贴天际线，贴完天际线跟着长），最后定行距。
export type LaneKind =
  | "strength"       // 强度一组（重音 / 强音 / 次重音 / 弱化）
  | "noteDynamics"   // 音的修饰：音内起伏、突强、强后即弱
  | "dynamics"       // 力度：力度字、渐强渐弱、cresc. 字、渐到
  | "ottavaAbove"    // 八度线（8va / 15ma，谱上方）
  | "nav"            // 反复跳转：房子、Segno / Coda、D.C.…、「×3」
  | "tempo"          // 速度
  | "groove"         // 风格（拍子轻重）
  | "barNumber"      // 小节号
  | "chordTag"       // 和弦级数
  | "lyrics"         // 歌词
  | "ottavaBelow";   // 八度线（8vb，谱下方）
/** 播放的小节底色只盖到这一道为止（含）：反复跳转算这一行的墨，速度 / 风格这些整张谱的不算（v0.10.26）。 */
export const INK_UP_TO: LaneKind = "nav";
