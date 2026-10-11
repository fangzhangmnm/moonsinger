// clef.ts —— 谱号 / 八度线：只管画，音高数据永远是实际音高。纯函数（node 测试 test/clef.test.ts）。created 2026-10-10 by Claude Opus 5.5
// user 2026-10-10：「谱号的显示模式跟着谱号而不是乐器，然后先不要双谱线模式，然后加一个可以移八度显示的功能（或者其实这个就是用标准的音乐记号，然后系统自己判断？能不能这样？」
//   →「默认自动同意」「加格式同意」「中音这个冷门没人用吧，即使做，自动也不会选」「铃铛会很高。8va可以做了吗」。
// 位置的单位 = diatonicIndex（C0 = 0，一级 = 一个线或间）：高音谱号第一线 E4 = 30、第五线 F5 = 38。
import { type ClefName, type Token, type Song, CLEFS, isTimed } from "./song.ts";
import { type Pitch, diatonicIndex } from "./pitch.ts";

/** 这个谱号下，同一个实际音高在谱上要往上挪几级（高音谱号 = 0）。下加 8 = 谱上写高一个八度（实际低八度）= +7。 */
export const CLEF_SHIFT: Record<ClefName, number> = { G: 0, G8vb: 7, G8va: -7, G15ma: -14, F: 12, F8vb: 19 };
export const isFClef = (c: ClefName): boolean => c === "F" || c === "F8vb";
/** 谱号的「本家」（调号的位置、谱号字形挂在哪条线跟它走）。 */
export const baseClef = (c: ClefName): "G" | "F" => (isFClef(c) ? "F" : "G");
/** 八度线：8va（1）= 谱上画低一个八度 → −7；15ma（2）→ −14；8vb（−1）→ +7；结束（0）→ 0。 */
export const ottavaShift = (s: number): number => -7 * s;
export const CLEF_LABEL: Record<ClefName, string> = { G: "高音", G8vb: "高音 8vb", G8va: "高音 8va", G15ma: "高音 15ma", F: "低音", F8vb: "低音 8vb" };
export const CLEF_TITLE: Record<ClefName, string> = {
  G: "高音谱号", G8vb: "高音谱号下面挂 8：谱上写的音实际低一个八度响（吉他、男高音）", G8va: "高音谱号上面挂 8：实际高一个八度（短笛）",
  G15ma: "高音谱号上面挂 15：实际高两个八度（钟琴、铃）", F: "低音谱号", F8vb: "低音谱号下面挂 8：实际低一个八度（低音提琴、贝斯）",
};
export const OTTAVA_LABEL: Record<number, string> = { 1: "8va", 2: "15ma", [-1]: "8vb", 0: "结束八度线" };

const BOTTOM = 30, TOP = 38;
/** 谱上这个位置要几条加线。 */
export const ledgerLines = (pos: number): number => (pos > TOP ? Math.floor((pos - TOP) / 2) : pos < BOTTOM ? Math.floor((BOTTOM - pos) / 2) : 0);
/** 加线越多越难读：一条 = 1、两条 = 3、三条 = 6、四条 = 10（三角数）。 */
const ledgerCost = (pos: number): number => { const l = ledgerLines(pos); return (l * (l + 1)) / 2; };
/** 平常的谱号先：挂 8 / 15 的谱号要平均每个音省下一条以上的加线才换（中央 C 一条加线照样高音谱号）。 */
const BIAS: Record<ClefName, number> = { G: 0, F: 0.1, G8vb: 1, G8va: 1, G15ma: 1.5, F8vb: 1.5 };

/** 自动谱号：给一串谱上的位置（diatonicIndex，已经算上八度线），挑加线最省的那个谱号（加线越多越难读，按三角数算）；没有音 = 上一张纸的（没有 = 高音）。
 *  滞后：上一张纸用的谱号只要不比最好的多太多（多 max(1, 一成) 条以内）就接着用，翻纸不来回跳。 */
export function autoClef(positions: readonly number[], prev: ClefName | null = null): ClefName {
  if (!positions.length) return prev ?? "G";
  return pickClef((c) => positions.reduce((a, x) => a + ledgerCost(x + CLEF_SHIFT[c]) + BIAS[c], 0), positions.length, prev);
}
function pickClef(cost: (c: ClefName) => number, n: number, prev: ClefName | null): ClefName {
  let best: ClefName = "G", bc = Infinity;
  for (const c of CLEFS) { const v = cost(c); if (v < bc - 1e-9) { bc = v; best = c; } }
  if (prev && cost(prev) <= bc + Math.max(1, 0.1 * n)) return prev;
  return best;
}
/** 一段自动八度线的阅读成本（加线的单位）：比为了几个音换谱号便宜，比一两条加线贵。 */
const RUN_COST = 3;

