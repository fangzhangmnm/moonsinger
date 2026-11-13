// perform.ts —— 谱上的「修」→ 出声的数（纯函数，Node 里可测）。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08 拍「挂在音上 + 选区条」「月读在那儿换气」。数从哪来：上场那位 by value 带着的力度表（按力度敲的 = dynamicsVel：力度记号 → 力度；按音量走的小月相 / 元音版 = dynamicsDb：力度记号 → dB，16-4）和演奏法（articulation：
//   staccatoGate 跳音吃掉时值的多少、accentDb 重音加多少）——契约 CandidateV2，app 改默认动不到旧歌。
// 怎么出声（各引擎一样的部分在这里，引擎特有的在调用方）：
//   力度 + 重音 = 一条按时间的音量曲线（谱的时钟，秒），渲染完乘上去（src/audio/mix.ts applyGain）；一个力度 / 重音都没有 = null = 不碰声音（和以前逐样本一样）。
//   跳音：SoundFont / 元音版把音截短（lightNotes，乐器自己的余音照常收）；月读截不短（唱法核心按谱唱满）→ 曲线在音的后半段收声（gateStaccato）。
//   呼吸：月读 = 下一个字前「v」（lab-score.ts）；元音版和乐器 = 前一个音收短一点（lightNotes；乐器上的逗号 = 稍微断开再进下一个音，管乐 / 人声就是换气；
//   2026-10-08 user「breath是否应该对大量GS乐器也生效。毕竟不断气一直拖着也不对，fl你还得手动调一下时长」）。
import { type Token, type NoteTok, type TempoMap, type Dyn, DYNS, timeline, artOf, swellOf, DEFAULT_DYN, rampTarget, isTimed } from "./song.ts";
import { ROLL_HZ_MIN, ROLL_HZ_MAX, type SingMark } from "../format/performance.ts";
import { midiOf } from "./pitch.ts";
const DEFAULT_DYN_KEY: Dyn = DEFAULT_DYN;

/** 交给出声代码的这位的数（第 16 条 16-4 A，统筹 2026-11-12 夜）：每个都必填——读文件的门口补全、新建按模板抄（format/template.ts），出声的代码不带默认、不 import 模板。
 *  按这位的力度路分（插件报的 dynamics；哪一路有哪些键 = format/project.ts ART_KEYS_BY，守卫 test/art-keys-by-path.test.ts）。缺了 = 送进录音房之前明着报错（format/project.ts perfSpecProblems）。 */
export interface PerfCommon {
  staccatoGate: number; gapSec: number; gapShare: number; breathSec: number; breathShare: number; fpSec: number; swellDb: number; canSwell: boolean; arpeggioSec: number;
  /** 滚奏每秒几下（16-4 F 起只写数）。 */
  rollHz: number;
  /** 小月相：谱上的记号 → 唱法核心的字前记号（别的乐手身上没有 = 空）。 */
  sing: Record<string, SingMark | null>;
}
/** 按音量走力度的（小月相 / 元音版）：力度 = dB 表；重音那一组是 dB。 */
export interface GainSpec extends PerfCommon { path: "gain"; dynamicsDb: Record<Dyn, number>; accentDb: number; marcatoDb: number; accentSec: number; sfzDb: number; sfzSec: number; stressDb: number; unstressDb: number; ghostDb: number }
/** 按力度敲的（SoundFont）：力度 = MIDI 力度表；重音那一组是力度格；没终点的渐强渐弱走 wedgeStepVel。 */
export interface VelSpec extends PerfCommon { path: "velocity"; dynamicsVel: Record<Dyn, number>; accentVel: number; marcatoVel: number; wedgeStepVel: number; sfzVel: number; stressVel: number; unstressVel: number; ghostVel: number }
export type PerfSpec = GainSpec | VelSpec;
/** 音量曲线的一段：t0–t1（秒，谱的时钟）这段多少 dB；-Infinity = 静音。 */
export interface GainSeg { t0: number; t1: number; dB: number }
/** 「这一下力度让它多响」L（dB）：写的音高 × 力度 → dB（施工单 7-N，2026-11-12，统筹选 A）。**dB 和力度互相换只经过这个接口**（守卫：test/roll.test.ts「结构」）。
 *  只有按力度敲的乐器有：引擎在敲的那个键上实际施加的（src/gm/sf2-subset.ts sf2VelocityCurve，深度是音色库自己写的；插件把写的音高换成敲的键；准备声音时从库的字节算）。
 *  按音量走力度的小月相 / 元音版没有这一条：她们的力度就是 dB 表（16-4）。只用差（L(f) − L(p) …），绝对值不管。null = 这个键不出声（声音没载好 / 没有区）= 不换算。 */
