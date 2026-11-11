// notation.ts —— 时值记法：一个时值拆成五线谱能记的几段（附点、连音）+ 一段平常占多宽。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出，内容没改）
import { TPQ, WHOLE } from "../../score/song.ts";

export const MIN_PLAIN = TPQ / 8;
export const NOTATABLE: { ticks: number; base: number; dotted: boolean }[] = [];
for (let b = WHOLE; b >= MIN_PLAIN; b /= 2) { NOTATABLE.push({ ticks: b * 1.5, base: b, dotted: true }, { ticks: b, base: b, dotted: false }); }
NOTATABLE.sort((a, b) => b.ticks - a.ticks);
/** 把一个（写出来的）时值拆成能记的几段（贪心取最大的；段之间画连音线）。 */
export function splitDur(dur: number): { base: number; dotted: boolean; ticks: number }[] {
  const out: { base: number; dotted: boolean; ticks: number }[] = [];
  let left = dur;
  while (left > 0) {
    const n = NOTATABLE.find((v) => v.ticks <= left && (v.dotted ? v.base >= MIN_PLAIN * 2 : true));
    if (!n) { out.push({ base: MIN_PLAIN, dotted: false, ticks: left }); break; }
    out.push(n); left -= n.ticks;
  }
  return out;
}
/** 连音：n 个占 m 个（照 song.ts TUPLET）。时值不是三十二分的整数倍时，找一个比例让「写出来的时值」能记。 */
export const RATIOS: [number, number][] = [[3, 2], [5, 4], [6, 4], [7, 4]];
export function notate(dur: number): { ratio: [number, number] | null; chunks: { base: number; dotted: boolean; ticks: number }[] } {
  if (dur % MIN_PLAIN === 0) return { ratio: null, chunks: splitDur(dur) };
  for (const [n, m] of RATIOS) {
    const written = (dur * n) / m;
    if (Number.isInteger(written) && written % MIN_PLAIN === 0) return { ratio: [n, m], chunks: splitDur(written).map((c) => ({ ...c, ticks: (c.ticks * m) / n })) };
  }
  return { ratio: null, chunks: [{ base: MIN_PLAIN, dotted: false, ticks: dur }] };
}
export const baseWidth = (base: number) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));   // 四分 3.6，每翻倍 +0.75（2026-10-07 收紧一点：原 4.0 / +0.8，SE2 一行放不下一小节八分）
