// perform.ts —— 谱上的「修」→ 出声的数（纯函数，Node 里可测）。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08 拍「挂在音上 + 选区条」「月读在那儿换气」。数从哪来：上场那位 by value 带着的力度表（dynamicsDb，mf = 0 dB）和演奏法（articulation：
//   staccatoGate 跳音吃掉时值的多少、accentDb 重音加多少）——契约 CandidateV2，app 改默认动不到旧歌。
// 怎么出声（各引擎一样的部分在这里，引擎特有的在调用方）：
//   力度 + 重音 = 一条按时间的音量曲线（谱的时钟，秒），渲染完乘上去（src/audio/mix.ts applyGain）；一个力度 / 重音都没有 = null = 不碰声音（和以前逐样本一样）。
//   跳音：SoundFont / 元音版把音截短（lightNotes，乐器自己的余音照常收）；月读截不短（唱法核心按谱唱满）→ 曲线在音的后半段收声（gateStaccato）。
//   呼吸：月读 = 下一个字前「v」（lab-score.ts）；元音版和乐器 = 前一个音收短一点（lightNotes；乐器上的逗号 = 稍微断开再进下一个音，管乐 / 人声就是换气；
//   2026-10-08 user「breath是否应该对大量GS乐器也生效。毕竟不断气一直拖着也不对，fl你还得手动调一下时长」）。
import { type Token, type NoteTok, type TempoMap, type Dyn, timeline, artOf, swellOf, DEFAULT_DYN, rampTarget, isTimed } from "./song.ts";
import { MARK_DEFAULTS } from "../format/performance.ts";
const DEFAULT_DYN_KEY: Dyn = DEFAULT_DYN;

export interface PerfSpec { dynamicsDb: Record<Dyn, number>; staccatoGate: number; accentDb: number; marcatoDb?: number;
  /** 记号怎么解读的其余的数（候选 articulation by value；没给 = MARK_DEFAULTS）。 */
  accentSec?: number; breathSec?: number; breathShare?: number; gapShare?: number; wedgeStepDb?: number; wedgeStepVel?: number;
  sfzDb?: number; sfzVel?: number; sfzSec?: number; fpSec?: number; swellDb?: number; canSwell?: boolean;
  stressDb?: number; stressVel?: number; unstressDb?: number; unstressVel?: number; ghostDb?: number; ghostVel?: number;
  /** 有 = 力度记号 / 重音 / 强音走 MIDI 力度（SoundFont 新候选），音量曲线就不再管它们；没有 = 走 dB（月读 / 元音版 / 旧候选）。 */
  dynamicsVel?: Record<Dyn, number> | null; accentVel?: number; marcatoVel?: number }
const M = MARK_DEFAULTS;   // 演奏者没写的键用它（= 这一版之前写死的数）
/** 音量曲线的一段：t0–t1（秒，谱的时钟）这段多少 dB；-Infinity = 静音。 */
export interface GainSeg { t0: number; t1: number; dB: number }

/** 一个声部的音量曲线。gateStaccato = 跳音靠收声（月读）。全程 0 dB = null。
 *  groove = 拍子轻重（下标 → 权重，src/score/groove.ts；已乘过幅度和跟多少）：正的 = 按次重音的量在音头加，负的 = 按弱化的量整个音轻下去（写了音头记号的音不在里面）。 */
