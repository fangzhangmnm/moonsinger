// lyric-font.ts —— 量歌词 / 名字宽度用的字体串（屏幕、PDF、排版 worker 三处必须是同一串，不然断行不同）。created 2026-10-21 by Claude Fable 5.1（排版进 worker）
//   全是系统字体、不含 Bravura（力度字的墨迹是 engrave 里的常数表）。2026-10-17 核过：同一串字体 OffscreenCanvas（worker）和主线程 canvas 量出来逐位相同（无头 Chromium）。
export const lyricFont = (px: number): string => `${px}px system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`;
/** 一把尺子：同一个 2D 上下文（canvas / OffscreenCanvas）上按这个字体量宽（只在字体变了时改 ctx.font）。 */
export function measurerOn(ctx: { font: string; measureText(s: string): { width: number } }, font: string): (s: string) => number {
  return (s) => { if (ctx.font !== font) ctx.font = font; return ctx.measureText(s).width; };
}
