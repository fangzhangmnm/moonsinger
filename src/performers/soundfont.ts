// soundfont.ts —— 演奏者插件：SoundFont 2 的一个预设（TinySoundFont 在录音房里实时合成；库 = 歌里嵌的 / 弱引用解析出的子集）。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
//   能叠音；不唱字；鼓 / 音效的着力点（hitSec）和谱上的画法（× 符头 / 鼓谱）在这里（原 main.ts hitOf / partViews）；每个音敲哪个键 = src/gm/sf-key.ts（固定原速 / 音高对齐 / 修八度）。
import { registerPerformer } from "./registry.ts";
import { activeGm, activeVelocity, activeTranspose, type GmCandidate } from "../format/project.ts";
import { percKindOf, percOf } from "../gm/percussion.ts";
import { sfKey } from "../gm/sf-key.ts";
import type { NoteEv } from "../engine/studio.ts";

/** 着力点（v0.10.27）：台上是鼓 / 固定敲一件的音效 = 按仓鼠实测的 hitSec 提前放；有音高的乐器不挪。 */
function hitOf(g: GmCandidate | null): { hitSec?: (key: number) => number } {
  const pk = g ? percKindOf(g) : null;
  if (!pk) return {};
  if (pk.kind === "kit") return { hitSec: (key) => percOf(128, 0, key)?.hitSec ?? 0 };
  const h = pk.info.hitSec ?? 0; return h ? { hitSec: () => h } : {};
}

export const soundfont = registerPerformer({
  guid: "3e8a5c47-9f21-4b6d-a0e2-c7d14f8b9a63", kind: "performer", name: "soundfont", version: 1, label: "SoundFont 乐器",
  description: "SoundFont 乐器（TinySoundFont 出声）",
  sound: "notes", poly: true, lyrics: "none", hintRange: null,
  // lightMarks 那一路；琶音只有能叠音的认（v0.9.45）；气声 / 出声的换气乐器本来就不认
  honors: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "tenuto", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost", "arpeggio"],
  connected: false, dynamics: "velocity", grooveCategory: "gm", removable: true,
  info: ({ extras, role, presetIndex }) => {
    const g = activeGm(extras, role);
    return { gm: g ? { sha: g.subsetSha256, presetIndex: presetIndex(g.subsetSha256, g.bank, g.program), note: g.note, sfx: g.sfx } : null, chunk: "phrase", ...hitOf(g) };
  },
  /** 这位的子集进录音房（弱引用去找整包 → 切子集；找不到 = 抛，胶水报出来、这个声部不出声）。 */
  prepare: async (ctx) => {
    const g = activeGm(ctx.extras, ctx.role); if (!g) return;   // 时间线会报「台上的不是 SoundFont 乐器」
    if (ctx.engine.hasBank(g.subsetSha256)) return;
    await ctx.engine.bank(g.subsetSha256, await ctx.resolveGmBytes(g));
  },
  track: ({ id, notes, gain, chain, info }) => {
    const g = info.gm;
    if (!g) return { unplayable: "台上的不是 SoundFont 乐器" };
    const sfNotes = notes.map((n): NoteEv => { const key = sfKey(n.midi, g, info.transpose), h = info.hitSec?.(key) ?? 0; return { t0: n.t0 - h, t1: n.t1, key, vel: n.vel ?? info.velocity, preset: g.presetIndex }; });
    let from: number | undefined;
    if (info.hitSec) { sfNotes.sort((x, y) => x.t0 - y.t0); for (const n of sfNotes) from = from === undefined ? n.t0 : Math.min(from, n.t0); }   // 提前了的音：录音房按 t0 顺序走；比第一个音还早 = 时间线从那儿起
    return { track: { id, kind: "sf", sha: g.sha, notes: sfNotes, gain, ...(chain?.length ? { chain } : {}) }, ...(from !== undefined ? { from } : {}) };
  },
  /** × 符头 = 固定敲一个键（鼓件 / 音效固定原速）；perc = 鼓 / 音效 → 鼓谱（一线谱 / 五线鼓谱，v0.10.27）。只是画法，数据不动。 */
  notation: ({ extras, role }) => {
    const g = activeGm(extras, role); if (!g) return {};
    const pk = percKindOf(g);
    return { ...(g.note !== undefined ? { xHead: true as const } : {}), ...(pk ? { perc: pk } : {}) };
  },
  /** 走库：没载好的这一下丢掉、顺手去载；力度 = 光标处生效的（有力度表走 MIDI 力度，旧候选走音量）；和渲染同一个 sfKey（写谱时听到的 = 播放时那个音）。 */
  audition: ({ extras, role, dyn, engine, ensureBank }) => {
    const g = activeGm(extras, role); if (!g) return null;
    if (!engine.hasBank(g.subsetSha256)) { ensureBank(); return null; }
    return { inst: { kind: "sf", sha: g.subsetSha256, preset: engine.presetIndex(g.subsetSha256, g.bank, g.program) }, key: (m) => sfKey(m, g, activeTranspose(extras, role)), vel: dyn.vel ?? activeVelocity(extras, role), gainDb: dyn.vel === null ? dyn.dB : 0 };
  },
});