export function gainSegments(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, bounds?: readonly number[], groove?: ReadonlyMap<number, number>): GainSeg[] | null {
  const segs: GainSeg[] = [];
  let any = false;
  const vel = !!spec.dynamicsVel;   // 力度记号 / 重音 / 强音 / 渐强渐弱走 MIDI 力度（noteVelocities）：这条曲线只剩跳音收声
  const levels = vel ? null : dynLevels(tokens, map, spec.dynamicsDb, spec.dynamicsDb[DEFAULT_DYN_KEY] ?? 0, spec.wedgeStepDb ?? M.wedgeStepDb, bounds);
  /** 渐强渐弱：一个音里面的 dB 从 a 走到 b（切成小段；月读一个长音也能渐强）。 */
  const ramp = (a: number, b: number, s0: number, s1: number) => { const n = Math.max(1, Math.min(32, Math.ceil((s1 - s0) / 0.03))); for (let k = 0; k < n; k++) segs.push({ t0: s0 + ((s1 - s0) * k) / n, t1: s0 + ((s1 - s0) * (k + 1)) / n, dB: a + ((b - a) * (k + 0.5)) / n }); };
  for (const { index, tok, t0, t1 } of timeline(tokens, map)) {
    const gw = vel ? 0 : groove?.get(index) ?? 0;   // 拍子轻重（dB 那一路；力度那一路在 noteVel）
    const L = levels?.get(index), soft = tok.kind === "note" && !vel ? (artOf(tok).includes("ghost") ? spec.ghostDb ?? M.ghostDb : artOf(tok).includes("unstress") ? spec.unstressDb ?? M.unstressDb : gw < 0 ? -gw * (spec.unstressDb ?? M.unstressDb) : 0) : 0;
    const base = (L ? L.at0 : 0) + soft, baseEnd = (L ? L.at1 : 0) + soft;   // 弱化 / 幽灵音：整个音轻下去（dB 那一路；力度那一路在 noteVel）
    if (base !== 0 || baseEnd !== 0) any = true;
    if (tok.kind !== "note") { if (baseEnd !== base) ramp(base, baseEnd, t0, t1); else segs.push({ t0, t1, dB: base }); continue; }
    const art = artOf(tok);
    let cur = t0;
    // 音头那一组（互斥）：重音 / 强音 = 音头一小段加 dB；突强 = 冲高 sfzDb、sfzSec 里落回当下；强后即弱 = 音头这位的 f、fpSec 里落到 p（之后都是 p，dynLevels 管）
    // 音内的力度起伏（< / > / <>，音自己的事；swellDb 由演奏者配置）：做不到在一个音里变强的（canSwell = false：钢琴、拨弦…）只做 >
    const sw0 = swellOf(tok), sw = sw0 && !(spec.canSwell === false && sw0 !== ">") ? sw0 : null, D = spec.swellDb ?? M.swellDb;
    // 包络只往下乘（v0.9.29；user 2026-10-10「音内减弱渐强和鼓起都是最大值对应的本来原始值，就是乘一个小于一的包罗，而不是大于一的」→「鼓包改」）：
    //   写的力度 = 这个音的最高点；< 从 −D 长到写的力度、> 从写的力度收到 −D、<> 两头 −D 中间回到写的力度。一个音永远不比写的力度更响。
    const swOff = (fr: number) => (sw === "<" ? -D * (1 - fr) : sw === ">" ? -D * fr : sw === "<>" ? -D * Math.abs(2 * fr - 1) : 0);
    const shaped = (a0: number, a1: number, s0: number, s1: number) => {   // s0–s1 这段：底下的水平从 a0 走到 a1（按整个音的进度），再叠上音内起伏
      const n = Math.max(2, Math.min(48, Math.ceil((s1 - s0) / 0.03)));
      for (let k = 0; k < n; k++) { const a = s0 + ((s1 - s0) * k) / n, b = s0 + ((s1 - s0) * (k + 1)) / n, m = (a + b) / 2, fr = (m - t0) / Math.max(1e-9, t1 - t0), fs = (m - s0) / Math.max(1e-9, s1 - s0);
        segs.push({ t0: a, t1: b, dB: a0 + (a1 - a0) * fs + swOff(fr) }); }
      any = true;
    };
    if (art.includes("fp")) {
      const f = spec.dynamicsDb.f ?? 6, p = spec.dynamicsDb.p ?? -12, e = Math.min(t1, t0 + (spec.fpSec ?? M.fpSec));
      if (vel) ramp(0, p - f, t0, e); else ramp(f, p, t0, e);   // 力度那一路：音头已经按 f 的力度弹了，这里只把它压到 p
      if (t1 > e) {   // fp 之后再 <（贝多芬常用）：从 p 长回去，最多回到音头的 f（不超过写的）；<> = p → f → p；> = 在 p 上再往下收
        const lo = vel ? p - f : p, hi = vel ? 0 : f;
        if (sw === "<") ramp(lo, hi, e, t1);
        else if (sw === "<>") { const m = (e + t1) / 2; ramp(lo, hi, e, m); ramp(hi, lo, m, t1); }
        else if (sw) shaped(lo, lo, e, t1); else segs.push({ t0: e, t1, dB: lo });
      }
      any = true; continue;
    }
    if (art.includes("sfz") && !vel) { const e = Math.min(t1, t0 + (spec.sfzSec ?? M.sfzSec)), b = spec.sfzDb ?? M.sfzDb; ramp(base + b, baseEnd === base ? base : base + ((baseEnd - base) * (e - t0)) / Math.max(1e-9, t1 - t0), t0, e); cur = e; any = true; }
    const boost = vel ? 0 : art.includes("marcato") ? (spec.marcatoDb ?? spec.accentDb + 3) : art.includes("accent") ? spec.accentDb : art.includes("stress") ? (spec.stressDb ?? M.stressDb) : gw > 0 ? gw * (spec.stressDb ?? M.stressDb) : 0;   // 强音比重音重、次重音比重音轻；拍子轻重 = 次重音的几分之几
    if (boost) { const e = Math.min(t1, t0 + (spec.accentSec ?? M.accentSec)); segs.push({ t0, t1: e, dB: base + boost }); cur = e; any = true; }
    if (t1 > cur) {
      const a0 = base + ((baseEnd - base) * (cur - t0)) / Math.max(1e-9, t1 - t0);
      if (sw) shaped(a0, baseEnd, cur, t1); else if (baseEnd !== base) ramp(a0, baseEnd, cur, t1); else segs.push({ t0: cur, t1, dB: base });
    }
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
    if (t.kind === "dyn") {
      if (!ramp) cur = table[t.value];
      // 渐到：这张纸里下一个力度记号写着「从上一个渐变过来」、中间没有手写的渐强渐弱 = 从这儿后面第一个音一路变到它那个音的音头（关键帧线性插值；
      //   user「渐到 同意…其实就是有一个start位置和一开始就均匀插值的问题」；dB / 力度本来就是对数的量，线性插就是听感上均匀）
      const pe = paperEndOf(i, tokens.length, bounds), j: number = ramp ? -1 : rampTarget(tokens, i, pe), start = j >= 0 ? onsetFrom(i + 1, j) : null;
      if (j >= 0 && start) ramp = { from: cur, to: table[(tokens[j] as Extract<Token, { kind: "dyn" }>).value], T0: start.t0, T1: onsetFrom(j, pe)?.t0 ?? endBefore(j), end: j };
      continue;
    }
    if (t.kind === "hairpin") {
      const e = hairpinEnd(tokens, i, bounds), start = onsetFrom(i + 1, e.at);
      if (!start) continue;   // 它和终点之间一个音都没有 = 不起作用
      // 终点是力度记号、但和方向反着（渐弱后面接更强的 / 一样的；渐强后面接更弱的 / 一样的）= **记号的方向说了算**：先按方向走一档，到那个力度记号再突变（subito）
      //   （2026-10-08 user 拍：「记号的方向说了算。先按渐弱方向走一档，到那个 f 再突变…同意」；贝多芬的「cresc. … subito p」）。谱上发夹末端画灰字推定的那一档（engrave）
      const endVal = e.kind === "dyn" ? table[(tokens[e.at] as Extract<Token, { kind: "dyn" }>).value] : null, oneStep = Math.max(lo, Math.min(hi, cur + (t.dir === "cresc" ? step : -step)));
      const agrees = endVal !== null && (t.dir === "cresc" ? endVal > cur : endVal < cur);
      const to = agrees ? endVal! : oneStep;
      const T1 = e.kind === "end" ? endBefore(e.at) : (onsetFrom(e.at, paperEndOf(i, tokens.length, bounds))?.t0 ?? endBefore(e.at));
      ramp = { from: cur, to, T0: start.t0, T1, end: e.at };
      continue;
    }
    const x = at.get(i); if (!x) continue;
    out.set(i, { at0: lvl(x.t0), at1: lvl(x.t1) });
    if (t.kind === "note" && !ramp && artOf(t).includes("fp")) cur = table.p;   // 强后即弱：之后的音都是 p（它也是一个新状态）
  }
  return out;
}
/** 被强后即弱盖掉、不起作用的力度记号（下标）：紧跟着的那个音是 fp（音头按 f、随后落到 p，之后都是 p——不看前面的力度），
 *  而且它也不是渐强渐弱 / 渐到的起点或终点。判法 = 把它换成别的值，除了 fp 那个音以外每个音的力度水平都不变（和出声同一个函数 dynLevels，不另写规则）。
 *  谱上画灰、点开说为什么（纪律「做不到的一律画灰 + 明说」；2026-10-09 user「要不要按纪律把 mf 画灰、说一句？ 要」）。 */