export type VelDb = (midi: number, vel: number) => number | null;
/** 没有曲线（声音没载好）：哪个力度都不换算。 */
export const NO_CURVE: VelDb = () => null;
/** 反查（7-N；统筹定的规矩，写死、确定）：从力度 from 往下找一个力度，让 L 低 D dB——只在不高于 from 的整数力度里找，取 L 最接近目标的；一样近取力度高的那个。
 *  L 不单调的地方（换力度层时）照这个规矩走、不特判。L 没有（不出声）= 原样回 from。 */
export function velocityForDb(curve: VelDb, midi: number, from: number, D: number): number {
  const L0 = curve(midi, from); if (L0 === null) return from;
  const target = L0 - D; let best = Math.floor(from), bestD = Infinity;
  for (let c = Math.floor(from); c >= 1; c--) { const L = curve(midi, c); if (L === null) continue; const d = Math.abs(L - target); if (d < bestD) { best = c; bestD = d; } }
  return best;
}
/** 滚奏的音上，音内起伏能不能靠每一下的力度做出来（这个键上力度从 1 到 127 的 L 差够 D dB）：能 = 起伏在每一下的力度里（rollHitVelocity）、音量曲线不再算；
 *  不能（力度深度 0 这类：力度不改响度）= 起伏照旧走音量曲线。两处问同一个函数，不各说各的。 */
export function swellByVelocity(curve: VelDb, midi: number, D: number): boolean { const a = curve(midi, 127), b = curve(midi, 1); return a !== null && b !== null && a - b >= D; }
const keyOfTok = (tok: Token): number => (tok.kind === "note" && tok.pitch ? midiOf(tok.pitch) : 60);   // 写的音高（最上面那条线）；换成敲的键归插件给的曲线

/** 一个声部的音量曲线。byVelocity = 这位按力度敲（演奏者插件的能力 dynamics: "velocity"）：力度记号 / 渐强渐弱 / 重音都在每个音的力度里（noteVelocities），
 *  这条曲线只剩强后即弱的「压」和音内起伏；否则（小月相 / 元音版）力度水平、重音、渐强渐弱都在这条曲线上。全程 0 dB = null。
 *  渐强渐弱 / 渐到按这位的表的单位线性（16-4，统筹 2026-11-12 夜）：小月相 / 元音版 = 她的 dB 表，在 dB 上线性、没终点走到表里的下一档；
 *  按力度敲的乐器 = 力度表，在力度上线性（curve = 引擎在那个键上实际的 L，7-N；这条曲线上只用它压强后即弱、做不出的音内起伏）。
 *  rolls = 这位认滚奏（7-N）：滚奏的音是靠连着敲撑起来的长音——音内起伏谁都能演（不看 canSwell）；按力度敲的这一路，强后即弱和（做得出来的）音内起伏
 *  已经在每一下的力度里（rollHitVelocity），这里不再压一遍。
 *  groove = 拍子轻重（下标 → 权重，src/score/groove.ts；已乘过幅度和跟多少）：正的 = 按次重音的量在音头加，负的 = 按弱化的量整个音轻下去（写了音头记号的音不在里面）。 */
