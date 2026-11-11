// glyphs.ts —— 五线谱这一种行的字形表和五线的位置（d = 第几级：第五线 38、中线 34、第一线 30）。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出，内容没改）
import { TEXT_STYLES } from "../text/index.ts";
import { ENGRAVE } from "../smufl.ts";
import type { Art, Dyn } from "../../score/song.ts";

export const TOP_LINE = 38;   // 五线谱最上面那条线的 d（geometry.ts 的 yAt / dAt 要它）
export const MID_LINE = 34, BOTTOM_LINE = 30;
// 修的字形（SMuFL；宽 / 高 = staff space，浏览器里量的 Bravura：重音 1.36 × 0.99、跳音点 0.28、保持线 1.35 × 0.17）。Above 的从基线往上长，Below 的往下长
export const ART_GLYPH: Record<Exclude<Art, "breath" | "sfz" | "fp" | "ghost" | "whisper" | "swellUp" | "swellDown" | "swellBoth" | "arpeggio" | "roll">, { above: string; below: string; w: number; h: number }> = {
  stress: { above: "\u{E4B6}", below: "\u{E4B7}", w: 1.0, h: 1.0 },     // 次重音（2026-10-08 深夜；宽高 = canvas 量的 Bravura 墨迹）
  unstress: { above: "\u{E4B8}", below: "\u{E4B9}", w: 1.6, h: 0.9 },   // 弱化
  accent: { above: "\u{E4A0}", below: "\u{E4A1}", w: 1.36, h: 0.99 },
  marcato: { above: "\u{E4AC}", below: "\u{E4AD}", w: 1.0, h: 1.08 },   // 强音（2026-10-08；宽按同字号和重音比着量的）
  staccato: { above: "\u{E4A2}", below: "\u{E4A3}", w: 0.28, h: 0.28 },
  tenuto: { above: "\u{E4A4}", below: "\u{E4A5}", w: 1.35, h: 0.17 },
};
export const GLYPH_BREATH = "\u{E4CE}";   // breathMarkComma
export const DYN_GLYPH: Record<Dyn, string> = { ppp: "\u{E52A}", pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}", fff: "\u{E530}" };     // F5 / B4 / E4 的五线谱位置
/** 力度字的墨迹（sp，相对字的原点：左、右、基线以上、基线以下）：浏览器里 canvas measureText 量的 Bravura（2026-10-08 Opus 5.5；此前估的宽度小了一截，渐强渐弱压到字上）。
 *  渐强渐弱和两头的字之间留 PIN_GAP；点击区域按它。 */
export const DYN_INK: Record<string, [number, number, number, number]> = { ppp: [-0.4, 4.3, 1.1, 0.6], fff: [-0.6, 3.4, 1.8, 0.6], pp: [-0.4, 3, 1.1, 0.6], p: [-0.4, 1.5, 1.1, 0.6], mp: [-0.1, 3.3, 1.1, 0.6], mf: [-0.1, 3.3, 1.7, 0.7], f: [-0.6, 1.5, 1.8, 0.6], ff: [-0.6, 2.5, 1.8, 0.6] };
export const PIN_GAP = 0.7;
/** 渐强渐弱比一整行还长 = 不画发夹，写「cresc. - - -」/「dim. - - -」（user 2026-10-08「如果一个超级长的<号不要让它太awkward」；
 *  记谱的老规矩：长的渐变用文字加虚线，发夹留给短的）。字号 / 大概字宽（sp）、虚线一节多长 / 隔多远。 */
export const PIN_WORD = { size: TEXT_STYLES["dyn-word"].em, w: { cresc: 4.7, dim: 3.5 } } as const, DASH = { len: 0.6, gap: 1.0 } as const;
export const RAMP_DASH = { len: 0.5, gap: 0.4 } as const;   // 渐到发夹的虚线（sp；原 CSS 4px / 3px 在默认缩放下差不多）
export const SHARP_POS = [38, 35, 39, 36, 33, 37, 34], FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
export const GLYPH_TUPLET = (n: number) => [...String(n)].map((d) => String.fromCodePoint(0xe880 + Number(d))).join("");

/** 一行里几条谱左边连着的那根竖线多粗（线间距；框架画，粗细归这种谱）。 */
