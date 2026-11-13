// chain.ts —— 效果链送进录音房之前的换算（原 src/ui/plugins.ts 的「主线程换算」节，2026-10-16 搬来：无头渲染核心 src/core/render.ts 也要用，核心不 import src/ui）。
//   created 2026-10-16 by Claude Fable 5.1（函数体原样，v0.10.8 Claude Opus 5.5 写的）。
import type { FxV2 } from "../format/contract.ts";
import type { ParamDef } from "./fx.ts";
import { _t } from "../i18n/index.ts";
import { type Song, headLen, tempoAt } from "../score/song.ts";
import { midiOf } from "../score/pitch.ts";

/** 主线程换算的两个参数（不是原语的，录音房不认；放之前就换成 hpHz / timeMs）。登记在这里 = 有默认、没写时补、存的时候明写（第 16 条 16-5，统筹 2026-11-12 夜）。
 *  意思：开着 = 这个数跟着这首歌自己的谱（跟着的东西就在同一个文件里）；存的时候把那一刻算出来的数写进 hpHz / timeMs（文件里的数 = 存那一刻真的在用的数，writeResolved）。 */
export const HOST_PARAMS: Record<string, ParamDef[]> = {
  eq: [{ id: "hpAuto", unit: "bool", min: 0, max: 1, default: 0, label: _t("自动低切") }],
  delay: [{ id: "syncBeats", unit: "ratio", min: 0, max: 2, default: 0, label: _t("跟速度（几拍一次；0 = 用上面的毫秒）") }],
};
/** 这位歌手全曲最低的音（自动低切用；没有音 = null）。 */
export function lowestMidiOf(song: Song, partId: string): number | null {
  let lo: number | null = null;
  for (const pp of song.papers) for (const t of pp.tracks[partId] ?? []) if (t.kind === "note" && t.pitch) for (const q of [t.pitch, ...(t.chord ?? [])]) { const m = midiOf(q); if (lo === null || m < lo) lo = m; }
  return lo;
}
/** 歌开头的速度（延迟「跟速度」用）。 */
export function songBpm(song: Song): number { const p = song.papers[0], t = p ? p.tracks[song.parts.find((x) => p.tracks[x.id])?.id ?? ""] : undefined; return t ? tempoAt(t, headLen(t)) : 90; }

/** 自动低切的频率：这个声部最低的音往下大三度（约 0.79 倍），夹在 20–300 Hz；没有音 = 0（关）。 */
export function autoLowCutHz(lowestMidi: number | null): number {
  if (lowestMidi === null) return 0;
  const hz = 440 * 2 ** ((lowestMidi - 69 - 4) / 12);
  return Math.round(Math.max(20, Math.min(300, hz)));
}
/** 跟速度的延迟时间（毫秒）：几拍 × 60000 ÷ 歌开头的速度，最多 2000。 */
const syncedMs = (beats: number, bpm: number): number => Math.min(2000, Math.round((60000 / bpm) * beats));
/** 存的时候用（16-5）：开关照写，开着的那一格把这一刻算出来的数写进 hpHz / timeMs——和 resolveChain 同一份换算，所以文件里写的就是放的时候用的数。 */
export function writeResolved(chain: readonly FxV2[], ctx: { lowestMidi: number | null; bpm: number }): FxV2[] {
  return chain.map((fx) => {
    if (fx.kind === "eq" && fx.params?.hpAuto) return { ...fx, params: { ...fx.params, hpHz: autoLowCutHz(ctx.lowestMidi) } };
    if (fx.kind === "delay" && fx.params?.syncBeats) return { ...fx, params: { ...fx.params, timeMs: syncedMs(fx.params.syncBeats, ctx.bpm) } };
    return fx;
  });
}
/** 一条链 → 录音房收的样子：hpAuto / syncBeats 换成 hpHz / timeMs（主线程换算的参数本身不送）。 */
export function resolveChain(chain: readonly FxV2[], ctx: { lowestMidi: number | null; bpm: number }): FxV2[] {
  return chain.map((fx) => {
    if (fx.kind === "eq" && fx.params.hpAuto) { const { hpAuto: _a, ...rest } = fx.params; return { ...fx, params: { ...rest, hpHz: autoLowCutHz(ctx.lowestMidi) } }; }
    if (fx.kind === "delay" && fx.params.syncBeats) { const { syncBeats: _b, ...rest } = fx.params; return { ...fx, params: { ...rest, timeMs: syncedMs(fx.params.syncBeats, ctx.bpm) } }; }
    return fx;
  });
}
