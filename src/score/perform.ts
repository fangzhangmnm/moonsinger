// perform.ts —— 谱上的「修」→ 出声的数（纯函数，Node 里可测）。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08 拍「挂在音上 + 选区条」「月读在那儿换气」。数从哪来：上场那位 by value 带着的力度表（dynamicsDb，mf = 0 dB）和演奏法（articulation：
//   staccatoGate 跳音吃掉时值的多少、accentDb 重音加多少）——契约 CandidateV2，app 改默认动不到旧歌。
// 怎么出声（各引擎一样的部分在这里，引擎特有的在调用方）：
//   力度 + 重音 = 一条按时间的音量曲线（谱的时钟，秒），渲染完乘上去（src/audio/mix.ts applyGain）；一个力度 / 重音都没有 = null = 不碰声音（和以前逐样本一样）。
//   跳音：SoundFont / 元音版把音截短（lightNotes，乐器自己的余音照常收）；月读截不短（唱法核心按谱唱满）→ 曲线在音的后半段收声（gateStaccato）。
//   呼吸：月读 = 下一个字前「v」（lab-score.ts）；元音版和乐器 = 前一个音收短一点（lightNotes；乐器上的逗号 = 稍微断开再进下一个音，管乐 / 人声就是换气；
//   2026-10-08 user「breath是否应该对大量GS乐器也生效。毕竟不断气一直拖着也不对，fl你还得手动调一下时长」）。
import { type Token, type NoteTok, type TempoMap, type Dyn, timeline, artOf, DEFAULT_DYN } from "./song.ts";
import { MARK_DEFAULTS } from "../format/performance.ts";
const DEFAULT_DYN_KEY: Dyn = DEFAULT_DYN;

export interface PerfSpec { dynamicsDb: Record<Dyn, number>; staccatoGate: number; accentDb: number; marcatoDb?: number;
  /** 记号怎么解读的其余的数（候选 articulation by value；没给 = MARK_DEFAULTS）。 */
  accentSec?: number; breathSec?: number; breathShare?: number; gapShare?: number; wedgeStepDb?: number; wedgeStepVel?: number;
  /** 有 = 力度记号 / 重音 / 强音走 MIDI 力度（SoundFont 新候选），音量曲线就不再管它们；没有 = 走 dB（月读 / 元音版 / 旧候选）。 */
  dynamicsVel?: Record<Dyn, number> | null; accentVel?: number; marcatoVel?: number }
const M = MARK_DEFAULTS;   // 演奏者没写的键用它（= 这一版之前写死的数）
/** 音量曲线的一段：t0–t1（秒，谱的时钟）这段多少 dB；-Infinity = 静音。 */
export interface GainSeg { t0: number; t1: number; dB: number }

/** 一个声部的音量曲线。gateStaccato = 跳音靠收声（月读）。全程 0 dB = null。 */
export function gainSegments(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, bounds?: readonly number[]): GainSeg[] | null {
  const segs: GainSeg[] = [];
  let any = false;
  const vel = !!spec.dynamicsVel;   // 力度记号 / 重音 / 强音 / 渐强渐弱走 MIDI 力度（noteVelocities）：这条曲线只剩跳音收声
  const levels = vel ? null : dynLevels(tokens, map, spec.dynamicsDb, spec.dynamicsDb[DEFAULT_DYN_KEY] ?? 0, spec.wedgeStepDb ?? M.wedgeStepDb, bounds);
  /** 渐强渐弱：一个音里面的 dB 从 a 走到 b（切成小段；月读一个长音也能渐强）。 */
  const ramp = (a: number, b: number, s0: number, s1: number) => { const n = Math.max(1, Math.min(32, Math.ceil((s1 - s0) / 0.03))); for (let k = 0; k < n; k++) segs.push({ t0: s0 + ((s1 - s0) * k) / n, t1: s0 + ((s1 - s0) * (k + 1)) / n, dB: a + ((b - a) * (k + 0.5)) / n }); };
  for (const { index, tok, t0, t1 } of timeline(tokens, map)) {
    const L = levels?.get(index), base = L ? L.at0 : 0, baseEnd = L ? L.at1 : 0;
    if (base !== 0 || baseEnd !== 0) any = true;
    if (tok.kind !== "note") { if (baseEnd !== base) ramp(base, baseEnd, t0, t1); else segs.push({ t0, t1, dB: base }); continue; }
    const art = artOf(tok);
    let cur = t0;
    const boost = vel ? 0 : art.includes("marcato") ? (spec.marcatoDb ?? spec.accentDb + 3) : art.includes("accent") ? spec.accentDb : 0;   // 强音比重音重；两个都标 = 按强音
    if (boost) { const e = Math.min(t1, t0 + (spec.accentSec ?? M.accentSec)); segs.push({ t0, t1: e, dB: base + boost }); cur = e; any = true; }
    if (t1 > cur) { if (baseEnd !== base) ramp(base + ((baseEnd - base) * (cur - t0)) / Math.max(1e-9, t1 - t0), baseEnd, cur, t1); else segs.push({ t0: cur, t1, dB: base }); }
  }
  return any ? segs : null;
}

