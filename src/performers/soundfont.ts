// soundfont.ts —— 演奏者插件：SoundFont 2 的一个预设（TinySoundFont 在录音房里实时合成；库 = 歌里嵌的 / 弱引用解析出的子集）。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
//   能叠音；不唱字；鼓 / 音效的着力点（hitSec）和谱上的画法（× 符头 / 鼓谱）在这里（原 main.ts hitOf / partViews）；每个音敲哪个键 = src/gm/sf-key.ts（固定原速 / 音高对齐 / 修八度）。
import { _t } from "../i18n/index.ts";
import { registerPerformer, type InspectorRow } from "./registry.ts";
import { activeGm, activeVelocity, activeTranspose, activePerfSpec, withVelocity, withTranspose, withSfxFixed, withSfxAlign, withActiveKeys, candPath, type GmCandidate } from "../format/project.ts";
import { TEMPLATE, CALIBRATION_DEFAULT_DB, templateCandidate } from "../format/template.ts";   // 乐器页的「默认」和新上场的响度问模板（这里只有乐器页那一半和新建可以问，统筹 2026-11-12 夜第 3 条）
import { velLayersOf, octaveCheckOf, conceptOfIds, octaveDisclosure, castArgsOf, GS_LIBRARY_ID } from "../gm/catalog.ts";
import { sf2VelocityDepths, sf2HalfVelocityDb } from "../gm/sf2-subset.ts";
import { canAlign } from "../gm/sf-key.ts";
import { CLEF_LABEL } from "../score/clef.ts";
import type { ClefName } from "../score/song.ts";
import { percKindOf, hitSecByKeyOf } from "../gm/percussion.ts";
import { sfKey } from "../gm/sf-key.ts";
import type { NoteEv } from "../engine/studio.ts";

/** 着力点（v0.10.27；16-4 E 起只读乐手身上按值存的 instrument.hitSecByKey：敲的键 → 提前几秒，表里没列的键 = 不提前）。
 *  鼓 / 固定敲一件却没有这张表 = 缺数（读文件的门口本来会补；补不上 = 这个声部明着不出声，不回头查目录顶上）。表里全是 0 = 不挪（和没有着力点一样）。 */
function hitOf(g: GmCandidate | null): { hitSec?: (key: number) => number; missing?: string[] } {
  const t = g?.hitSecByKey;
  if (!t) return g && (g.note !== undefined || g.bank === 128) ? { missing: ["instrument.hitSecByKey"] } : {};
  if (!Object.values(t).some((v) => v !== 0)) return {};
  return { hitSec: (key) => t[String(key)] ?? 0 };
}

/** 新上场的乐器默认的「响度」按库报（9-3，2026-11-12；user「小月相有自己的normalization，normalization应该是乐器自己可以带的。是不同库之间需要调」）。
 *  现在每个库（GS、自己拖进来的 .sf2）都是现行的那一个默认 CALIBRATION_DEFAULT_DB（0 = 满音量；第 14 条，2026-11-12 起，原来是 −6）。
 *  库和库之间要对齐时才在这里按库写非零的数（加第三个库时用量响度的工具给建议，数由人定）。进歌 by value。 */

type Json = Record<string, unknown>;
const calFor = (_library: string | null): number => CALIBRATION_DEFAULT_DB;   // 9-3：按库报；现在每个库都是现行的默认（第 14 条）
/** 「音效」那一行怎么算一样（16-6）：固定敲哪个键、原速键 / 音高锚点、音高对齐开没开（没写对齐 = 关，和写了 false 一个意思）。 */
const sfxSig = (c: Json): string => { const i = (c.instrument ?? {}) as Json, x = (i.sfx ?? {}) as Json; return JSON.stringify([i.note ?? null, x.key ?? null, x.midi ?? null, x.centsPerKey ?? null, !!x.align]); };
/** 着力点那一行的一句话（16-6，统筹 2026-11-13）：几个键提前、最多几毫秒。 */
const hitSummary = (t: unknown): string => { const v = Object.values((t ?? {}) as Record<string, number>).filter((x) => x > 0); return v.length ? _t("{n} 个键提前开始放，最多 {ms} ms", { n: v.length, ms: Math.round(Math.max(...v) * 1000) }) : _t("不提前"); };