export function gainSegments(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, bounds?: readonly number[], groove?: ReadonlyMap<number, number>, curve: VelDb = NO_CURVE, rolls = false): GainSeg[] | null {
  const segs: GainSeg[] = [];
  let any = false;
  const vel = spec.path === "velocity";   // 按力度敲（乐器）/ 按音量走（小月相 / 元音版）= 这位插件报的路，跟着规格走
  const tab: Record<Dyn, number> = vel ? spec.dynamicsVel : spec.dynamicsDb;   // 按力度敲 = 力度表；按音量走 = dB 表（水平直接就是 dB）
  const levels = vel ? null : dynLevels(tokens, map, tab, tab.mf, "table", bounds);   // 音量那一路的水平（dB，按时间线性；没终点走到表里的下一档）；按力度敲的在 noteVelocities
  const C: VelDb = vel ? curve : (_m, v) => v;
  let K = 60;   // 这一个 token 的写的音高（L 按它取；音量曲线那一路不看）
  const lv = (v: number | null) => (v === null ? 0 : C(K, v) ?? 0);
  /** s0–s1 这段：力度从 va 线性走到 vb（null = 这位不按曲线走力度 = 0 dB），换成 dB 再加 off 和 add(这一小段中点)。切成小段（月读一个长音也能渐强）。 */
  const level = (va: number | null, vb: number | null, s0: number, s1: number, off: number, add?: (m: number) => number, fine = false) => {
    const n = fine ? Math.max(2, Math.min(48, Math.ceil((s1 - s0) / 0.03))) : Math.max(1, Math.min(32, Math.ceil((s1 - s0) / 0.03)));
    for (let k = 0; k < n; k++) {
      const a = s0 + ((s1 - s0) * k) / n, b = s0 + ((s1 - s0) * (k + 1)) / n, m = (a + b) / 2, fs = fine ? (m - s0) / Math.max(1e-9, s1 - s0) : (k + 0.5) / n;
      segs.push({ t0: a, t1: b, dB: lv(va === null ? null : va + ((vb ?? va) - va) * fs) + off + (add ? add(m) : 0) });
    }
  };
  for (const { index, tok, t0, t1 } of timeline(tokens, map)) {
    K = keyOfTok(tok);
    const gw = vel ? 0 : groove?.get(index) ?? 0;   // 拍子轻重（dB 那一路；力度那一路在 noteVel）
    const L = levels?.get(index), soft = tok.kind === "note" && !vel ? (artOf(tok).includes("ghost") ? spec.ghostDb : artOf(tok).includes("unstress") ? spec.unstressDb : gw < 0 ? -gw * spec.unstressDb : 0) : 0;
    const v0 = L ? L.at0 : null, v1 = L ? L.at1 : null;   // 这一个 token 头尾的力度水平（音量曲线这一路）
    const base = lv(v0) + soft, baseEnd = lv(v1) + soft;   // 弱化 / 幽灵音：整个音轻下去（dB 那一路；力度那一路在 noteVel）
    if (base !== 0 || baseEnd !== 0) any = true;
    if (tok.kind !== "note") { if (v1 !== v0) level(v0, v1, t0, t1, soft); else segs.push({ t0, t1, dB: base }); continue; }
    const art = artOf(tok);
    let cur = t0;
    // 音头那一组（互斥）：重音 / 强音 = 音头一小段加 dB；突强 = 冲高 sfzDb、sfzSec 里落回当下；强后即弱 = 音头这位的 f、fpSec 里落到 p（之后都是 p，dynLevels 管）
    // 音内的力度起伏（< / > / <>，音自己的事；swellDb 由演奏者配置）：做不到在一个音里变强的（canSwell = false：钢琴、拨弦…）只做 >
    const rolled = rolls && art.includes("roll");   // 滚奏的音（7-N）
    const sw0 = swellOf(tok), sw = sw0 && (rolled || !(spec.canSwell === false && sw0 !== ">")) ? sw0 : null, D = spec.swellDb;
    // 包络只往下乘（v0.9.29；user 2026-10-10「音内减弱渐强和鼓起都是最大值对应的本来原始值，就是乘一个小于一的包罗，而不是大于一的」→「鼓包改」）：
    //   写的力度 = 这个音的最高点；< 从 −D 长到写的力度、> 从写的力度收到 −D、<> 两头 −D 中间回到写的力度。一个音永远不比写的力度更响。
    const swOff = (m: number) => { const fr = (m - t0) / Math.max(1e-9, t1 - t0); return sw === "<" ? -D * (1 - fr) : sw === ">" ? -D * fr : sw === "<>" ? -D * Math.abs(2 * fr - 1) : 0; };
    if (rolled && vel) {   // 按力度敲的滚奏：强后即弱、音内起伏在每一下的力度里；力度做不出音内起伏的（深度 0 这类）照旧在这里按 dB 做
      if (sw && !swellByVelocity(C, K, D)) { level(null, null, t0, t1, 0, swOff, true); any = true; } else segs.push({ t0, t1, dB: base });
      continue;
    }
    if (art.includes("fp")) {
      // 强后即弱：音头按 f、fpSec 里落到 p（在力度上线性，换成 dB）。按力度敲的：音头已经按 f 的力度弹了，这里只把它压下去（相对 f：L(p) − L(f)，用这件乐器在这个键上实际的 L，7-N）
      const f = tab.f, p = tab.p, e = Math.min(t1, t0 + spec.fpSec), off = vel ? -(C(K, f) ?? 0) : 0;
      level(f, p, t0, e, off);
      if (t1 > e) {   // fp 之后再 <（贝多芬常用）：从 p 长回去，最多回到音头的 f（不超过写的）；<> = p → f → p；> = 在 p 上再往下收
        if (sw === "<") level(p, f, e, t1, off);
        else if (sw === "<>") { const m = (e + t1) / 2; level(p, f, e, m, off); level(f, p, m, t1, off); }
        else if (sw) level(p, p, e, t1, off, swOff, true); else segs.push({ t0: e, t1, dB: lv(p) + off });
      }
      any = true; continue;
    }
    if (art.includes("sfz") && !vel) {   // 突强：音头冲高 b dB、sfzSec 里线性落回底下的水平
      const e = Math.min(t1, t0 + spec.sfzSec), b = spec.sfzDb, ve = v0 === null ? null : v0 + ((v1 ?? v0) - v0) * ((e - t0) / Math.max(1e-9, t1 - t0));
      level(v0, ve, t0, e, soft, (m) => b * (1 - (m - t0) / Math.max(1e-9, e - t0))); cur = e; any = true;
    }
    const boost = vel ? 0 : art.includes("marcato") ? spec.marcatoDb : art.includes("accent") ? spec.accentDb : art.includes("stress") ? spec.stressDb : gw > 0 ? gw * spec.stressDb : 0;   // 强音比重音重、次重音比重音轻；拍子轻重 = 次重音的几分之几
    if (!vel && boost) { const e = Math.min(t1, t0 + spec.accentSec); segs.push({ t0, t1: e, dB: base + boost }); cur = e; any = true; }
    if (t1 > cur) {
      const va = v0 === null ? null : v0 + ((v1 ?? v0) - v0) * ((cur - t0) / Math.max(1e-9, t1 - t0));
      if (sw) { level(va, v1, cur, t1, soft, swOff, true); any = true; } else if (v1 !== va) level(va, v1, cur, t1, soft); else segs.push({ t0: cur, t1, dB: base });
    }
  }
  return any ? segs : null;
}

