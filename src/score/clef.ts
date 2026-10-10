// clef.ts —— 谱号 / 八度线：只管画，音高数据永远是实际音高。纯函数（node 测试 test/clef.test.ts）。created 2026-10-10 by Claude Opus 5.5
// user 2026-10-10：「谱号的显示模式跟着谱号而不是乐器，然后先不要双谱线模式，然后加一个可以移八度显示的功能（或者其实这个就是用标准的音乐记号，然后系统自己判断？能不能这样？」
//   →「默认自动同意」「加格式同意」「中音这个冷门没人用吧，即使做，自动也不会选」「铃铛会很高。8va可以做了吗」。
// 位置的单位 = diatonicIndex（C0 = 0，一级 = 一个线或间）：高音谱号第一线 E4 = 30、第五线 F5 = 38。
import { type ClefName, type Token, type Song, CLEFS } from "./song.ts";
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
  const cost = (c: ClefName) => positions.reduce((a, x) => a + ledgerCost(x + CLEF_SHIFT[c]) + BIAS[c], 0);
  let best: ClefName = "G", bc = Infinity;
  for (const c of CLEFS) { const v = cost(c); if (v < bc - 1e-9) { bc = v; best = c; } }
  if (prev && cost(prev) <= bc + Math.max(1, 0.1 * positions.length)) return prev;
  return best;
}

/** 这条 track（一张纸）开头的谱号：声部写了 = 它；没写 = 自动（按开头到第一个谱号记号之前的音挑，算上八度线）。 */
export function startClef(tokens: readonly Token[], partClef: ClefName | undefined, prev: ClefName | null): ClefName {
  if (partClef) return partClef;
  const pos: number[] = [];
  let o = 0;
  for (const t of tokens) {
    if (t.kind === "clef") break;
    if (t.kind === "ottava") { o = t.shift; continue; }
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...(t.chord ?? [])]) pos.push(diatonicIndex(p as Pitch) + ottavaShift(o));
  }
  return autoClef(pos, prev);
}

/** 每个下标处生效的谱号和八度线（开头 = start）：画的时候每个音按这两个挪位置。 */
export function displayStates(tokens: readonly Token[], start: ClefName): { clef: ClefName[]; ott: number[] } {
  const clef: ClefName[] = new Array(tokens.length), ott: number[] = new Array(tokens.length);
  let c = start, o = 0;
  tokens.forEach((t, i) => { if (t.kind === "clef") c = t.clef; else if (t.kind === "ottava") o = t.shift; clef[i] = c; ott[i] = o; });
  return { clef, ott };
}

/** 整首：每张纸每个声部开头的谱号（按纸的顺序一路接：自动的滞后看这个声部在上一张纸结尾的谱号）。和视图无关——本段 / 全部 / PDF 挑的一样。
 *  大谱表的声部不在里面（上高音下低音，照旧；user「先不要双谱线模式」）。 */
export function resolveSongClefs(song: Song): Map<string, Map<string, ClefName>> {
  const out = new Map<string, Map<string, ClefName>>(), last = new Map<string, ClefName>();
  for (const paper of song.papers) {
    const m = new Map<string, ClefName>(); out.set(paper.id, m);
    for (const part of song.parts) {
      const toks = paper.tracks[part.id]; if (!toks || part.staves === 2) continue;
      const c = startClef(toks, part.clef, last.get(part.id) ?? null);
      m.set(part.id, c);
      const ds = displayStates(toks, c); last.set(part.id, ds.clef.length ? ds.clef[ds.clef.length - 1] : c);
    }
  }
  return out;
}