/** 轻量版 / SoundFont 一个音的结束时刻（秒）：跳音截到 staccatoGate；呼吸（只给元音版）= 收短一口气的空当（同唱法核心的 v：至多 0.16 s / 25%）。 */
export function noteEnd(t0: number, t1: number, art: readonly string[], o: { staccatoGate: number; breath: boolean; gapSec?: number; gapShare?: number; breathSec?: number; breathShare?: number }, slur = false): number {
  let end = t1;
  if (art.includes("staccato")) end = t0 + (t1 - t0) * o.staccatoGate;
  // 连断的底色：不写记号的音留 gapSec 的缝（最多吃掉这个音的 1/4，短音不被吃光）；连线（连到下一个）/ 保持 = 不留（2026-10-08，user「连断 预设 都同意」）
  else if (!slur && !art.includes("tenuto") && (o.gapSec ?? 0) > 0) end = t1 - Math.min(o.gapSec!, (o.gapShare ?? M.gapShare) * (t1 - t0));
  if (o.breath && art.includes("breath")) end = Math.min(end, t1 - Math.min(o.breathSec ?? M.breathSec, (o.breathShare ?? M.breathShare) * (t1 - t0)));
  return end;
}

/** 渐强渐弱的终点：同一张纸里（bounds = 每张纸在这一串里从第几个起；不给 = 整串一张），后面第一个力度记号 / 下一个渐强渐弱 / 纸尾。 */
export function hairpinEnd(tokens: Token[], i: number, bounds?: readonly number[]): { kind: "dyn" | "hairpin" | "end"; at: number } {
  const pe = paperEndOf(i, tokens.length, bounds);
  for (let j = i + 1; j < pe; j++) { const k = tokens[j].kind; if (k === "dyn" || k === "hairpin") return { kind: k, at: j }; }
  return { kind: "end", at: pe };
}
const paperEndOf = (i: number, n: number, bounds?: readonly number[]) => { for (const b of bounds ?? []) if (b > i) return b; return n; };
/** 每个有时值的 token（音 / 休止）的力度水平：音头 at0、音尾 at1（单位 = 表的单位：MIDI 力度或 dB）。力度记号（查 table）= 状态，从这儿起；
 *  渐强 / 渐弱记号 = 过渡：从它后面第一个音的音头，线性变到同一张纸里下一个力度记号生效的那个音的音头；先遇到另一个渐强渐弱 = 到那儿为止、走一档；
 *  都没有 = 到纸尾、走一档（step，卡在表的最小最大之间；谱上灰字披露）。前面一个力度记号都没有 = def（演奏者的默认 / 旋钮）。
 *  2026-10-08，user「所以<>是一个语义，就是从这一刻开始连续变到下一个强度/速度标记？」「过渡到这张纸的结尾…走一档也行，更合理，需要向用户披露」。 */
