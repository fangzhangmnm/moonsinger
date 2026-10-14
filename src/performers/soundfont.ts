// soundfont.ts —— 演奏者插件：SoundFont 2 的一个预设（TinySoundFont 在录音房里实时合成；库 = 歌里嵌的 / 弱引用解析出的子集）。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
//   能叠音；不唱字；鼓 / 音效的着力点（hitSec）和谱上的画法（× 符头 / 鼓谱）在这里（原 main.ts hitOf / partViews）；每个音敲哪个键 = src/gm/sf-key.ts（固定原速 / 音高对齐 / 修八度）。
import { registerPerformer } from "./registry.ts";
import { activeGm, activeVelocity, activeTranspose, activePerfSpec, withVelocity, withTranspose, withSfxFixed, withSfxAlign, roleName, type GmCandidate } from "../format/project.ts";
import { SOUNDFONT_DEFAULTS } from "../format/performance.ts";
import { velLayersOf, octaveCheckOf, conceptOfIds, octaveDisclosure, GS_LIBRARY_ID } from "../gm/catalog.ts";
import { canAlign } from "../gm/sf-key.ts";
import { CLEF_LABEL } from "../score/clef.ts";
import type { ClefName } from "../score/song.ts";
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
  /** 乐器页「怎么演」里这位自己的行（原 main.ts drawInst 里按引擎能力 gate 的那几段，原样搬来；2026-10-15 刀 5 之一）。 */
  inspector: ({ extras, role, catalog, esc, chip, dynTable }) => {
    const active = activeGm(extras, role), sp = activePerfSpec(extras, role), tr = activeTranspose(extras, role), rows = [] as { label: string; control: string; note?: string }[];
    // 力度（2026-10-08，user「应该send的就是velocity！」「力度就是velocity」）：没写力度记号的音按这个；有力度表的演奏者 mp / mf 查表、重音 / 强音往上加
    { const midi = Math.round(activeVelocity(extras, role) * 127), def = sp.dynamicsVel?.mf ?? Math.round(SOUNDFONT_DEFAULTS.velocity * 127);
      const L = active && active.origin.library === GS_LIBRARY_ID && catalog ? velLayersOf(catalog, active.bank, active.program, active.note) : null, k = L ? L.ranges.findIndex(([lo, hi]) => midi >= lo && midi <= hi) : -1;
      rows.push({ label: "力度", control: `<b class="ip-val">${midi}</b><button class="btn" data-v="vel:-8" title="轻一点（MIDI 力度 −8）">−8</button><button class="btn" data-v="vel:8" title="重一点（+8）">+8</button>` +
        (midi !== def ? `<button class="btn" data-v="vel:def" title="回到 ${def}">默认</button>` : ""),
        note: `没写力度记号的音按这个力度（MIDI 1–127）。` + (sp.dynamicsVel ? `力度记号按这位的力度表（重音 +${sp.accentVel}、强音 +${sp.marcatoVel}；别的记号见下面「记号怎么演」）：${dynTable(L)}` : `这位是之前上场的：力度记号还是只改音量：${dynTable(null)}`) +
          (L ? (L.count > 1 ? `GS 里这个音色有 ${L.count} 个力度层${k >= 0 ? `，现在在第 ${k + 1} 层（${L.ranges[k][0]}–${L.ranges[k][1]}）` : ""}：跨层 = 换一份录音，音色会变，不只是响度。` : "GS 里这个音色只有一个力度层：力度只改响度。") : "") });
    }
    // 音效（GS 116–128，上场时抄了 sfx）：固定原速默认开（user 2026-10-08「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」）；
    //   谱上写的音高永远不动——固定 = 不拿来出声（写谱按键时也一样，sf-key.ts 一处算）；关掉 = 按写的音变调变速，再可选音高对齐
    if (active?.sfx) { const fixed = active.note !== undefined, al = !!active.sfx.align;
      rows.push({ label: "音效", control: chip("sfx:fixed", "固定原速", fixed, "每个音都敲原速键：写谱按键、播放都是原来的样子；谱上写的音高照留，只是不拿来出声") +
        (fixed ? "" : canAlign(active.sfx) ? chip("sfx:align", "音高对齐", al, "按原速时最强的那个频率大致对齐，谱上的音 ≈ 听到的音；不一定是耳朵听到的主音") : ""),
        note: fixed ? "谱上写不同的音也都响原来的样子（音高留在谱上，关掉就按它变调）" : al ? "写的音 ≈ 听到的音（大致）" : `按写的音变调变速：越高越尖越快，越低越沉越慢${canAlign(active.sfx) ? "" : "；这个音效原速时听不出音高，没法对齐"}` });
    }
    // 修八度 / 移调（user「修八度和移调的音色级别的选项…大部分情况不应该动，是worst case兜底」）：鼓件 / 固定原速按哪个键都一样，不给；默认 0、不自动套用
    if (active && active.note === undefined) rows.push({ label: "修八度", control: `<b class="ip-val">${tr > 0 ? "+" : tr < 0 ? "−" : ""}${Math.abs(tr)} 半音</b><button class="btn" data-v="tr:-12" title="低一个八度">−12</button><button class="btn" data-v="tr:-1" title="低半音">−1</button><button class="btn" data-v="tr:1" title="高半音">+1</button><button class="btn" data-v="tr:12" title="高一个八度">+12</button>${tr ? `<button class="btn" data-v="tr:0" title="回到 0">归零</button>` : ""}`,
      note: "大部分情况不用动：某些音色本身就差八度（比如 GS 的 Guitar Harmonics 高两个八度）时兜底，调好后写什么音就响什么音" });
    // 八度（v0.9.32；user「几个铃的到底哪个八度算数还是没有弄清楚。不过先向用户披露」）：谱上写的 = 实际音高 = 发给音源的；这件乐器的记谱习惯（仓鼠 v12 notation）+ GS 这个音色的实测（octaveCheck）
    if (active) {
      const cpt = catalog ? conceptOfIds(catalog, (extras.lounge[role] as { concept?: { ids?: { wikidata?: string | null; local?: string | null } } } | undefined)?.concept?.ids) : undefined;
      const oc = catalog && active.origin.library === GS_LIBRARY_ID ? octaveCheckOf(catalog, active.bank, active.program, active.note) : null;
      const text = octaveDisclosure(cpt?.notation, oc, (c) => CLEF_LABEL[c as ClefName] ?? c);
      if (text) rows.push({ label: "八度", control: "", note: esc(text) });
    }
    return rows;
  },
  onInspector: (v, { extras, role, hum }) => {
    const g = activeGm(extras, role), rn = roleName(extras, role);
    if (v === "sfx:fixed") { const on = g?.note === undefined; return { extras: withSfxFixed(extras, role, on, hum), label: `「${rn}」${on ? "固定原速" : "不固定原速（按写的音变调）"}`, silence: true }; }
    if (v === "sfx:align") { const on = !g?.sfx?.align; return { extras: withSfxAlign(extras, role, on, hum), label: `「${rn}」音高对齐${on ? "开" : "关"}`, silence: true }; }
    if (v.startsWith("tr:")) { const d = Number(v.slice(3)), next = d === 0 ? 0 : activeTranspose(extras, role) + d; return { extras: withTranspose(extras, role, next, hum), label: `「${rn}」修八度 / 移调 ${next} 半音`, gesture: "transpose", silence: true }; }
    if (v.startsWith("vel:")) { const sp = activePerfSpec(extras, role), def = (sp.dynamicsVel?.mf ?? Math.round(SOUNDFONT_DEFAULTS.velocity * 127)) / 127, next = v === "vel:def" ? def : activeVelocity(extras, role) + Number(v.slice(4)) / 127; return { extras: withVelocity(extras, role, next, hum), label: `「${rn}」力度 ${Math.max(1, Math.min(127, Math.round(next * 127)))}`, gesture: "vel" }; }
    return null;
  },
});
