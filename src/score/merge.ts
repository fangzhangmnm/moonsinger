// merge.ts —— 合租叠起来 = 一条虚拟的多声部 track（v0.10.28）：一家（主人 + 房客）在一张纸上的音并成一条，交给普通的排谱流程画（自己挑谱号、太宽 = 双手谱、自动八度线）。只读看。
// created 2026-10-10 by Claude Opus 5.5。user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」
//   「i dont believe one need to build a lot of wheels, just concatenate the notes and use the already-have rendering procedure for that virtual track」
//   「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」（= 不存东西，纯看法）。
// 以前（v0.10.24–27）各人的音各画各的、叠在主人那一行 = 符干打架（user「蝌蚪的尾巴在打架」）。
import { headLen, isTimed, WHOLE, type Token, type NoteTok, type Art } from "./song.ts";
import { midiOf, type Pitch } from "./pitch.ts";

interface Ev { t0: number; t1: number; ps: Pitch[]; host: NoteTok | null; heads: Art[] }
/** 符头上看得出来的那几种演奏法（幽灵音 = 括号、气声 = ×）：并进来的和弦里新起的音都有 = 和弦带上（v0.10.33；user「符头属性比如幽灵音这种能显示的可以在合租谱上显示」）。 */
const HEAD_ARTS: readonly Art[] = ["ghost", "whisper"];

/** 几条 track（第一条 = 主人）→ 一条：
 *  · 切点 = 任何人的音开始 / 结束的地方 + 主人的记号所在的地方；每一段 = 那一刻正在响的所有音并成一个和弦（从高到低、同音只留一个），没人响 = 休止；
 *  · 这一段没有新起的音（只是别人那边结束了 / 记号切开的）= 连着上一段（tie）；有新起的音时还在响的长音照样画进和弦（单声部写法表达不了「只连其中一个音」）；
 *  · 主人的记号（力度 / 渐强渐弱 / 小节线 / 反复 / 风格 / 速度 / 调号 / 拍号…）按原来的位置留着（原 token，id 不变）；谱号 / 八度线不要（这一行自己挑）；
 *  · 歌词 = 主人在这一刻起的那个音的；
 *  · keyOf：把某一位的音换成别的音高（一家全是鼓：固定敲一件的 = 那一件的鼓键，好画在五线鼓谱上它那一线）；
 *  · pick：只要第几位、从哪一刻起的那些音（双手谱上 / 下那张、声部 1 / 2 各并一条——见 planHands）；marks = "bars"：只留小节线 / 调号 / 拍号（力度、歌词归最上面那条）。
 *  新造的音 / 休止 id 是负数（不和真 token 撞）。 */
export interface MergeOpts { keyOf?: (member: number, p: Pitch) => Pitch; pick?: (member: number, t0: number) => boolean; marks?: "all" | "bars" }

/** 合租叠起来怎么分手 / 分声部（v0.10.31；user「我现在觉得合租的时候还是智能分左右手和声部的对应关系比较好」「以及你也可以选择合租的时候不用双手谱」
 *  「双手谱线的分工能不能更智能一点，比如如果月读几乎都是高音谱号，另外一个几乎都是低音谱号，那么几个outlier不要乱认领。你觉得小节的粒度算？」「piano3…确实会高低声部乱跑」）：
 *  · 每位一张「家」谱：这张纸上它所有音的中位数在中央 C 以上 = 上谱，以下 = 下谱。大家都在同一边、或者一张谱读得下（clef.ts wantsGrand）= 一张谱，不用双手谱；
 *  · 双手谱时按**小节**换：这一小节它的音明显在另一边（中位数离中央 C 超过一个四度）才换过去，几个出格的音不换（乱跑的那位一小节一小节跟着走）；
 *  · 同一张谱上同一小节有两位以上 = 按各人的中位数在最大的空当处分两组：上面那组 = 声部 1（符干朝上）、下面那组 = 声部 2（符干朝下）；同组的并成和弦。
 *  pick(谱 0 上 / 1 下, 声部 1 / 2) = 给 mergeTracks 的 pick。 */