export function dynLevels(tokens: Token[], map: TempoMap | undefined, table: Record<Dyn, number>, def: number, step: number, bounds?: readonly number[]): Map<number, { at0: number; at1: number }> {
  const out = new Map<number, { at0: number; at1: number }>(), tl = timeline(tokens, map), at = new Map(tl.map((x) => [x.index, x]));
  const lo = Math.min(...Object.values(table)), hi = Math.max(...Object.values(table));
  const onsetFrom = (j: number, stop = tokens.length) => { for (let k = j; k < stop; k++) { const x = at.get(k); if (x) return x; } return null; };   // j 起第一个有时值的
  const endBefore = (j: number) => { for (let k = j - 1; k >= 0; k--) { const x = at.get(k); if (x) return x.t1; } return 0; };
  let cur = def, ramp: { from: number; to: number; T0: number; T1: number; end: number } | null = null;
  const lvl = (t: number) => (ramp ? ramp.from + (ramp.to - ramp.from) * Math.max(0, Math.min(1, ramp.T1 > ramp.T0 ? (t - ramp.T0) / (ramp.T1 - ramp.T0) : 1)) : cur);
  for (let i = 0; i < tokens.length; i++) {
    if (ramp && i >= ramp.end) { cur = ramp.to; ramp = null; }
    const t = tokens[i];
    if (t.kind === "dyn") { if (!ramp) cur = table[t.value]; continue; }
    if (t.kind === "hairpin") {
      const e = hairpinEnd(tokens, i, bounds), start = onsetFrom(i + 1, e.at);
      if (!start) continue;   // 它和终点之间一个音都没有 = 不起作用
      const to = e.kind === "dyn" ? table[(tokens[e.at] as Extract<Token, { kind: "dyn" }>).value] : Math.max(lo, Math.min(hi, cur + (t.dir === "cresc" ? step : -step)));
      const T1 = e.kind === "end" ? endBefore(e.at) : (onsetFrom(e.at, paperEndOf(i, tokens.length, bounds))?.t0 ?? endBefore(e.at));
      ramp = { from: cur, to, T0: start.t0, T1, end: e.at };
      continue;
    }
    const x = at.get(i); if (!x) continue;
    out.set(i, { at0: lvl(x.t0), at1: lvl(x.t1) });
  }
  return out;
}
/** 一个音的 MIDI 力度（0–1，= 力度 ÷ 127；SoundFont 这一路）。有力度表：前面最近的力度记号查表，没有记号 = 演奏者的默认力度（defaultVel，乐器页的旋钮）；
 *  再加重音 / 强音。没有力度表（旧候选）= 一律 defaultVel（力度记号照旧走 dB）。2026-10-08 user「应该send的就是velocity！」「力度就是velocity」。 */
export function noteVelocity(tokens: Token[], index: number, art: readonly string[], spec: PerfSpec, defaultVel: number): number {
  if (!spec.dynamicsVel) return defaultVel;
  const l = dynLevels(tokens, undefined, spec.dynamicsVel, defaultVel * 127, spec.wedgeStepVel ?? M.wedgeStepVel).get(index);
  return noteVel(l ? l.at0 : defaultVel * 127, art, spec);
}
/** 一整条的每个音的力度（index → 0–1）：力度记号 + 渐强渐弱（dynLevels，取音头）+ 重音 / 强音。没有力度表 = 一律 defaultVel。 */
export function noteVelocities(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, defaultVel: number, bounds?: readonly number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!spec.dynamicsVel) { tokens.forEach((t, i) => { if (t.kind === "note") out.set(i, defaultVel); }); return out; }
  for (const [i, l] of dynLevels(tokens, map, spec.dynamicsVel, defaultVel * 127, spec.wedgeStepVel ?? M.wedgeStepVel, bounds)) { const t = tokens[i]; if (t.kind === "note") out.set(i, noteVel(l.at0, artOf(t), spec)); }
  return out;
}
const noteVel = (v: number, art: readonly string[], spec: PerfSpec) => {
  if (art.includes("marcato")) v += spec.marcatoVel ?? 0; else if (art.includes("accent")) v += spec.accentVel ?? 0;
  return Math.max(1, Math.min(127, Math.round(v))) / 127;
};
/** 谁认哪些记号（2026-10-08 Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。
 *  这张表必须和上面真做的事一致——跳音：月读 = gainSegments 后半段收声，元音版 / SoundFont = noteEnd 截短；重音、力度：所有引擎走 gainSegments；
 *  呼吸：月读 = 唱法核心换气（lab-score），元音版 / SoundFont = noteEnd 收短（lightMarks）；
 *  保持 / 连线：元音版 / SoundFont = 这个音不留底色的缝（gapSec > 0 才有区别），月读还不认（连断第 3 步）。test/honors.test.ts 守着。
 *  不在表里的引擎（没人上场 / 认不出的）= null：整个声部本来就不出声，不再逐个记号画灰。 */
