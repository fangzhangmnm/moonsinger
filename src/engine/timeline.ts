// timeline.ts —— 谱 → 时间线（秒）：每个声部的音符表 / 块清单 / 表情曲线，播放范围，纸的秒区间，光标 ↔ 秒。纯函数（node 里可测）。
// created 2026-10-09 by Claude Fable 5.1（提案 ai-docs/20261009-realtime-preview-engine-proposal.md §3；user「所以就和midi差不多对吧」= 对：
//   谱是 tick + 速度表 + 反复 + 编排，这里一次解成秒，seek / 循环 / 排程就是算术，三个引擎共一个钟）。派生物，改谱重算，不进文件。
// 月读的块：只在够长的休止处切，**不在纸界切**（user「曲段的边界算句子吧…也许还是同意可以跨曲段句子。cache应该不伤，听你的试试」；
//   弱起 / 连音线跨段的一句拦腰切 = 中间多一道接缝）；粒度仍是歌手的属性（句 / 曲段 / 一整首）。块的内容键里没有位置 → 歌词移位再复原照样命中。
import { type Token, type Song, type PartDef, type PaperSeg, type TempoMap, type Hum, type NoteTok, flattenPart, tempoMapOf, timeline, effectivePitch, allPitches, paperTicks, tempoOwner } from "../score/song.ts";
import { midiOf } from "../score/pitch.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { gainSegments, noteEnd, noteVelocities, lightMarks, type PerfSpec } from "../score/perform.ts";
import { grooveWeights, grooveMapOf, followOf, type GrooveStyle } from "../score/groove.ts";
import { toLabScore, singChunks, type LabScore, type SingLang, type SingChunkMode } from "../score/lab-score.ts";
import { playSegments } from "../score/repeats.ts";
import { sfKey, type SfxInfo } from "../gm/sf-key.ts";
import type { SingMark } from "../format/performance.ts";
import type { TrackSpec, NoteEv, GainSeg } from "./studio.ts";

/** 月读核心 OPT.leadIn（sing-core.mjs）：第一个元音前留的秒数；块的第 0 个采样 = 第一个音的时刻 − 它。 */
export const LEAD_IN = 0.5;
/** 唱法核心 raw 输出的补偿增益：刀 0 量的 raw 峰值 ≈ 0.42（うさぎ 0.419 / 団子 0.412）→ 乘到 0.89（原整首归一化的目标；按句出块后不再整首归一化，句与句的强弱照原样）。 */
export const SUNG_GAIN = 0.89 / 0.42;
/** 唱法核心 finish 的尾巴（秒）：块的声音比最后一个音长这么多。 */
export const SUNG_TAIL = 0.6;
/** 从光标放：提前这么多起放，第一个字的辅音（在元音前）不被切掉。 */
export const PRE_ROLL = 0.1;

export type Engine = "tsukuyomi" | "vowel-sampler" | "soundfont" | "unknown";
/** 一个声部上场那位的出声参数（主线程从休息室查好递进来；时间线不碰 Extras）。 */
export interface PerformerInfo {
  engine: Engine;
  spec: PerfSpec & { gapSec: number; sing: Record<string, SingMark | null> };
  velocity: number;
  transpose: number;
  gm: { sha: string; presetIndex: number; note?: number; sfx?: SfxInfo } | null;
  chunk: SingChunkMode;
  /** 拍子轻重：这位跟多少（按乐器类别，src/score/groove.ts followOf）。 */
  follow: (s: GrooveStyle) => number;
}
export interface TimelineInput {
  song: Song;
  /** 放的顺序（编排；本段 = 只这一张）。 */
  order: string[];
  /** 出声的声部（静音 / 独奏已经筛过）。 */
  parts: PartDef[];
  info: (part: PartDef) => PerformerInfo;
  hum: Hum;
  /** 月读核心的哼的参数（main.ts humOpt）；进内容键。 */
  singOpt: Record<string, unknown>;
}
/** 月读要唱的一块（主线程拿去让 worker 唱、按 key 喂给录音房）。 */
export interface ChunkPlan { part: string; key: string; score: LabScore; lang: SingLang; t0: number; dur: number }
export interface PaperSpan { paper: PaperSeg; tick0: number; t0: number; t1: number }
export interface Timeline {
  tracks: TrackSpec[];
  range: { from: number; to: number };
  /** 谱的总长（秒；不含月读的提前量 / 尾巴）。 */
  total: number;
  chunks: ChunkPlan[];
  papers: PaperSpan[];
  /** 没法出声的声部（没人上场）：不出声、报出来、人换（不自动替补）。 */
  unplayable: { part: string; why: string }[];
  /** 这个声部里 id = tokenId 的那个 token 在时间线上的秒（不是音 = 后面第一个音的时刻；不在放的范围里 = null）。 */
  secondsOfToken(partId: string, tokenId: number): number | null;
  /** 第 sec 秒落在哪张纸的第几个 tick（纸自己的 tick，反复已折回去；画播放头用）。 */
  locate(sec: number): { paperId: string; tick: number } | null;
}

