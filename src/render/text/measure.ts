// text/measure.ts —— 量字：一把尺子。created 2026-11-09 by Claude Opus 5.5（计划书 ai-docs/20261109-plan-text-engine.md 第 2 步；原 src/render/lyric-font.ts 的字体串 + 量宽搬进来）
//   以前：宿主给一个「按歌词字号量」的函数，排版器 13 处各自写换算（÷ 线间距 ÷ 字的尺子 × 这种字的字号），写法互相不一样。
//   现在：宿主只给原始尺子（这串字、歌词那款字、px 那么大 = 多宽 px），换算全在 width() 里；排版器只问「这种字写这串多宽（sp）」。
//   现状照旧（行为不变）：每种字都按歌词那款字、歌词字号量，再按字号比例放大缩小——歌名之类加粗的字调用方另外多算一点（歌名 8%）。
//   换成每种字按自己的字体量 = 版面会动，不在这一轮。
import { LYRIC_EM, LYRIC_LOOK, TEXT_FACES, TEXT_STYLES, type TextRole } from "./style.ts";

/** 宿主给的原始尺子：这串字写成歌词那款字（TEXT_FACES.lyric）、px 那么大，多宽（px）。屏幕 / worker = canvas 的 measureText（canvasMeasure）；PDF = 字体自己的字宽；测试 = 假尺子。 */
export type RawMeasure = (s: string, px: number) => number;
/** 排版器看到的尺子：这种字（role）在这个线间距（sp，px）/ 字的尺子（ts，紧凑档 1.4）下写这串多宽——单位 sp（线间距）。 */
export interface TextMeasure {
  width(role: TextRole, s: string, sp: number, ts: number): number;
  /** 这串字写成 px 那么大多宽（px）——已经有字号的图元（天际线算墨迹用）。 */
  widthPx(s: string, px: number, sp: number, ts: number): number;
}

/** 一次排版一把（同样的字只量一次；缓存跟着这把尺子活，下一次排版宿主再建一把——字体中途变了不会用到旧数）。 */
export function createTextMeasure(raw: RawMeasure): TextMeasure {
  const byPx = new Map<number, Map<string, number>>();
  const at = (s: string, px: number) => {
    let m = byPx.get(px); if (!m) byPx.set(px, (m = new Map()));
    let v = m.get(s); if (v === undefined) m.set(s, (v = raw(s, px)));
    return v;
  };
  return {
    width(role, s, sp, ts) {
      const st = TEXT_STYLES[role];
      // 原始尺子按歌词字号 × ts 量（每种字同一个 px，量一次谁都能用）：除回 sp，再按这种字的字号、这种字的尺子放大
      return ((at(s, LYRIC_EM * sp * ts) * st.em) / LYRIC_EM / sp / ts) * (st.ruler === "text" ? ts : 1);
    },
    widthPx(s, px, sp, ts) { const ref = LYRIC_EM * sp * ts; return (at(s, ref) * px) / ref; },
  };
}

/** 歌词那款字的 CSS 字体串（屏幕、PDF 预览、排版 worker 三处同一串，不然断行不同；2026-10-17 核过 OffscreenCanvas 和主线程 canvas 量出来逐位相同，无头 Chromium）。 */
export const lyricFont = (px: number): string => `${px}px ${TEXT_FACES.lyric}`;
/** canvas（或 OffscreenCanvas）上的原始尺子：按 px 换字体（只在变了时改 ctx.font）。 */
export function canvasMeasure(ctx: { font: string; measureText(s: string): { width: number } }): RawMeasure {
  return (s, px) => { const f = lyricFont(px); if (ctx.font !== f) ctx.font = f; return ctx.measureText(s).width; };
}

/** 这一档的歌词：字号倍数 k（字高，永远不动）+ 平常的宽度 sx（v0.16.44；表 = style.ts LYRIC_LOOK）。ts > 1 = 紧凑档。 */
export const lyricLook = (ts: number) => (ts > 1 ? LYRIC_LOOK.compact : LYRIC_LOOK.cozy);
/** 这一档歌词平常写出来这串多宽（sp）：这一档的字号、平常的宽度（还没让路）。 */
export const lyricWidth = (m: TextMeasure, s: string, sp: number, ts: number): number => m.width("lyric", s, sp, ts) * lyricLook(ts).k * lyricLook(ts).sx;
/** 这一档歌词的字号（px）。 */
export const lyricSizePx = (sp: number, ts: number): number => LYRIC_EM * lyricLook(ts).k * sp;
