// perf-trace.ts —— 热路径的秒表：span(name, fn) 记最近几十次耗时，`__moonsinger.perf()` 读。created 2026-10-17 by Claude Fable 5.1
//   给「按键 → 出声 / 上屏」这条路分账用（ai-docs/20261017-input-latency-probe.md）：先量后优。常数开销（两次 performance.now + 一个数组写），常驻不碍事。

const KEEP = 64;
const spans = new Map<string, number[]>();

export function span<T>(name: string, fn: () => T): T {
  const t = performance.now();
  try { return fn(); } finally { record(name, performance.now() - t); }
}
export function record(name: string, ms: number): void {
  let a = spans.get(name); if (!a) { a = []; spans.set(name, a); }
  a.push(ms); if (a.length > KEEP) a.shift();
}
export interface PerfRow { n: number; med: number; max: number; last: number }
/** 每个名字最近 KEEP 次的 中位 / 最大 / 最后一次（ms，保留一位小数）。 */
export function perfReport(): Record<string, PerfRow> {
  const out: Record<string, PerfRow> = {};
  for (const [k, a] of spans) { const s = [...a].sort((x, y) => x - y); out[k] = { n: a.length, med: r1(s[s.length >> 1]), max: r1(s[s.length - 1]), last: r1(a[a.length - 1]) }; }
  return out;
}
export function perfReset(): void { spans.clear(); }
const r1 = (x: number): number => Math.round(x * 10) / 10;