/** 轻量版 / SoundFont 一个音的结束时刻（秒）：跳音截到 staccatoGate；呼吸（只给元音版）= 收短一口气的空当（同唱法核心的 v：至多 0.16 s / 25%）。 */
export function noteEnd(t0: number, t1: number, art: readonly string[], o: { staccatoGate: number; breath: boolean; gapSec: number; gapShare: number; breathSec: number; breathShare: number }, slur = false): number {
  let end = t1;
  if (art.includes("staccato")) end = t0 + (t1 - t0) * o.staccatoGate;
  // 连断的底色：不写记号的音留 gapSec 的缝（最多吃掉这个音的 1/4，短音不被吃光）；连线（连到下一个）/ 保持 = 不留（2026-10-08，user「连断 预设 都同意」）
  else if (!slur && !art.includes("tenuto") && o.gapSec > 0) end = t1 - Math.min(o.gapSec, o.gapShare * (t1 - t0));
  if (o.breath && art.includes("breath")) end = Math.min(end, t1 - Math.min(o.breathSec, o.breathShare * (t1 - t0)));
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
/** step = 渐强渐弱 / 渐到后面没有终点时「走一档」怎么走：一个数 = 在表的单位上走这么多（按力度敲的乐器，wedgeStepVel）；"table" = 走到表里的下一档（ppp → pp → … → fff，到头不动；
 *  小月相 / 元音版的 dB 表，16-4）。 */
export function dynLevels(tokens: Token[], map: TempoMap | undefined, table: Record<Dyn, number>, def: number, step: number | "table", bounds?: readonly number[]): Map<number, { at0: number; at1: number }> {
  const out = new Map<number, { at0: number; at1: number }>(), tl = timeline(tokens, map), at = new Map(tl.map((x) => [x.index, x]));
  const lo = Math.min(...Object.values(table)), hi = Math.max(...Object.values(table));
  const onsetFrom = (j: number, stop = tokens.length) => { for (let k = j; k < stop; k++) { const x = at.get(k); if (x) return x; } return null; };   // j 起第一个有时值的
  const endBefore = (j: number) => { for (let k = j - 1; k >= 0; k--) { const x = at.get(k); if (x) return x.t1; } return 0; };
  let cur = def, curDyn: Dyn = DEFAULT_DYN_KEY, ramp: { from: number; to: number; toDyn: Dyn; T0: number; T1: number; end: number } | null = null;   // curDyn = 现在生效的那一档（「走到表里的下一档」按它走）
  const lvl = (t: number) => (ramp ? ramp.from + (ramp.to - ramp.from) * Math.max(0, Math.min(1, ramp.T1 > ramp.T0 ? (t - ramp.T0) / (ramp.T1 - ramp.T0) : 1)) : cur);
  for (let i = 0; i < tokens.length; i++) {
    if (ramp && i >= ramp.end) { cur = ramp.to; curDyn = ramp.toDyn; ramp = null; }
    const t = tokens[i];
    if (t.kind === "dyn") {
      if (!ramp) { cur = table[t.value]; curDyn = t.value; }
      // 渐到：这张纸里下一个力度记号写着「从上一个渐变过来」、中间没有手写的渐强渐弱 = 从这儿后面第一个音一路变到它那个音的音头（关键帧线性插值；
      //   user「渐到 同意…其实就是有一个start位置和一开始就均匀插值的问题」；dB / 力度本来就是对数的量，线性插就是听感上均匀）
      const pe = paperEndOf(i, tokens.length, bounds), j: number = ramp ? -1 : rampTarget(tokens, i, pe), start = j >= 0 ? onsetFrom(i + 1, j) : null;
      if (j >= 0 && start) { const v: Dyn = (tokens[j] as Extract<Token, { kind: "dyn" }>).value; ramp = { from: cur, to: table[v], toDyn: v, T0: start.t0, T1: onsetFrom(j, pe)?.t0 ?? endBefore(j), end: j }; }
      continue;
    }
    if (t.kind === "hairpin") {
      const e = hairpinEnd(tokens, i, bounds), start = onsetFrom(i + 1, e.at);
      if (!start) continue;   // 它和终点之间一个音都没有 = 不起作用
      // 终点是力度记号、但和方向反着（渐弱后面接更强的 / 一样的；渐强后面接更弱的 / 一样的）= **记号的方向说了算**：先按方向走一档，到那个力度记号再突变（subito）
      //   （2026-10-08 user 拍：「记号的方向说了算。先按渐弱方向走一档，到那个 f 再突变…同意」；贝多芬的「cresc. … subito p」）。谱上发夹末端画灰字推定的那一档（engrave）
      const endDyn = e.kind === "dyn" ? (tokens[e.at] as Extract<Token, { kind: "dyn" }>).value : null, endVal = endDyn ? table[endDyn] : null;
      const stepDyn = step === "table" ? DYNS[Math.max(0, Math.min(DYNS.length - 1, DYNS.indexOf(curDyn) + (t.dir === "cresc" ? 1 : -1)))]! : curDyn;
      const oneStep = step === "table" ? table[stepDyn] : Math.max(lo, Math.min(hi, cur + (t.dir === "cresc" ? step : -step)));
      const agrees = endVal !== null && (t.dir === "cresc" ? endVal > cur : endVal < cur);
      const to = agrees ? endVal! : oneStep, toDyn = agrees ? endDyn! : stepDyn;
      const T1 = e.kind === "end" ? endBefore(e.at) : (onsetFrom(e.at, paperEndOf(i, tokens.length, bounds))?.t0 ?? endBefore(e.at));
      ramp = { from: cur, to, toDyn, T0: start.t0, T1, end: e.at };
      continue;
    }
    const x = at.get(i); if (!x) continue;
    out.set(i, { at0: lvl(x.t0), at1: lvl(x.t1) });
    if (t.kind === "note" && !ramp && artOf(t).includes("fp")) { cur = table.p; curDyn = "p"; }   // 强后即弱：之后的音都是 p（它也是一个新状态）
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
/** 一个音的 MIDI 力度（0–1，= 力度 ÷ 127；按力度敲的演奏者这一路）：前面最近的力度记号查表，没有记号 = 演奏者的默认力度（defaultVel，乐器页的旋钮）；
 *  再加重音 / 强音。9-2 起人人有表（没带 = 标准表），10-08 以前的旧 SoundFont 候选也这样敲。2026-10-08 user「应该send的就是velocity！」「力度就是velocity」。 */
export function noteVelocity(tokens: Token[], index: number, art: readonly string[], spec: VelSpec, defaultVel: number): number {
  const l = dynLevels(tokens, undefined, spec.dynamicsVel, defaultVel * 127, spec.wedgeStepVel).get(index);
  return noteVel(l ? l.at0 : defaultVel * 127, art, spec);
}
/** 一整条的每个音的力度（index → 0–1）：力度记号 + 渐强渐弱（dynLevels，取音头）+ 重音 / 强音 + 拍子轻重（groove，同 gainSegments）。只给按力度敲的演奏者（调用方按插件的 dynamics 能力分）。 */
export function noteVelocities(tokens: Token[], map: TempoMap | undefined, spec: VelSpec, defaultVel: number, bounds?: readonly number[], groove?: ReadonlyMap<number, number>): Map<number, number> {
  const out = new Map<number, number>();
  for (const [i, l] of dynLevels(tokens, map, spec.dynamicsVel, defaultVel * 127, spec.wedgeStepVel, bounds)) { const t = tokens[i]; if (t.kind === "note") out.set(i, noteVel(l.at0, artOf(t), spec, groove?.get(i) ?? 0)); }
  return out;
}
const noteVel = (v: number, art: readonly string[], spec: VelSpec, gw = 0) => {
  if (art.includes("fp")) v = spec.dynamicsVel.f;   // 强后即弱：音头按 f 弹（之后 gainSegments 压到 p）
  else if (art.includes("sfz")) v += spec.sfzVel;
  else if (art.includes("marcato")) v += spec.marcatoVel; else if (art.includes("accent")) v += spec.accentVel;
  else if (art.includes("stress")) v += spec.stressVel; else if (art.includes("unstress")) v += spec.unstressVel; else if (art.includes("ghost")) v += spec.ghostVel;
  else if (gw > 0) v += gw * spec.stressVel; else if (gw < 0) v += -gw * spec.unstressVel;   // 拍子轻重：w = 1 一个次重音、w = −1 一个弱化
  return Math.max(1, Math.min(127, Math.round(v))) / 127;
};
/** 滚奏一下的力度（7-N，2026-11-12；user「这个滚奏完全没法用啊，比如如何实现我之前手动滚奏的效果？」「没法上音内渐强」）——只给按力度敲的演奏者（timeline.ts 按插件能力分路）。
 *  · 力度水平 = 出声已经在用的那一份 dynLevels：这一下落在哪个 token（连音线连过去的几段各用各的），按它在那一段里的进度在 at0 → at1 之间线性取——
 *    所以「一个滚奏长音 + 渐强渐弱 / 渐到」和手写的一串音逐下相同（插值不改：力度表的数值线性走，同 lvl）。
 *  · 音头那一组：重音 / 强音 / 突强 / 次重音、拍子轻重只算第一下；弱化 / 幽灵音每一下都算（看这一段自己的 token）；强后即弱 = 第一下按 f、后面按 p。
 *  · 音内起伏（< > <>）：形状照旧（写的力度是最高点），fr = 这一下在整个滚奏音里的进度；低 D dB 按这件乐器在这个键上实际的 L 反查力度（velocityForDb）；
 *    力度做不出来的（swellByVelocity 为假）这里不动、音量曲线做。
 *  返回 0–1（同 noteVel）。 */
export function rollHitVelocity(tokens: Token[], map: TempoMap | undefined, spec: VelSpec, defaultVel: number, bounds?: readonly number[], groove?: ReadonlyMap<number, number>, curve: VelDb = NO_CURVE):
  (hit: { index: number; t: number; seg: { t0: number; t1: number }; first: number; isFirst: boolean; fr: number }) => number {
  const tab = spec.dynamicsVel, C = curve, D = spec.swellDb;
  const levels = dynLevels(tokens, map, tab, defaultVel * 127, spec.wedgeStepVel, bounds);
  return ({ index, t, seg, first, isFirst, fr }) => {
    const L = levels.get(index), k = seg.t1 > seg.t0 ? Math.max(0, Math.min(1, (t - seg.t0) / (seg.t1 - seg.t0))) : 0;
    let v = L ? L.at0 + (L.at1 - L.at0) * k : defaultVel * 127;
    const head = tokens[first], own = tokens[index], a0 = head?.kind === "note" ? artOf(head) : [], a = own?.kind === "note" ? artOf(own) : [];
    if (a0.includes("fp")) v = isFirst ? tab.f : tab.p;
    else if (isFirst) {
      if (a0.includes("sfz")) v += spec.sfzVel;
      else if (a0.includes("marcato")) v += spec.marcatoVel; else if (a0.includes("accent")) v += spec.accentVel;
      else if (a0.includes("stress")) v += spec.stressVel;
      else { const gw = groove?.get(first) ?? 0; if (gw > 0) v += gw * spec.stressVel; else if (gw < 0) v += -gw * spec.unstressVel; }
    }
    if (a.includes("unstress")) v += spec.unstressVel; else if (a.includes("ghost")) v += spec.ghostVel;
    v = Math.max(1, Math.min(127, Math.round(v)));
    const sw = head ? swellOf(head) : null, key = head ? keyOfTok(head) : 60;
    if (sw && swellByVelocity(C, key, D)) { const drop = sw === "<" ? D * (1 - fr) : sw === ">" ? D * fr : D * Math.abs(2 * fr - 1); if (drop > 0) v = velocityForDb(C, key, v, drop); }
    return v / 127;
  };
}
/** 谁认哪些记号（2026-10-08 Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。
 *  这张表必须和上面真做的事一致——跳音：月读 = gainSegments 后半段收声，元音版 / SoundFont = noteEnd 截短；重音、力度：所有引擎走 gainSegments；
 *  呼吸：月读 = 唱法核心换气（lab-score），元音版 / SoundFont = noteEnd 收短（lightMarks）；
 *  保持 / 连线：元音版 / SoundFont = 这个音不留底色的缝（gapSec > 0 才有区别），月读还不认（连断第 3 步）。test/honors.test.ts 守着。
 *  不在表里的引擎（没人上场 / 认不出的）= null：整个声部本来就不出声，不再逐个记号画灰。 */
/** 谁认哪些记号 = 演奏者插件自报（ADR-0004，2026-10-14 起表住在 src/performers/*.ts 的 honors；connected = 本来就连着唱，连线 / 保持对它没意义）。 */
export interface HonorsOf { readonly honors: readonly string[]; readonly connected: boolean }
/** 连线 / 保持只改「留不留缝」：这位底色本来就不留缝（gapSec = 0）= 写了也不变 → 一样画灰、明说。 */
const GAP_ONLY = ["tenuto", "slur"];
export const ALL_MARKS = ["staccato", "accent", "marcato", "sfz", "fp", "tenuto", "breath", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost", "whisper", "inhale", "arpeggio", "roll"] as const;   // inhale = 呼吸出声（NoteTok.inhale，只跟着 breath）   // swellGrow = 音内 < / <>，swellFade = 音内 >
export type Mark = (typeof ALL_MARKS)[number];
/** 这位不认的记号（写在谱上照画、画灰，出声不受影响）：引擎没实现的 + 底色不留缝时的连线 / 保持。 */
export function ignoredArts(p: HonorsOf | null | undefined, gapSec = 0, canSwell = true): Mark[] {
  const h = p?.honors;
  return h ? ALL_MARKS.filter((a) => !h.includes(a) || (GAP_ONLY.includes(a) && !(gapSec > 0)) || (a === "swellGrow" && !canSwell)) : [];
}
/** 为什么不认（明说用）：引擎没实现 = "engine"；底色不留缝 = "gap"；月读的连线 / 保持 = "sung"——她本来就连着唱，连线 / 保持对她不改变什么，
 *  断句用呼吸（连线和呼吸是同一件事的两头：音和下一个音之间连还是断；2026-10-08 user「连线vs呼吸这两个干的是不是一件事…月读是最需要断句的」）。 */
export function whyIgnored(p: HonorsOf | null | undefined, m: Mark): "engine" | "gap" | "sung" | "decay" {
  if (m === "swellGrow" && p?.honors.includes(m)) return "decay";   // 按下去就自然衰减的乐器：音内变强做不到
  if (p?.connected && GAP_ONLY.includes(m)) return "sung";
  return p?.honors.includes(m) ? "gap" : "engine";
}
/** 元音版 / SoundFont 这一路（lightNotes）怎么落修的记号：跳音截到 staccatoGate、呼吸收短一口气（两种引擎一样；月读不走这条，走唱谱 + 音量曲线）。
 *  main.ts 的出声和 test/honors.test.ts 都从这里取，不各写一份。 */
export function lightMarks(spec: PerfCommon): { staccatoGate: number; breath: boolean; gapSec: number; arpeggioSec: number; gapShare: number; breathSec: number; breathShare: number } {
  return { staccatoGate: spec.staccatoGate, breath: true, gapSec: spec.gapSec, arpeggioSec: spec.arpeggioSec, gapShare: spec.gapShare, breathSec: spec.breathSec, breathShare: spec.breathShare };
}

/** 滚奏每秒几下的出厂值（鼓 12 / 有音高的 14）在 format/template.ts：每位乐手身上只写数（16-4 F），出声只读这一个数。 */
export { ROLL_HZ_MIN, ROLL_HZ_MAX };