/** 歌词里有汉字、没有假名 → 按中文唱；其余（含没有歌词）按日语唱。按一个声部（压平后的一串）判。 */
export function songLangOf(tokens: readonly Token[], hum: Hum): SingLang {
  const ls = tokens.flatMap((t) => (t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : [])).join("");
  // 英文：歌词里有拉丁字母、没有假名也没有汉字（user「好吧英文先做完」）；中英日混着的歌第一版按日 / 中唱
  if (/[A-Za-z]/.test(ls) && !/[\p{Script=Han}぀-ヿ]/u.test(ls)) return "en";
  // 整首没写歌词时，哼「啦」「呜」用中文唱（日语 ら 是轻弹舌、う 不圆唇；user「呜还是啊，拉也不行」）
  if (!ls && (hum === "la" || hum === "u")) return "zh";
  return /\p{Script=Han}/u.test(ls) && !/[぀-ヿ]/.test(ls) ? "zh" : "ja";
}

/** 轻量版 / SoundFont 的音符表（秒）：tie 并成一个长音。marks = 修的记号怎么落到这一路上（跳音截短、呼吸处收短一口气）；不给 = 照谱满长。 */
export function lightNotes(tokens: Token[], tempoMap: TempoMap, poly = false, marks?: { staccatoGate: number; breath: boolean; gapSec: number }, velOf?: (index: number, art: readonly string[]) => number): { midi: number; t0: number; t1: number; vel?: number }[] {
  const notes: { midi: number; t0: number; t1: number; vel?: number }[] = [];
  let open = new Map<number, { midi: number; t0: number; t1: number; vel?: number }>();   // 上一个音正在响的各音高（连音线按音高接；力度跟第一段）
  for (const { index, tok, t0, t1 } of timeline(tokens, tempoMap)) {
    if (tok.kind !== "note") continue;
    const ps = poly && tok.pitch ? allPitches(tok as NoteTok) : [effectivePitch(tokens, index)];   // 单声引擎只拿最上面那条线
    const nextOpen = new Map<number, { midi: number; t0: number; t1: number; vel?: number }>();
    for (const p of ps) {
      const midi = midiOf(p), prev = tok.tie ? open.get(midi) : undefined;
      if (prev) { prev.t1 = marks ? noteEnd(t0, t1, tok.art ?? [], marks, !!tok.slur) : t1; nextOpen.set(midi, prev); continue; }
      const n = { midi, t0, t1: marks ? noteEnd(t0, t1, tok.art ?? [], marks, !!tok.slur) : t1, ...(velOf ? { vel: velOf(index, tok.art ?? []) } : {}) }; notes.push(n); nextOpen.set(midi, n);
    }
    open = nextOpen;
  }
  return notes;
}

export const HUM_KANA: Record<Hum, string> = { la: "ら", n: "ん", u: "う", o: "お", a: "あ" };

