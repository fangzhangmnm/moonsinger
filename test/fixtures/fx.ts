// 测试用的效果格（16-4 A2）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   出声那一层（engine/fx.ts、录音房）从此不替缺的参数补默认、开关照写的读；测试要拼一格效果，就从这里拿一份写全的、开着的，再盖上自己要试的那几个数。
//   NEUTRAL = 16-4 A2 之前参数表（fx.ts）里写的默认——原语测试的期望值是照它算的（压缩没有补偿、混响宽度满、延迟反馈 0.35…）。不是模板（新插一格的样子在 format/template.ts）。
import type { FxV2 } from "../../src/format/contract.ts";
export const NEUTRAL: Record<string, Record<string, number>> = {
  eq: { hpHz: 0, lpHz: 0, lowDb: 0, lowHz: 200, midDb: 0, midHz: 1500, midQ: 1, highDb: 0, highHz: 5000 },
  comp: { thresholdDb: -18, ratio: 3, attackMs: 10, releaseMs: 120, kneeDb: 6, makeupDb: 0 },
  delay: { timeMs: 375, feedback: 0.35, mix: 0.3, dry: 1, dampHz: 6000 },
  reverb: { room: 0.5, damp: 0.5, mix: 0.3, dry: 1, preDelayMs: 10, width: 1 },
  chorus: { voices: 3, delayMs: 18, depthMs: 2.5, rateHz: 0.6, spread: 0.8, mix: 0.5, dry: 1 },
  gain: { dB: 0 },
};
/** 一格写全的效果（开着）：kind 的中性参数 + over；extra = 别的字段（on: false、key…）。 */
export const fx = (id: string, kind: string, over: Record<string, number> = {}, extra: Partial<FxV2> = {}): FxV2 => ({ id, kind, on: true, params: { ...(NEUTRAL[kind] ?? {}), ...over }, ...extra });