export interface HandPlan { grand: boolean; pick: (staff: 0 | 1, voice: 1 | 2) => (member: number, t0: number) => boolean }
const SWITCH = 5;   // 换谱的门槛（半音，一个四度）
export function planHands(tracks: Token[][], wantsGrand: (merged: Token[]) => boolean): HandPlan {
  const host = tracks[0] ?? [], time = host.find((t) => t.kind === "time") as { beats?: number; beatType?: number } | undefined;
  const bar = ((time?.beats ?? 4) * WHOLE) / (time?.beatType ?? 4), meas = (t: number) => Math.floor(t / bar + 1e-9);
  const med = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };
  const per = tracks.map((toks) => { const notes: { t: number; m: number[] }[] = []; let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) { const k = toks[i]; if (!isTimed(k)) continue; if (k.kind === "note" && k.pitch) notes.push({ t, m: [k.pitch, ...(k.chord ?? [])].map(midiOf) }); t += k.dur; }
    return notes; });
  const mid = per.map((ns) => med(ns.flatMap((n) => n.m))), home = mid.map((x) => (Number.isNaN(x) || x >= 60 ? 0 : 1) as 0 | 1);
  const present = mid.map((x, i) => (Number.isNaN(x) ? -1 : i)).filter((i) => i >= 0);
  const grand = new Set(present.map((i) => home[i])).size > 1 && wantsGrand(mergeTracks(tracks));
  const staffCache = new Map<string, 0 | 1>(), staffOf = (m: number, ms: number): 0 | 1 => {
    if (!grand) return 0;
    const key = `${m}:${ms}`, hit = staffCache.get(key); if (hit !== undefined) return hit;
    const mm = med(per[m].filter((n) => meas(n.t) === ms).flatMap((n) => n.m));
    const st: 0 | 1 = Number.isNaN(mm) ? home[m] : home[m] === 1 && mm >= 60 + SWITCH ? 0 : home[m] === 0 && mm < 60 - SWITCH ? 1 : home[m];
    staffCache.set(key, st); return st;
  };
  const voiceCache = new Map<string, 1 | 2>(), voiceOf = (m: number, ms: number): 1 | 2 => {
    const key = `${m}:${ms}`, hit = voiceCache.get(key); if (hit !== undefined) return hit;
    const s = staffOf(m, ms), mates = present.filter((j) => staffOf(j, ms) === s && per[j].some((n) => meas(n.t) === ms)).sort((x, y) => mid[y] - mid[x]);
    let cut = mates.length;   // 分组：最大的空当处（只有一位 = 都是声部 1）
    if (mates.length >= 2) { let g = -1; for (let i = 0; i + 1 < mates.length; i++) { const d = mid[mates[i]] - mid[mates[i + 1]]; if (d > g) { g = d; cut = i + 1; } } }
    for (let i = 0; i < mates.length; i++) voiceCache.set(`${mates[i]}:${ms}`, i < cut ? 1 : 2);
    return voiceCache.get(key) ?? 1;
  };
  return { grand, pick: (staff, voice) => (m, t) => staffOf(m, meas(t)) === staff && voiceOf(m, meas(t)) === voice };
}
export function mergeTracks(tracks: Token[][], opt: MergeOpts = {}): Token[] {
  const { keyOf, pick } = opt, barsOnly = opt.marks === "bars";
  const host = tracks[0] ?? [], head = host.slice(0, headLen(host));
  const evs: Ev[] = [], marks: { t: number; tok: Token }[] = [];
  let end = 0;
  tracks.forEach((toks, m) => {
    let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) {
      const k = toks[i];
      if (isTimed(k)) {
        if (k.kind === "note" && k.pitch) {
          const ps = [k.pitch, ...(k.chord ?? [])].map((p) => (keyOf ? keyOf(m, p) : p));
          if (!pick || pick(m, t)) evs.push({ t0: t, t1: t + k.dur, ps, host: m === 0 && !barsOnly ? k : null, heads: (k.art ?? []).filter((a) => HEAD_ARTS.includes(a)) });
        }
        t += k.dur;
      } else if (m === 0 && k.kind !== "clef" && k.kind !== "ottava" && (!barsOnly || k.kind === "bar" || k.kind === "key" || k.kind === "time")) marks.push({ t, tok: k });
    }
    end = Math.max(end, t);
  });
  const cuts = [...new Set([0, end, ...evs.flatMap((e) => [e.t0, e.t1]), ...marks.map((x) => x.t)])].filter((x) => x <= end).sort((a, b) => a - b);
  const out: Token[] = [...head];
  let id = -1000, prevChord = false;
  for (let i = 0; i < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1];
    for (const x of marks) if (x.t === a) out.push(x.tok);
    if (b === undefined) break;
    const on = evs.filter((e) => e.t0 <= a && e.t1 > a);
    if (!on.length) {
      const last = out[out.length - 1];
      if (last && last.kind === "rest" && last.id <= -1000) out[out.length - 1] = { ...last, dur: last.dur + (b - a) };   // 连着的空并成一个休止
      else out.push({ kind: "rest", id: id--, dur: b - a } as Token);
      prevChord = false; continue;
    }
    const freshK = new Set<number>(), seen = new Set<number>();
    for (const e of on) if (e.t0 === a) for (const p of e.ps) freshK.add(midiOf(p));
    const all = on.flatMap((e) => e.ps).filter((p) => { const k = midiOf(p); if (seen.has(k)) return false; seen.add(k); return true; }).sort((x, y) => midiOf(y) - midiOf(x));
    const ps = all;
    const fresh = ps.some((p) => freshK.has(midiOf(p))), h = on.find((e) => e.host && e.t0 === a)?.host ?? null;
    const src = on.filter((e) => e.t0 === a).length ? on.filter((e) => e.t0 === a) : on, art = HEAD_ARTS.filter((x) => src.every((e) => e.heads.includes(x)));   // 新起的那几个都有才算（连着的段跟着起头那几个）
    out.push({ kind: "note", id: id--, pitch: ps[0], ...(ps.length > 1 ? { chord: ps.slice(1) } : {}), dur: b - a, lyric: h?.lyric ?? null, ...(h?.hyph ? { hyph: true } : {}), ...(!fresh && prevChord ? { tie: true } : {}), ...(art.length ? { art } : {}) } as Token);
    prevChord = true;
  }
  return out;
}