export function dynOverridden(tokens: Token[], bounds?: readonly number[]): Set<number> {
  const out = new Set<number>();
  const T: Record<Dyn, number> = { ppp: 0, pp: 1, p: 2, mp: 3, mf: 4, f: 5, ff: 6, fff: 7 };
  const fpNotes = new Set<number>(); tokens.forEach((t, k) => { if (t.kind === "note" && artOf(t).includes("fp")) fpNotes.add(k); });
  if (!fpNotes.size) return out;
  const levels = (ts: Token[]) => [...dynLevels(ts, undefined, T, 0, 0.5, bounds)].filter(([k]) => !fpNotes.has(k)).map(([k, l]) => `${k}:${l.at0}:${l.at1}`).join("|");
  let base: string | null = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]; if (t.kind !== "dyn") continue;
    let j = i + 1; while (j < tokens.length && !isTimed(tokens[j])) j++;
    if (!fpNotes.has(j)) continue;   // 先筛：只有紧跟着 fp 的才可能被盖掉
    base ??= levels(tokens);
    const alt = (v: Dyn) => levels(tokens.map((x, k) => (k === i ? { ...t, value: v } : x)));
    if (alt(t.value === "pp" ? "ff" : "pp") === base && alt(t.value === "mf" ? "p" : "mf") === base) out.add(i);
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
/** 一整条的每个音的力度（index → 0–1）：力度记号 + 渐强渐弱（dynLevels，取音头）+ 重音 / 强音 + 拍子轻重（groove，同 gainSegments）。没有力度表 = 一律 defaultVel（拍子轻重走 dB）。 */
export function noteVelocities(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, defaultVel: number, bounds?: readonly number[], groove?: ReadonlyMap<number, number>): Map<number, number> {
  const out = new Map<number, number>();
  if (!spec.dynamicsVel) { tokens.forEach((t, i) => { if (t.kind === "note") out.set(i, defaultVel); }); return out; }
  for (const [i, l] of dynLevels(tokens, map, spec.dynamicsVel, defaultVel * 127, spec.wedgeStepVel ?? M.wedgeStepVel, bounds)) { const t = tokens[i]; if (t.kind === "note") out.set(i, noteVel(l.at0, artOf(t), spec, groove?.get(i) ?? 0)); }
  return out;
}
const noteVel = (v: number, art: readonly string[], spec: PerfSpec, gw = 0) => {
  if (art.includes("fp")) v = spec.dynamicsVel?.f ?? v;   // 强后即弱：音头按 f 弹（之后 gainSegments 压到 p）
  else if (art.includes("sfz")) v += spec.sfzVel ?? M.sfzVel;
  else if (art.includes("marcato")) v += spec.marcatoVel ?? 0; else if (art.includes("accent")) v += spec.accentVel ?? 0;
  else if (art.includes("stress")) v += spec.stressVel ?? M.stressVel; else if (art.includes("unstress")) v += spec.unstressVel ?? M.unstressVel; else if (art.includes("ghost")) v += spec.ghostVel ?? M.ghostVel;
  else if (gw > 0) v += gw * (spec.stressVel ?? M.stressVel); else if (gw < 0) v += -gw * (spec.unstressVel ?? M.unstressVel);   // 拍子轻重：w = 1 一个次重音、w = −1 一个弱化
  return Math.max(1, Math.min(127, Math.round(v))) / 127;
};
/** 谁认哪些记号（2026-10-08 Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。
 *  这张表必须和上面真做的事一致——跳音：月读 = gainSegments 后半段收声，元音版 / SoundFont = noteEnd 截短；重音、力度：所有引擎走 gainSegments；
 *  呼吸：月读 = 唱法核心换气（lab-score），元音版 / SoundFont = noteEnd 收短（lightMarks）；
 *  保持 / 连线：元音版 / SoundFont = 这个音不留底色的缝（gapSec > 0 才有区别），月读还不认（连断第 3 步）。test/honors.test.ts 守着。
 *  不在表里的引擎（没人上场 / 认不出的）= null：整个声部本来就不出声，不再逐个记号画灰。 */
