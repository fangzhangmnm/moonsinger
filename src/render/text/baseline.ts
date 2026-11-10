// text/baseline.ts —— 字的上下沿 / 基线：一处定义。created 2026-11-09 by Claude Opus 5.5（计划书 ai-docs/20261109-plan-text-engine.md 第 3 步；量真上下沿那段原在 src/ui/score-overlay.ts）
//   约定（排版器 / 屏幕 / PDF 三处一样）：排版器给的字图元，y = 基线。
//   · SVG 的 <text> 和 PDF 的字本来就按基线画——不换算（PDF 选了拼音字体时歌词整行往下让，是另一件事：score-pdf lyricRaiseOf，按字体的墨迹顶量）；
//   · 覆盖层（HTML 的 div：「1=C」、占位提示字）要把基线换成盒子的顶——boxTopFor，用这款字真的上下沿（faceMetrics）；
//   · 排版器（天际线算字的墨迹）不量真字体，用估的上下沿 INK_EST——node 里也能算，屏幕和 PDF 排出来一样。
import { textFont, type TextStyle } from "./style.ts";

/** 上沿 a / 下沿 d：离基线多远，字号的倍数。 */
export interface FaceMetrics { a: number; d: number }
/** 排版器估的字的墨迹上下沿（天际线用；行为照旧 = 刀 4 起的那对数）。 */
export const INK_EST: FaceMetrics = { a: 0.8, d: 0.22 };

const metricCache = new Map<string, FaceMetrics>();
let mctx: CanvasRenderingContext2D | null | undefined;
/** 这款字真的上沿 / 下沿 = canvas 的 fontBoundingBox（浏览器排一行字用的那一对数；按字体 / 粗细 / 斜体各量一次）。量不到（node、老浏览器）= 0.8 / 0.2（= 原来按「基线约在 0.8 字号」估的那个位置）。 */
export function faceMetrics(st: TextStyle): FaceMetrics {
  const key = `${st.face}|${st.weight}|${st.italic}`;
  let m = metricCache.get(key);
  if (m) return m;
  m = { a: 0.8, d: 0.2 };
  try {
    mctx ??= typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
    if (mctx) { mctx.font = textFont(st, 100); const t = mctx.measureText("1=C"); if (t.fontBoundingBoxAscent > 0) m = { a: t.fontBoundingBoxAscent / 100, d: t.fontBoundingBoxDescent / 100 }; }
  } catch { /* 量不到就用估的 */ }
  metricCache.set(key, m);
  return m;
}
/** HTML 盒子（行高 = 字号 px）的顶放哪，里面那行字的基线才落在 base 上（CSS 行内排版：基线离盒顶 = (行高 + 上沿 − 下沿) / 2）。 */
export const boxTopFor = (base: number, px: number, m: FaceMetrics): number => base - (px * (1 + m.a - m.d)) / 2;