const HONORS: Record<string, readonly string[]> = {
  tsukuyomi: ["staccato", "accent", "marcato", "breath"],                            // 连线 / 保持：她本来就连着唱（whyIgnored = "sung"）；唱法核心的「断」是连断第 3 步
  "vowel-sampler": ["staccato", "accent", "marcato", "breath", "tenuto", "slur"],
  soundfont: ["staccato", "accent", "marcato", "breath", "tenuto", "slur"],
};
/** 连线 / 保持只改「留不留缝」：这位底色本来就不留缝（gapSec = 0）= 写了也不变 → 一样画灰、明说。 */
const GAP_ONLY = ["tenuto", "slur"];
export const ALL_MARKS = ["staccato", "accent", "marcato", "tenuto", "breath", "slur"] as const;
export type Mark = (typeof ALL_MARKS)[number];
/** 这位不认的记号（写在谱上照画、画灰，出声不受影响）：引擎没实现的 + 底色不留缝时的连线 / 保持。 */
export function ignoredArts(engine: string | null | undefined, gapSec = 0): Mark[] {
  const h = engine ? HONORS[engine] : undefined;
  return h ? ALL_MARKS.filter((a) => !h.includes(a) || (GAP_ONLY.includes(a) && !(gapSec > 0))) : [];
}
/** 为什么不认（明说用）：引擎没实现 = "engine"；底色不留缝 = "gap"；月读的连线 / 保持 = "sung"——她本来就连着唱，连线 / 保持对她不改变什么，
 *  断句用呼吸（连线和呼吸是同一件事的两头：音和下一个音之间连还是断；2026-10-08 user「连线vs呼吸这两个干的是不是一件事…月读是最需要断句的」）。 */
export function whyIgnored(engine: string | null | undefined, m: Mark): "engine" | "gap" | "sung" {
  if (engine === "tsukuyomi" && GAP_ONLY.includes(m)) return "sung";
  return engine && HONORS[engine]?.includes(m) ? "gap" : "engine";
}
/** 元音版 / SoundFont 这一路（lightNotes）怎么落修的记号：跳音截到 staccatoGate、呼吸收短一口气（两种引擎一样；月读不走这条，走唱谱 + 音量曲线）。
 *  main.ts 的出声和 test/honors.test.ts 都从这里取，不各写一份。 */
export function lightMarks(spec: { staccatoGate: number; gapSec?: number; gapShare?: number; breathSec?: number; breathShare?: number }): { staccatoGate: number; breath: boolean; gapSec: number; gapShare: number; breathSec: number; breathShare: number } {
  return { staccatoGate: spec.staccatoGate, breath: true, gapSec: spec.gapSec ?? 0, gapShare: spec.gapShare ?? M.gapShare, breathSec: spec.breathSec ?? M.breathSec, breathShare: spec.breathShare ?? M.breathShare };
}