export const soundfont = registerPerformer({
  guid: "3e8a5c47-9f21-4b6d-a0e2-c7d14f8b9a63", kind: "performer", name: "soundfont", version: 1, label: _t("SoundFont 乐器"),
  description: _t("SoundFont 乐器（TinySoundFont 出声）"),
  sound: "notes", poly: true, lyrics: "none", hintRange: null,
  // lightMarks 那一路；琶音只有能叠音的认（v0.9.45）；气声 / 出声的换气乐器本来就不认
  honors: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "tenuto", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost", "arpeggio", "roll"],
  pedals: ["sustain", "sostenuto", "soft"],   // 踏板：延音（11-1）、持音 / 弱音（11-2）的出声都接了（test/pedal.test.ts「表说认 = 出声真变了」守着）
  connected: false, dynamics: "velocity", grooveCategory: "gm", removable: true,
  defaultCalibrationDb: calFor,
  /** 「现在的默认」（16-6）：模板那一位 + 音乐目录按值抄的那几样（GS 货架上的：缝、能不能音内渐强、音效的原速键 / 固定原速；自己的 .sf2 = 0 / 能 / 不固定），
   *  身份（库、音色、子集、鼓件敲哪个键）照台上这位。滚奏按「现在新上场」那一位是不是鼓（新上场的音效 = 固定原速 = 鼓那一档；关掉固定不连带标滚奏）；
   *  着力点 = 打击乐表对台上这位现在敲的那几个键怎么说（统筹 2026-11-13「和目录不一样才打点」；固定 / 不固定那一行改回去时连带重抄）。 */
  castNow: (cur, catalog) => {
    const t = templateCandidate("soundfont"), i = (cur.instrument ?? {}) as Json, lib = (candPath(cur, "instrument.source.origin.library") as string | undefined) ?? null;
    const bank = Number(i.bank), program = Number(i.program), note = typeof i.note === "number" ? i.note : undefined, gs = lib === GS_LIBRARY_ID, drumPiece = bank === 128 && note !== undefined;
    const args = gs && catalog ? castArgsOf(catalog, bank, program, drumPiece ? note : undefined) : null;
    const inst: Json = { ...i };
    if (args && i.sfx) { if (args.sfx) { inst.note = args.note; inst.sfx = { ...args.sfx }; } else { delete inst.note; delete inst.sfx; } }
    const hit = hitSecByKeyOf({ bank, program, ...(note !== undefined ? { note } : {}) }); if (hit) inst.hitSecByKey = hit; else delete inst.hitSecByKey;
    const art = { ...(t.articulation as Json), rollHz: bank === 128 || inst.note !== undefined ? TEMPLATE.lounge.rollHz.drum : TEMPLATE.lounge.rollHz.pitched,
      gapSec: args?.gapSec ?? 0, canSwell: args?.canSwell ?? true };
    return { cand: { ...t, instrument: inst, articulation: art, calibrationDb: calFor(lib) }, pending: gs && !catalog ? ["articulation.gapSec", "articulation.canSwell", "instrument.note", "instrument.sfx"] : [] };
  },
  defaultRows: [
    { id: "vel", label: () => _t("力度##MIDI"), keys: ["defaults.velocity"] },
    { id: "sfx", label: () => _t("音效"), keys: ["instrument.note", "instrument.sfx"], when: (_p, c) => !!candPath(c, "instrument.sfx"),
      same: (a, b) => sfxSig(a) === sfxSig(b),
      // 改回去 = 抄原速键 / 固定与否，再按固定与否重抄着力点（同「固定原速」开关）
      reset: (extras, role, def, hum) => withSfxFixed(withActiveKeys(extras, role, def, ["instrument.note", "instrument.sfx"], hum), role, candPath(def, "instrument.note") !== undefined, hum) },
    { id: "tr", label: () => _t("修八度"), keys: ["transpose"], when: (_p, c) => candPath(c, "instrument.note") === undefined },
    { id: "hit", label: () => _t("着力点"), keys: ["instrument.hitSecByKey"], when: (_p, c) => candPath(c, "instrument.bank") === 128 || typeof candPath(c, "instrument.note") === "number" },
  ],
  info: ({ extras, role, presetIndex, velCurve }) => {
    const g = activeGm(extras, role), c = g ? velCurve(g.subsetSha256, g.bank, g.program) : null, tr = activeTranspose(extras, role);
    // L（7-N）：写的音高 → 敲的键（同出声的 sfKey：修八度 / 固定原速 / 鼓件）→ 引擎在那个键上实际的；库没载 = 不给（这个声部本来就不出声）
    return { gm: g ? { sha: g.subsetSha256, presetIndex: presetIndex(g.subsetSha256, g.bank, g.program), note: g.note, sfx: g.sfx } : null, chunk: "phrase", ...hitOf(g), ...(g && c ? { velDb: (midi: number, vel: number) => c.at(sfKey(midi, g, tr), vel) } : {}) };
  },
  /** 这位的子集进录音房（弱引用去找整包 → 切子集；找不到 = 抛，胶水报出来、这个声部不出声）。 */
  prepare: async (ctx) => {
    const g = activeGm(ctx.extras, ctx.role); if (!g) return;   // 时间线会报「台上的不是 SoundFont 乐器」
    if (ctx.engine.hasBank(g.subsetSha256)) return;
    await ctx.engine.bank(g.subsetSha256, await ctx.resolveGmBytes(g));
  },
  track: ({ id, notes, gain, chain, info }) => {
    const g = info.gm;
    if (!g) return { unplayable: _t("台上的不是 SoundFont 乐器") };
    const sfNotes = notes.map((n): NoteEv => { const key = sfKey(n.midi, g, info.transpose), h = info.hitSec?.(key) ?? 0; return { t0: n.t0 - h, t1: n.t1, key, vel: n.vel ?? info.velocity, preset: g.presetIndex, ...(n.w1 !== undefined ? { w1: n.w1 } : {}) }; });
    let from: number | undefined;
    if (info.hitSec) sfNotes.sort((x, y) => x.t0 - y.t0);   // 提前了的音：录音房按 t0 顺序走
    for (const n of sfNotes) from = from === undefined ? n.t0 : Math.min(from, n.t0);   // 比 0 还早（着力点 / 歌开头的琶音，v0.16.1）= 时间线从那儿起
    return { track: { id, kind: "sf", sha: g.sha, notes: sfNotes, gain, ...(chain?.length ? { chain } : {}), ...(info.spec?.canSwell === false ? { decays: true as const } : {}) }, ...(from !== undefined ? { from } : {}) };
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
    return { inst: { kind: "sf", sha: g.subsetSha256, preset: engine.presetIndex(g.subsetSha256, g.bank, g.program) }, key: (m) => sfKey(m, g, activeTranspose(extras, role)), vel: dyn.vel, gainDb: 0 };   // 9-2：人人有力度表，都按力度敲（10-08 以前没带表的旧候选也是）
  },
  /** 乐器页「怎么演」里这位自己的行（原 main.ts drawInst 里按引擎能力 gate 的那几段，原样搬来；2026-10-15 刀 5 之一）。 */
  inspector: ({ extras, role, catalog, esc, chip, bankBytes }) => {
    const active = activeGm(extras, role), tr = activeTranspose(extras, role), rows = [] as InspectorRow[];
    // 力度（2026-10-08，user「应该send的就是velocity！」「力度就是velocity」）：没写力度记号的音按这个；有力度表的演奏者 mp / mf 查表、重音 / 强音往上加
    { const midi = Math.round(activeVelocity(extras, role) * 127);
      const L = active && active.origin.library === GS_LIBRARY_ID && catalog ? velLayersOf(catalog, active.bank, active.program, active.note) : null, k = L ? L.ranges.findIndex(([lo, hi]) => midi >= lo && midi <= hi) : -1;
      // 力度深度（施工单 9-4，2026-11-12）：库给每件乐器写的「力度 → 初始衰减」的量，引擎照它算（照 FluidSynth）；字节在手边才读得到（嵌在歌里的 / 这次找到过的）
      const bytes = active ? active.bytes ?? bankBytes(active.subsetSha256) : undefined, ds = active && bytes ? (() => { try { return sf2VelocityDepths(bytes, active.bank, active.program, active.note); } catch { return null; } })() : null, one = ds && ds.length === 1 ? ds[0] : null;
      const depth = !active ? "" : !ds || !ds.length ? _t("力度深度 = 库里给这件乐器写的（声音载好后显示）；响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)。")
        : one === 0 ? _t("这件乐器按多重都一样响（库里这么定的：力度深度 0）。")
        : one !== null ? _t("力度深度 {d}（库里写的；规范默认 960）：响度 = {d} ÷ 960 × 40·log10(力度 ÷ 127)，满力度 127 = 0 dB，力度减半 = 轻 {half} dB。", { d: one, half: Math.round(sf2HalfVelocityDb(one) * 10) / 10 })
        : _t("力度深度按鼓件 / 音区不一样：{ds}（库里写的；规范默认 960）。响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)。", { ds: ds.join(" / ") });
      // 力度记号 → MIDI 力度那张表（连同响度 dB、第几份录音）挪到乐器页通用的「力度记号」那一行（16-6：每个会改声音的键恰好落在一行上）
      rows.push({ id: "vel", value: String(midi), label: _t("力度##MIDI"), control: `<b class="ip-val">${midi}</b><button class="btn" data-v="vel:-8" title="${_t("轻一点（MIDI 力度 −8）")}">−8</button><button class="btn" data-v="vel:8" title="${_t("重一点（+8）")}">+8</button>`,   // 「默认」钮 = 乐器页统一的那一颗（16-6）
        note: _t("没写力度记号的音按这个力度（MIDI 1–127）。{depth}{L}", { depth, L: (L ? (L.count > 1 ? _t("GS 里这个音色有 {count} 个力度层{p}：跨层 = 换一份录音，音色会变，不只是响度。", { count: L.count, p: k >= 0 ? _t("，现在在第 {p} 层（{p2}–{p3}）", { p: k + 1, p2: L.ranges[k][0], p3: L.ranges[k][1] }) : "" }) : _t("GS 里这个音色只有一个力度层：力度只改响度。")) : "") }) });
    }
    // 音效（GS 116–128，上场时抄了 sfx）：固定原速默认开（user 2026-10-08「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」）；
    //   谱上写的音高永远不动——固定 = 不拿来出声（写谱按键时也一样，sf-key.ts 一处算）；关掉 = 按写的音变调变速，再可选音高对齐
    if (active?.sfx) { const fixed = active.note !== undefined, al = !!active.sfx.align;
      rows.push({ id: "sfx", value: fixed ? _t("固定原速") : al ? _t("按写的音变调（音高对齐）") : _t("按写的音变调"), label: _t("音效"), control: chip("sfx:fixed", _t("固定原速"), fixed, _t("每个音都敲原速键：写谱按键、播放都是原来的样子；谱上写的音高照留，只是不拿来出声")) +
        (fixed ? "" : canAlign(active.sfx) ? chip("sfx:align", _t("音高对齐"), al, _t("按原速时最强的那个频率大致对齐，谱上的音 ≈ 听到的音；不一定是耳朵听到的主音")) : ""),
        note: fixed ? _t("谱上写不同的音也都响原来的样子（音高留在谱上，关掉就按它变调）") : al ? _t("写的音 ≈ 听到的音（大致）") : _t("按写的音变调变速：越高越尖越快，越低越沉越慢{sfx}", { sfx: canAlign(active.sfx) ? "" : _t("；这个音效原速时听不出音高，没法对齐") }) });
    }
    // 修八度 / 移调（user「修八度和移调的音色级别的选项…大部分情况不应该动，是worst case兜底」）：鼓件 / 固定原速按哪个键都一样，不给；默认 0、不自动套用
    if (active && active.note === undefined) rows.push({ id: "tr", value: _t("{p}{tr} 半音", { p: tr > 0 ? "+" : tr < 0 ? "−" : "", tr: Math.abs(tr) }), label: _t("修八度"), control: `<b class="ip-val">${_t("{p}{tr} 半音", { p: tr > 0 ? "+" : tr < 0 ? "−" : "", tr: Math.abs(tr) })}</b><button class="btn" data-v="tr:-12" title="${_t("低一个八度")}">−12</button><button class="btn" data-v="tr:-1" title="${_t("低半音")}">−1</button><button class="btn" data-v="tr:1" title="${_t("高半音")}">+1</button><button class="btn" data-v="tr:12" title="${_t("高一个八度")}">+12</button>${tr ? `<button class="btn" data-v="tr:0" title="${_t("回到 0")}">${_t("归零")}</button>` : ""}`,
      note: _t("大部分情况不用动：某些音色本身就差八度（比如 GS 的 Guitar Harmonics 高两个八度）时兜底，调好后写什么音就响什么音") });
    // 着力点（16-6，统筹 2026-11-13「一句摘要（几个键提前、最多几毫秒），和目录不一样才打点」）：鼓 / 固定敲一件的才有；只读
    if (active && (active.bank === 128 || active.note !== undefined)) rows.push({ id: "hit", value: hitSummary(active.hitSecByKey), label: _t("着力点"), control: `<b class="ip-val">${esc(hitSummary(active.hitSecByKey))}</b>`,
      note: _t("采样开头到「砸下去那一下」有多远：放的时候提前这么多开始，让砸下去那一下落在写的那一拍上（反向镲这类最明显）。按每个敲的键按值记在这位身上，数是打击乐表里实测的") });
    // 八度（v0.9.32；user「几个铃的到底哪个八度算数还是没有弄清楚。不过先向用户披露」）：谱上写的 = 实际音高 = 发给音源的；这件乐器的记谱习惯（仓鼠 v12 notation）+ GS 这个音色的实测（octaveCheck）
    if (active) {
      const cpt = catalog ? conceptOfIds(catalog, (extras.lounge[role] as { concept?: { ids?: { wikidata?: string | null; local?: string | null } } } | undefined)?.concept?.ids) : undefined;
      const oc = catalog && active.origin.library === GS_LIBRARY_ID ? octaveCheckOf(catalog, active.bank, active.program, active.note) : null;
      const text = octaveDisclosure(cpt?.notation, oc, (c) => CLEF_LABEL[c as ClefName] ?? c);
      if (text) rows.push({ label: _t("八度"), control: "", note: esc(text) });
    }
    return rows;
  },
  onInspector: (v, { extras, role, hum, roleLabel }) => {
    const g = activeGm(extras, role), rn = roleLabel;
    if (v === "sfx:fixed") { const on = g?.note === undefined; return { extras: withSfxFixed(extras, role, on, hum), label: `「${rn}」${on ? _t("固定原速") : _t("不固定原速（按写的音变调）")}`, silence: true }; }
    if (v === "sfx:align") { const on = !g?.sfx?.align; return { extras: withSfxAlign(extras, role, on, hum), label: _t("「{rn}」音高对齐{on}", { rn, on: on ? _t("开") : _t("关") }), silence: true }; }
    if (v.startsWith("tr:")) { const d = Number(v.slice(3)), next = d === 0 ? 0 : activeTranspose(extras, role) + d; return { extras: withTranspose(extras, role, next, hum), label: _t("「{rn}」修八度 / 移调 {next} 半音", { rn, next }), gesture: "transpose", silence: true }; }
    if (v.startsWith("vel:")) { const next = activeVelocity(extras, role) + Number(v.slice(4)) / 127; return { extras: withVelocity(extras, role, next, hum), label: _t("「{rn}」力度 {p}", { rn, p: Math.max(1, Math.min(127, Math.round(next * 127))) }), gesture: "vel" }; }
    return null;
  },
});
