// index.ts —— 简谱这一种（谱种表里的 jianpu）唯一的入口：谱种表（src/render/notations.ts）只从这里拿简谱的东西。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。形状和 staff/index.ts 一样：量 / 行首 / 歌词锚点 / 画 / 道的先后 / 几何纯函数。
export { measureJianpu, jianpuLineStart, jianpuLyricAnchors, type JianpuTrack, type JianpuMode } from "./measure.ts";
export { drawJianpu, kitLegendMin, type JianpuDrawCtx } from "./draw.ts";
export { jianpuCaretSpan, jianpuPreviewAt, jianpuBandTop, jianpuAnchors, jianpuGhost, jianpuXGhost, type JianpuRowData } from "./geometry.ts";
