// chain.ts —— 效果链送进录音房之前的换算（原 src/ui/plugins.ts 的「主线程换算」节，2026-10-16 搬来：无头渲染核心 src/core/render.ts 也要用，核心不 import src/ui）。
//   created 2026-10-16 by Claude Fable 5.1（函数体原样，v0.10.8 Claude Opus 5.5 写的）。
import type { FxV2 } from "../format/contract.ts";

/** 自动低切的频率：这个声部最低的音往下大三度（约 0.79 倍），夹在 20–300 Hz；没有音 = 0（关）。 */
export function autoLowCutHz(lowestMidi: number | null): number {
  if (lowestMidi === null) return 0;
  const hz = 440 * 2 ** ((lowestMidi - 69 - 4) / 12);
  return Math.round(Math.max(20, Math.min(300, hz)));
}
/** 一条链 → 录音房收的样子：hpAuto / syncBeats 换成 hpHz / timeMs（主线程换算的参数本身不送）。 */
export function resolveChain(chain: readonly FxV2[], ctx: { lowestMidi: number | null; bpm: number }): FxV2[] {
  return chain.map((fx) => {
    if (fx.kind === "eq" && fx.params.hpAuto) { const { hpAuto: _a, ...rest } = fx.params; return { ...fx, params: { ...rest, hpHz: autoLowCutHz(ctx.lowestMidi) } }; }
    if (fx.kind === "delay" && fx.params.syncBeats) { const { syncBeats: _b, ...rest } = fx.params; return { ...fx, params: { ...rest, timeMs: Math.min(2000, Math.round((60000 / ctx.bpm) * fx.params.syncBeats)) } }; }
    return fx;
  });
}