/** 这条 track（一张纸）开头的谱号：声部写了 = 它；没写 = 自动（按开头到第一个谱号记号之前的音挑，算上八度线）。
 *  autoOtt（v0.9.37）= 这位开着自动八度线：比较每个谱号时，先在那个谱号下把自动八度线画上再数加线（每段记 RUN_COST）——
 *  临时冒出去几个音 = 原来的谱号 + 8va；整段都高（自动八度线不画，超过三分之一）= 换谱号（设计稿：「为了这几个音换谱号读起来更累」）。 */
export function startClef(tokens: readonly Token[], partClef: ClefName | undefined, prev: ClefName | null, autoOtt = false): ClefName {
  if (partClef) return partClef;
  if (autoOtt) {
    const cut = tokens.findIndex((t) => t.kind === "clef"), seg = cut < 0 ? tokens : tokens.slice(0, cut);
    let n = 0; for (const t of seg) if (t.kind === "note" && t.pitch) n += 1 + (t.chord?.length ?? 0);
    if (!n) return prev ?? "G";
    return pickClef((c) => {
      const ao = autoOttava(seg, displayStates(seg, c));
      let v = ao.runs.length * RUN_COST;
      seg.forEach((t, i) => { if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...(t.chord ?? [])]) v += ledgerCost(diatonicIndex(p as Pitch) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0)) + BIAS[c]; });
      return v;
    }, n, prev);
  }
  const pos: number[] = [];
  let o = 0;
  for (const t of tokens) {
    if (t.kind === "clef") break;
    if (t.kind === "ottava") { o = t.shift; continue; }
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...(t.chord ?? [])]) pos.push(diatonicIndex(p as Pitch) + ottavaShift(o));
  }
  return autoClef(pos, prev);
}

/** 双手谱多占一张谱的代价（每个音折几条加线的成本）。 */
const GRAND_BIAS = 0.5;
/** 合租叠起来的那一行（v0.10.28，src/score/merge.ts）用不用双手谱：一个谱号（自动挑 + 自动八度线）的阅读成本 vs 双手谱（中央 C 以上上谱、以下下谱）+ 每个音 GRAND_BIAS。
 *  user「share之后能不能选双手谱号，这样爽一点」→「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」：按音自动，不存。 */
export function wantsGrand(tokens: readonly Token[]): boolean {
  const pos: number[] = []; for (const t of tokens) if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...(t.chord ?? [])]) pos.push(diatonicIndex(p as Pitch));
  if (pos.length < 2) return false;
  const c = startClef(tokens, undefined, null, true), ao = autoOttava(tokens, displayStates(tokens, c));
  let single = ao.runs.length * RUN_COST;
  tokens.forEach((t, i) => { if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...(t.chord ?? [])]) single += ledgerCost(diatonicIndex(p as Pitch) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0)); });
  const grand = pos.reduce((a, d) => a + ledgerCost(d >= MIDDLE_C ? d : d + CLEF_SHIFT.F), 0) + GRAND_BIAS * pos.length;
  return grand < single;
}
const MIDDLE_C = 28;   // diatonicIndex(C4)

/** 每个下标处生效的谱号和八度线（开头 = start）：画的时候每个音按这两个挪位置。 */
export function displayStates(tokens: readonly Token[], start: ClefName): { clef: ClefName[]; ott: number[] } {
  const clef: ClefName[] = new Array(tokens.length), ott: number[] = new Array(tokens.length);
  let c = start, o = 0;
  tokens.forEach((t, i) => { if (t.kind === "clef") c = t.clef; else if (t.kind === "ottava") o = t.shift; clef[i] = c; ott[i] = o; });
  return { clef, ott };
}

/** 自动八度线（v0.9.37；user 2026-10-10「自动加」，设计 = ai-docs/20261010-design-answers.md「8va 自动怎么做、什么粒度」）：在已经挑好的谱号下，
 *  连续两个以上、每个都要三条以上加线的音（往上 = 8va，往下 = 8vb；8va 之后还要三条以上 = 15ma）画一段八度线；中间只隔一个音或一个休止的两串并成一段
 *  （隔着的那个音挪了八度也不能反过来要三条以上加线）；这种音超过这张纸的三分之一 = 整段都高，归自动谱号管，不画；手写的八度线说了算（那一段里不自动）。
 *  只管画，不存进谱（随时重算）。返回新的 ott（手写的照旧）+ auto（哪些下标是自动的）+ runs（每一段：起止下标、几度）。 */