const HONORS: Record<string, readonly string[]> = {
  tsukuyomi: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "swellGrow", "swellFade", "stress", "unstress", "ghost", "whisper", "inhale"],   // 气声 / 出声的换气 = 唱法核心（lab-score 带进唱谱）；乐器 / 元音版做不到                            // 连线 / 保持：她本来就连着唱（whyIgnored = "sung"）；唱法核心的「断」是连断第 3 步
  "vowel-sampler": ["staccato", "accent", "marcato", "sfz", "fp", "breath", "tenuto", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost"],
  soundfont: ["staccato", "accent", "marcato", "sfz", "fp", "breath", "tenuto", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost", "arpeggio"],   // 琶音只有能叠音的认（v0.9.45）
};
/** 连线 / 保持只改「留不留缝」：这位底色本来就不留缝（gapSec = 0）= 写了也不变 → 一样画灰、明说。 */
const GAP_ONLY = ["tenuto", "slur"];
export const ALL_MARKS = ["staccato", "accent", "marcato", "sfz", "fp", "tenuto", "breath", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost", "whisper", "inhale", "arpeggio"] as const;   // inhale = 呼吸出声（NoteTok.inhale，只跟着 breath）   // swellGrow = 音内 < / <>，swellFade = 音内 >
export type Mark = (typeof ALL_MARKS)[number];
/** 这位不认的记号（写在谱上照画、画灰，出声不受影响）：引擎没实现的 + 底色不留缝时的连线 / 保持。 */
export function ignoredArts(engine: string | null | undefined, gapSec = 0, canSwell = true): Mark[] {
  const h = engine ? HONORS[engine] : undefined;
  return h ? ALL_MARKS.filter((a) => !h.includes(a) || (GAP_ONLY.includes(a) && !(gapSec > 0)) || (a === "swellGrow" && !canSwell)) : [];
}
/** 为什么不认（明说用）：引擎没实现 = "engine"；底色不留缝 = "gap"；月读的连线 / 保持 = "sung"——她本来就连着唱，连线 / 保持对她不改变什么，
 *  断句用呼吸（连线和呼吸是同一件事的两头：音和下一个音之间连还是断；2026-10-08 user「连线vs呼吸这两个干的是不是一件事…月读是最需要断句的」）。 */
export function whyIgnored(engine: string | null | undefined, m: Mark): "engine" | "gap" | "sung" | "decay" {
  if (m === "swellGrow" && engine && HONORS[engine]?.includes(m)) return "decay";   // 按下去就自然衰减的乐器：音内变强做不到
  if (engine === "tsukuyomi" && GAP_ONLY.includes(m)) return "sung";
  return engine && HONORS[engine]?.includes(m) ? "gap" : "engine";
}
/** 元音版 / SoundFont 这一路（lightNotes）怎么落修的记号：跳音截到 staccatoGate、呼吸收短一口气（两种引擎一样；月读不走这条，走唱谱 + 音量曲线）。
 *  main.ts 的出声和 test/honors.test.ts 都从这里取，不各写一份。 */
export function lightMarks(spec: { staccatoGate: number; gapSec?: number; gapShare?: number; breathSec?: number; breathShare?: number; arpeggioSec?: number }): { staccatoGate: number; breath: boolean; gapSec: number; arpeggioSec: number; gapShare: number; breathSec: number; breathShare: number } {
  return { staccatoGate: spec.staccatoGate, breath: true, gapSec: spec.gapSec ?? 0, arpeggioSec: spec.arpeggioSec ?? M.arpeggioSec, gapShare: spec.gapShare ?? M.gapShare, breathSec: spec.breathSec ?? M.breathSec, breathShare: spec.breathShare ?? M.breathShare };
}