export function buildTimeline(inp: TimelineInput): Timeline {
  const { song, order, hum } = inp;
  const map = tempoMapOf(song, order), gmap = grooveMapOf(song, order);
  const flats = new Map<string, { tokens: Token[]; starts: { index: number; paper: PaperSeg }[] }>();
  const flat = (partId: string) => { let f = flats.get(partId); if (!f) { f = flattenPart(song, partId, { order }); flats.set(partId, f); } return f; };
  const tracks: TrackSpec[] = [], chunks: ChunkPlan[] = [], unplayable: { part: string; why: string }[] = [];
  let total = 0, from = 0, to = 0;
  for (const part of inp.parts) {
    const { tokens, starts } = flat(part.id), bounds = starts.map((s) => s.index), tl = timeline(tokens, map);
    if (tl.length) total = Math.max(total, tl[tl.length - 1].t1);
    const info = inp.info(part);
    if (info.engine === "unknown") { unplayable.push({ part: part.id, why: "还没有人上场" }); continue; }
    const groove = grooveWeights(tokens, bounds, gmap, info.follow);
    const gain: GainSeg[] | null = gainSegments(tokens, map, info.spec, bounds, groove);
    if (info.engine === "tsukuyomi") {
      const lang = songLangOf(tokens, hum), mode = info.chunk;
      const noteAt = (a: number) => tl.find((x) => x.index >= a && x.tok.kind === "note")?.t0 ?? 0;
      const ranges = singChunks(tokens, map, mode === "sheet" ? bounds : [], mode);   // 每句：只看休止，不看纸界
      const clips: TrackSpec & { kind: "clips" } = { id: part.id, kind: "clips", clips: [], gain };
      for (const [a, b] of ranges) {
        const score = toLabScore(tokens, hum, lang, map, info.spec.sing, [a, b]);
        if (!score.SCORE.length) continue;
        const first = noteAt(a), last = tl.filter((x) => x.index >= a && x.index < b && x.tok.kind === "note").reduce((m, x) => Math.max(m, x.t1), first);
        const key = JSON.stringify(["tsukuyomi-chunk", score, inp.singOpt]), t0 = first - LEAD_IN, dur = last - first + LEAD_IN + SUNG_TAIL;
        clips.clips.push({ key, t0, dur, gain: SUNG_GAIN });
        chunks.push({ part: part.id, key, score, lang, t0, dur });
        from = Math.min(from, t0); to = Math.max(to, t0 + dur);
      }
      tracks.push(clips);
      continue;
    }
    const vels = noteVelocities(tokens, map, info.spec, info.velocity, bounds, groove);
    const notes = lightNotes(tokens, map, info.engine === "soundfont", lightMarks(info.spec), (i) => vels.get(i) ?? info.velocity);
    if (info.engine === "vowel-sampler") {
      tracks.push({ id: part.id, kind: "vowel", kana: HUM_KANA[hum ?? "n"], notes: notes.map((n): NoteEv => ({ t0: n.t0, t1: n.t1, key: n.midi, vel: n.vel ?? info.velocity, preset: 0 })), gain });
      continue;
    }
    const g = info.gm;
    if (!g) { unplayable.push({ part: part.id, why: "台上的不是 SoundFont 乐器" }); continue; }
    tracks.push({ id: part.id, kind: "sf", sha: g.sha, notes: notes.map((n): NoteEv => ({ t0: n.t0, t1: n.t1, key: sfKey(n.midi, g, info.transpose), vel: n.vel ?? info.velocity, preset: g.presetIndex })), gain });
  }
  to = Math.max(to, total);
  // 纸的秒区间（所有声部压平后的纸序列一样：缺这个声部的纸补了休止）
  const ref = inp.parts[0] ?? song.parts[0];
  const papers: PaperSpan[] = [];
  if (ref) {
    const { tokens, starts } = flat(ref.id), tl = timeline(tokens, map);
    const secAt = (index: number) => tl.find((x) => x.index >= index)?.t0 ?? (tl.length ? tl[tl.length - 1].t1 : 0);
    const tickAt = (index: number) => tl.find((x) => x.index >= index)?.start ?? (tl.length ? tl[tl.length - 1].start + tl[tl.length - 1].tok.dur : 0);
    starts.forEach((s, k) => { const nextIndex = starts[k + 1]?.index ?? tokens.length; papers.push({ paper: s.paper, tick0: tickAt(s.index), t0: secAt(s.index), t1: secAt(nextIndex) }); });
    if (papers.length && tl.length) papers[papers.length - 1].t1 = tl[tl.length - 1].t1;
  }
  const secondsOfToken = (partId: string, tokenId: number): number | null => {
    const f = flats.get(partId) ?? flat(partId), tl = timeline(f.tokens, map);
    const i = f.tokens.findIndex((t) => t.id === tokenId); if (i < 0) return null;
    return tl.find((x) => x.index >= i)?.t0 ?? (tl.length ? tl[tl.length - 1].t1 : null);
  };
  const locate = (sec: number): { paperId: string; tick: number } | null => {
    if (!ref) return null;
    const { tokens } = flat(ref.id), tl = timeline(tokens, map);
    const e = tl.find((x) => sec >= x.t0 && sec < x.t1) ?? (sec >= 0 && tl.length && sec < tl[tl.length - 1].t1 + 1e-9 ? tl[tl.length - 1] : null);
    if (!e) return null;
    const tick = e.start + ((sec - e.t0) / Math.max(1e-9, e.t1 - e.t0)) * e.tok.dur;
    let span = papers[0]; for (const p of papers) if (p.tick0 <= tick + 1e-9) span = p;
    if (!span) return null;
    let inPaper = tick - span.tick0;
    // 谱内反复展开过：展开后的 tick → 纸自己的 tick（src/score/repeats.ts）
    const owner = tempoOwner(song, span.paper), segs = owner ? playSegments(span.paper.tracks[owner], paperTicks(span.paper)) : null;
    if (segs) { let cum = 0; for (const s of segs) { const len = s.t1 - s.t0; if (inPaper < cum + len) { inPaper = s.t0 + (inPaper - cum); break; } cum += len; } }
    return { paperId: span.paper.id, tick: Math.max(0, Math.floor(inPaper)) };
  };
  return { tracks, range: { from, to }, total, chunks, papers, unplayable, secondsOfToken, locate };
}
