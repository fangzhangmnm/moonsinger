// merge.ts —— 合租叠起来 = 一条虚拟的多声部 track（v0.10.28）：一家（主人 + 房客）在一张纸上的音并成一条，交给普通的排谱流程画（自己挑谱号、太宽 = 双手谱、自动八度线）。只读看。
// created 2026-10-10 by Claude Opus 5.5。user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」
//   「i dont believe one need to build a lot of wheels, just concatenate the notes and use the already-have rendering procedure for that virtual track」
//   「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」（= 不存东西，纯看法）。
// 以前（v0.10.24–27）各人的音各画各的、叠在主人那一行 = 符干打架（user「蝌蚪的尾巴在打架」）。
import { headLen, isTimed, type Token, type NoteTok } from "./song.ts";
import { midiOf, type Pitch } from "./pitch.ts";

interface Ev { t0: number; t1: number; ps: Pitch[]; host: NoteTok | null }

/** 几条 track（第一条 = 主人）→ 一条：
 *  · 切点 = 任何人的音开始 / 结束的地方 + 主人的记号所在的地方；每一段 = 那一刻正在响的所有音并成一个和弦（从高到低、同音只留一个），没人响 = 休止；
 *  · 这一段没有新起的音（只是别人那边结束了 / 记号切开的）= 连着上一段（tie）；有新起的音时还在响的长音照样画进和弦（单声部写法表达不了「只连其中一个音」）；
 *  · 主人的记号（力度 / 渐强渐弱 / 小节线 / 反复 / 风格 / 速度 / 调号 / 拍号…）按原来的位置留着（原 token，id 不变）；谱号 / 八度线不要（这一行自己挑）；
 *  · 歌词 = 主人在这一刻起的那个音的；
 *  · keyOf：把某一位的音换成别的音高（一家全是鼓：固定敲一件的 = 那一件的鼓键，好画在五线鼓谱上它那一线）；
 *  · keep：只要这些音（双手谱 = 中央 C 以上一条、以下一条，各画一张谱）；marks = "bars"：只留小节线 / 调号 / 拍号（双手谱下面那张：力度、歌词归上面那张）。
 *  新造的音 / 休止 id 是负数（不和真 token 撞）。 */
export interface MergeOpts { keyOf?: (member: number, p: Pitch) => Pitch; keep?: (p: Pitch) => boolean; marks?: "all" | "bars";
  /** 两个声部（v0.10.28；user「隔得太远的音符可以分开来的而不是强行用一根超长的棒子连。以前钢琴家也是这么写的」）：一个和弦跨过八度以上 = 在最大的那个空当处劈开，
   *  上面那几个 = 声部 1（符干朝上）、下面那几个 = 声部 2（符干朝下）。1 = 只要上面（没劈开的和弦整个在这儿）；2 = 只要下面（没劈开 = 空着）。不给 = 不劈。 */
  voice?: 1 | 2 }
/** 一个和弦跨过这么多半音以上才劈成两个声部（八度以内一根符干照常）。 */
export const SPLIT_SPAN = 12;
/** 从高到低的一串音 → 劈开处（上面那组的个数）；不用劈 = 全部。 */
export function splitAt(ps: readonly Pitch[]): number {
  if (ps.length < 2 || midiOf(ps[0]) - midiOf(ps[ps.length - 1]) <= SPLIT_SPAN) return ps.length;
  let k = 1, g = -1; for (let i = 0; i + 1 < ps.length; i++) { const d = midiOf(ps[i]) - midiOf(ps[i + 1]); if (d > g) { g = d; k = i + 1; } }
  return k;
}
export function mergeTracks(tracks: Token[][], opt: MergeOpts = {}): Token[] {
  const { keyOf, keep } = opt, barsOnly = opt.marks === "bars";
  const host = tracks[0] ?? [], head = host.slice(0, headLen(host));
  const evs: Ev[] = [], marks: { t: number; tok: Token }[] = [];
  let end = 0;
  tracks.forEach((toks, m) => {
    let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) {
      const k = toks[i];
      if (isTimed(k)) {
        if (k.kind === "note" && k.pitch) {
          const ps = [k.pitch, ...(k.chord ?? [])].map((p) => (keyOf ? keyOf(m, p) : p)).filter((p) => !keep || keep(p));
          if (ps.length) evs.push({ t0: t, t1: t + k.dur, ps, host: m === 0 && !barsOnly ? k : null });
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
    const cut = opt.voice ? splitAt(all) : all.length, ps = opt.voice === 2 ? all.slice(cut) : all.slice(0, cut);
    if (!ps.length) { const last = out[out.length - 1]; if (last && last.kind === "rest" && last.id <= -1000) out[out.length - 1] = { ...last, dur: last.dur + (b - a) }; else out.push({ kind: "rest", id: id--, dur: b - a } as Token); prevChord = false; continue; }
    const fresh = ps.some((p) => freshK.has(midiOf(p))), h = on.find((e) => e.host && e.t0 === a)?.host ?? null;
    out.push({ kind: "note", id: id--, pitch: ps[0], ...(ps.length > 1 ? { chord: ps.slice(1) } : {}), dur: b - a, lyric: h?.lyric ?? null, ...(h?.hyph ? { hyph: true } : {}), ...(!fresh && prevChord ? { tie: true } : {}) } as Token);
    prevChord = true;
  }
  return out;
}
