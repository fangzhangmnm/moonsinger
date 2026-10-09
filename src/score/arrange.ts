// arrange.ts —— 编排：这首歌按什么顺序放哪几张纸（2026-10-08 深夜，Claude Opus 5.5）。
// user：「a flat 编排 list 同意，我也喜欢，和我想的一样」「编排我建议就是总paper的顶上说一下，然后只有全部paper的时候可见，就是一行，对吧，就和title一样」
//   「有12房子，master list能调用A.1 x3 A.2 x5这样吗？也许不要弄得太复杂」「可以，然后无穷循环和循环走带都做」。
// 写法只有三样（一棵只有「顺序」「重复」两种节点的小树 + 一个循环段；展开就是一条播放顺序，没有 D.C. / D.S. 那种跳转、没有歧义）：
//   · 纸：曲段名（纸顶那一条），或者第几张纸的序号（1 起）；空格 / 、 / , / → 隔开；
//   · 重复：名字或括号后面跟 ×N（x / X / * 也认），如 A×2、(A A1)×3——房子 = 结尾单独做成一张小纸，主体共用，括起来重复；
//   · 循环段：[ … ]，只能一个、放在最后：前面放一遍，括住的一直循环（单曲循环 / 游戏的「前奏 + 循环段」）。
// 不写 = 每张纸按顺序各放一遍（隐藏的不放；和以前一样）。写错的（找不到这张纸、循环段后面还有东西…）照写照存、谱上那一行画出来、说为什么，放的时候跳过（纪律「做不到的一律画灰 + 明说」）。
import { type PaperSeg, type Token, type TempoMap, timeline } from "./song.ts";

export type ArrNode = { kind: "ref"; paper: string; text: string; at: number } | { kind: "rep"; body: ArrNode[]; n: number };
export interface ArrIssue { at: number; len: number; why: string }
export interface Arrangement { order: string[]; loop: string[] | null; issues: ArrIssue[]; explicit: boolean }

const REP = /^(?:[×xX*])(\d+)/;
/** 解析编排那一行。papers = 歌里的纸（按顺序）。 */
export function parseArrangement(text: string | undefined, papers: readonly PaperSeg[]): Arrangement {
  const src = (text ?? "").trim();
  if (!src) return { order: papers.filter((p) => !p.hidden).map((p) => p.id), loop: null, issues: [], explicit: false };
  const issues: ArrIssue[] = [];
  let i = 0;
  const ws = () => { while (i < src.length && /[\s、,，→]/.test(src[i])) i++; };
  const findPaper = (name: string): string | null => {
    const byName = papers.find((p) => p.name.trim() === name);
    if (byName) return byName.id;
    if (/^\d+$/.test(name)) { const k = Number(name); if (k >= 1 && k <= papers.length) return papers[k - 1].id; }
    return null;
  };
  const rep = (): number | null => {   // ×N 前面可以有空格（「A x2」）
    const save = i; while (src[i] === " ") i++;
    const m = REP.exec(src.slice(i)); if (!m) { i = save; return null; }
    i += m[0].length; return Number(m[1]);
  };
  const seq = (close: string | null): ArrNode[] => {
    const out: ArrNode[] = [];
    for (;;) {
      ws();
      if (i >= src.length) { if (close) issues.push({ at: src.length, len: 0, why: `少了「${close}」` }); return out; }
      const c = src[i];
      if (close && c === close) { i++; return out; }
      if (c === ")" || c === "]") { issues.push({ at: i, len: 1, why: `多了「${c}」` }); i++; continue; }
      if (c === "[") return out;   // 循环段由外层处理
      let node: ArrNode;
      const at = i;
      if (c === "(") { i++; node = { kind: "rep", body: seq(")"), n: 1 }; }
      else {
        let name = ""; while (i < src.length && !/[\s、,，→()[\]×*]/.test(src[i]) && !(/[xX]/.test(src[i]) && /\d/.test(src[i + 1] ?? "") && name)) name += src[i++];
        if (!name) { issues.push({ at: i, len: 1, why: `看不懂「${src[i]}」` }); i++; continue; }
        const paper = findPaper(name);
        if (!paper) { issues.push({ at, len: name.length, why: `没有叫「${name}」的纸（写曲段名，或者第几张纸的序号）` }); node = { kind: "rep", body: [], n: 1 }; }
        else node = { kind: "ref", paper, text: name, at };
      }
      const n = rep();
      if (n !== null) { if (n < 1 || n > 99) issues.push({ at, len: i - at, why: "重复次数要在 1 到 99 之间" }); if (n >= 1) node = { kind: "rep", body: [node], n: Math.min(99, n) }; }
      out.push(node);
    }
  };
  const main = seq(null);
  let loopNodes: ArrNode[] | null = null;
  ws();
  if (i < src.length && src[i] === "[") {
    const at = i; i++;
    loopNodes = seq("]");
    if (!loopNodes.length) issues.push({ at, len: i - at, why: "循环段是空的" });
    ws();
    if (i < src.length) { issues.push({ at: i, len: src.length - i, why: "循环段只能放在最后：后面的永远放不到" }); }
  }
  const expand = (ns: ArrNode[]): string[] => ns.flatMap((n) => (n.kind === "ref" ? [n.paper] : Array.from({ length: n.n }, () => expand(n.body)).flat()));
  const loop = loopNodes ? expand(loopNodes) : null;
  return { order: expand(main), loop: loop && loop.length ? loop : null, issues, explicit: true };
}

/** 放的顺序（循环段放一遍）：给压平件 / 导出用。 */
export const playOrder = (a: Arrangement): string[] => [...a.order, ...(a.loop ?? [])];
/** 一首歌整首放的顺序（没写编排 = 每张没藏的纸各一遍）。 */
export const songPlayOrder = (song: { arrangement?: string; papers: readonly PaperSeg[] }): string[] => playOrder(parseArrangement(song.arrangement, song.papers));

/** 循环放（走带「循环」开着；user「我确实希望能单曲循环，或者测试战斗循环切割」「无穷循环和循环走带都做」）：
 *  渲染的顺序 = 前面那段 + 循环段**放两遍**；循环区间 = 第二遍。第一遍的尾音（混响、没收完的音）自然渗进第二遍的开头，
 *  所以每次从第二遍的结尾跳回第二遍的开头，听到的接缝和真的一遍遍连着放一模一样（游戏里循环音乐切法的同一个道理）。
 *  没写循环段 = 整首循环；本段视图（歌只剩一张纸、没有编排）= 这一张循环。intro / body = 纸的张数。 */
export function loopPlan(song: { arrangement?: string; papers: readonly PaperSeg[] }): { order: string[]; intro: number; body: number } {
  const a = parseArrangement(song.arrangement, song.papers);
  const intro = a.loop ? a.order : [], body = a.loop ?? a.order;
  return { order: [...intro, ...body, ...body], intro: intro.length, body: body.length };
}
/** 循环区间（谱上的秒）：tokens / map / starts = 照 loopPlan 的顺序压平的第一个声部；第二遍从 starts[intro + body] 起、到整串结尾。 */
export function loopWindow(tokens: Token[], map: TempoMap, starts: readonly { index: number }[], plan: { intro: number; body: number }): { start: number; end: number } | null {
  if (!plan.body) return null;
  const tl = timeline(tokens, map), end = tl.length ? tl[tl.length - 1].t1 : 0, from = starts[plan.intro + plan.body]?.index ?? tokens.length;
  const start = tl.find((x) => x.index >= from)?.t0 ?? end;
  return end - start > 0.05 ? { start, end } : null;   // 循环段是空的（一个音都没有、也没有休止）= 不循环
}
