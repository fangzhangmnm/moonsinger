// scheduler.ts —— 慢引擎的块该按什么顺序算（纯函数）：播放头所在的那块先、然后往后按距离、循环时绕回循环头；已经有的不算。
// created 2026-10-09 by Claude Fable 5.1（提案 §7；user「实时播放的时候到时候让fable可以预提前算然后用cache invalid之类的」「第一句好了就开播 嗯」）。
// 借朗读库的做法：一次只给 worker 一块（排多了用户一跳就全作废）；seek / 改谱 = 换顺序，正在算的那块算完照样进缓存（键对就不浪费）。

export interface SchedChunk { key: string; t0: number; dur: number; /** 唱的最后一个音在哪一秒结束（t0 + dur 还含收尾的余音）。 */ end?: number }
/** 从某一段放（起点提前了一点）：唱完在起点 quiet 之前的块这次不放（v0.10.3；user 2026-10-10「为什么从sheet C播放的时候会带前一个音，也不知道是sheet B的还是stop的时候没弄干净」）——排队别把它排在前面、开播别等它。 */
export const mutedAt = (c: SchedChunk, quiet: number): boolean => c.end !== undefined && c.end <= quiet;

/** 从 pos 起该算的顺序（键，去重）。loop = 循环区（到尾绕回 from）；没有 = 后面的算完再算前面的（往回 seek 也有）。 */
export function chunkOrder(chunks: readonly SchedChunk[], pos: number, loop: { from: number; to: number } | null, has: (key: string) => boolean, quiet = -Infinity): string[] {
  const seen = new Set<string>(), out: string[] = [];
  const add = (c: SchedChunk) => { if (!seen.has(c.key)) { seen.add(c.key); if (!has(c.key)) out.push(c.key); } };
  const sorted = [...chunks].sort((a, b) => a.t0 - b.t0);
  for (const c of sorted) if (c.t0 <= pos && c.t0 + c.dur > pos && !mutedAt(c, quiet)) add(c);   // 正站在上面的（这次不放的不算）
  for (const c of sorted) if (c.t0 > pos && (!loop || c.t0 < loop.to)) add(c);               // 后面的（循环区内）
  if (loop) for (const c of sorted) if (c.t0 >= loop.from && c.t0 <= pos) add(c);            // 绕回去：循环头到播放头
  for (const c of sorted) add(c);                                                             // 剩下的（范围外 / 前面的）
  return out;
}
/** 预卷：从 pos 起的前 n 块（站在上面的 + 后面的）都到齐了没有。 */
export function readyToStart(chunks: readonly SchedChunk[], pos: number, n: number, has: (key: string) => boolean, quiet = -Infinity): boolean {
  const sorted = [...chunks].sort((a, b) => a.t0 - b.t0), need: string[] = [];
  for (const c of sorted) if (c.t0 + c.dur > pos && !mutedAt(c, quiet) && need.length < n && !need.includes(c.key)) need.push(c.key);
  return need.every(has);
}
/** 预卷几块：按这台设备的速度（算一秒歌要多少毫秒；没量过 = 保守）——比实时快很多 = 2 块就开，慢 = 多攒几块。 */
export function prerollCount(msPerSongSec: number | null): number {
  if (msPerSongSec === null) return 2;
  return msPerSongSec < 400 ? 2 : msPerSongSec < 900 ? 3 : 4;
}