export function autoOttava(tokens: readonly Token[], ds: { clef: ClefName[]; ott: number[] }): { ott: number[]; auto: boolean[]; runs: { from: number; to: number; shift: 1 | 2 | -1 }[] } {
  const ott = ds.ott.slice(), auto: boolean[] = new Array(tokens.length).fill(false), runs: { from: number; to: number; shift: 1 | 2 | -1 }[] = [];
  type It = { i: number; note: boolean; hi: number; lo: number; dir: 1 | -1 | 0; manual: boolean };
  const items: It[] = [];
  tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    const manual = (ds.ott[i] ?? 0) !== 0;
    if (t.kind !== "note" || !t.pitch) { items.push({ i, note: false, hi: NaN, lo: NaN, dir: 0, manual }); return; }
    const pos = [t.pitch, ...(t.chord ?? [])].map((p) => diatonicIndex(p as Pitch) + CLEF_SHIFT[ds.clef[i]]);
    const hi = Math.max(...pos), lo = Math.min(...pos);
    const up = hi > TOP && ledgerLines(hi) >= 3, down = lo < BOTTOM && ledgerLines(lo) >= 3;
    items.push({ i, note: true, hi, lo, dir: up && !down ? 1 : down && !up ? -1 : 0, manual });
  });
  const notes = items.filter((x) => x.note).length, cands = items.filter((x) => x.dir && !x.manual).length;
  if (cands < 2 || cands * 3 > notes) return { ott, auto, runs };
  // 隔着的那一个能不能并进来：休止随便；音挪了八度（往上的段 = 谱上低七级）不能在另一头要三条以上加线
  const okGap = (x: It, dir: 1 | -1) => !x.manual && (!x.note || (dir === 1 ? !(x.lo - 7 < BOTTOM && ledgerLines(x.lo - 7) >= 3) : !(x.hi + 7 > TOP && ledgerLines(x.hi + 7) >= 3)));
  for (let k = 0; k < items.length; ) {
    const it = items[k];
    if (!it.dir || it.manual) { k++; continue; }
    const dir = it.dir; let e = k, n = 1;
    for (;;) {
      const a = items[e + 1], b = items[e + 2];
      if (a && a.dir === dir && !a.manual) { e += 1; n++; continue; }
      if (a && b && b.dir === dir && !b.manual && okGap(a, dir)) { e += 2; n++; continue; }
      break;
    }
    if (n >= 2) {
      const span = items.slice(k, e + 1).filter((x) => x.note);
      const shift: 1 | 2 | -1 = dir === -1 ? -1 : span.some((x) => x.hi - 7 > TOP && ledgerLines(x.hi - 7) >= 3) ? 2 : 1;
      const from = items[k].i, to = items[e].i;
      for (let j = from; j <= to; j++) { ott[j] = shift; auto[j] = true; }
      runs.push({ from, to, shift });
    }
    k = e + 1;
  }
  return { ott, auto, runs };
}

/** 导出用（v0.9.37）：把自动八度线临时插成记号（auto: true，写 MusicXML 时带 ms-auto id），别的软件照样看得到；读回来认出是自动的就跳过。
 *  这一段结束在整条最后一个音上 = 不插「结束」（不然末尾多出一个空小节）。 */
export function withAutoOttava(tokens: readonly Token[], start: ClefName): Token[] {
  const { runs } = autoOttava(tokens, displayStates(tokens, start));
  if (!runs.length) return tokens as Token[];
  const out = tokens.slice() as Token[];
  for (const r of [...runs].reverse()) {
    if (tokens.slice(r.to + 1).some((t) => isTimed(t))) out.splice(r.to + 1, 0, { kind: "ottava", id: 0, shift: 0, auto: true });
    out.splice(r.from, 0, { kind: "ottava", id: 0, shift: r.shift, auto: true });
  }
  return out;
}

/** 整首：每张纸每个声部开头的谱号（按纸的顺序一路接：自动的滞后看这个声部在上一张纸结尾的谱号）。和视图无关——本段 / 全部 / PDF 挑的一样。
 *  大谱表的声部不在里面（上高音下低音，照旧；user「先不要双谱线模式」）。 */
export function resolveSongClefs(song: Song): Map<string, Map<string, ClefName>> {
  const out = new Map<string, Map<string, ClefName>>(), last = new Map<string, ClefName>();
  for (const paper of song.papers) {
    const m = new Map<string, ClefName>(); out.set(paper.id, m);
    for (const part of song.parts) {
      const toks = paper.tracks[part.id]; if (!toks || part.staves === 2) continue;
      const c = startClef(toks, part.clef, last.get(part.id) ?? null, part.autoOttava !== false);
      m.set(part.id, c);
      const ds = displayStates(toks, c); last.set(part.id, ds.clef.length ? ds.clef[ds.clef.length - 1] : c);
    }
  }
  return out;
}
