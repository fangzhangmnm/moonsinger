// spacing.test.ts —— 横向间距的规矩（src/render/spacing.ts；刀 3）。created 2026-11-09 by Claude Fable 5.1
// 每条 = user 11-08 点名的一种毛病，或者它的反面（不该变的）。数字单位 = 线间距。
import { describe, it, assert } from "./runner.mjs";
import { TPQ } from "../src/score/song.ts";
import { curveOf, idealGaps, rodsOf, placeLine, fitLine, SP_DEFAULTS, type SpCol, type SpItem } from "../src/render/spacing.ts";

const HEAD = 1.18, Q = TPQ, E = TPQ / 2, S = TPQ / 4, T32 = TPQ / 8, W = TPQ * 4, T8 = TPQ / 3;
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;
/** 几行各一串时值（从 0 开始挨着排）→ 列。opt[row][i] 可以给某个音加左伸（临时记号）/ 右伸，或 whole = 整小节休止（没有时值）。 */
function colsOf(rows: number[][], extra: Record<string, Partial<SpItem> & { whole?: boolean }> = {}): { cols: SpCol[]; end: number } {
  const at = new Map<number, SpItem[]>(); let end = 0;
  rows.forEach((durs, row) => { let t = 0; durs.forEach((d, i) => { const x = extra[`${row}:${i}`] ?? {}, a = at.get(t) ?? []; at.set(t, a);
    a.push({ row, left: x.left ?? 0, right: x.right ?? HEAD, ...(x.whole ? {} : { dur: d }) }); t += d; }); end = Math.max(end, t); });
  return { cols: [...at.entries()].sort((a, b) => a[0] - b[0]).map(([tick, items]) => ({ tick, items })), end };
}
const opts = (dense = false) => ({ curve: curveOf(dense), ...SP_DEFAULTS });
/** 自然摆法（不拉不压）下，第 row 行每个音的对齐线位置。 */
function xsOfRow(rows: number[][], row: number, dense = false, extra = {}): number[] {
  const { cols, end } = colsOf(rows, extra), o = opts(dense), g = idealGaps(cols, end, o), r = rodsOf(cols, o);
  const { xs } = placeLine(cols, g, r, 0, cols.length, 0);
  return cols.map((c, k) => (c.items.some((it) => it.row === row) ? xs[k]! : NaN)).filter((x) => !Number.isNaN(x));
}
const gapsOf = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]!);

describe("横向间距：时值 → 宽", () => {
  it("松的那一档 = 原来的数（四分 3.6、每翻倍 +0.75、十六分以下 2.2）", () => {
    const w = curveOf(false);
    for (const [d, want] of [[W, 5.1], [Q * 2, 4.35], [Q, 3.6], [E, 2.85], [S, 2.2], [T32, 2.2]] as const) assert(near(w(d), want), `${d} → ${w(d)}，要 ${want}`);
  });
  it("密的那一档：十六分 1.9、三十二分 1.6，八分以上不变", () => {
    const w = curveOf(true);
    assert(near(w(S), 1.9) && near(w(T32), 1.6) && near(w(E), 2.85) && near(w(Q), 3.6), `${w(S)} ${w(T32)} ${w(E)} ${w(Q)}`);
  });
  it("越长越宽（不许倒挂）；连音 / 附点落在两档之间", () => {
    for (const dense of [false, true]) { const w = curveOf(dense); let prev = 0; for (let d = T32 / 2; d <= W * 2; d += 35) { assert(w(d) >= prev - 1e-9, `倒挂 @${d}`); prev = w(d); }
      assert(w(T8) > w(S) && w(T8) < w(E), "八分三连音在十六分和八分之间"); assert(w(Q * 1.5) > w(Q) && w(Q * 1.5) < w(Q * 2), "附点四分在四分和二分之间"); }
  });
});

describe("横向间距：别的声部是长音，这边的短音不被拉开（user 11-08「第一个音它也会拉得很长」）", () => {
  const sixteen = Array.from({ length: 16 }, () => S);
  it("单声部十六分：等距 2.2", () => { for (const g of gapsOf(xsOfRow([sixteen], 0))) assert(near(g, 2.2), `${g}`); });
  it("对面是全音符：十六分照样等距 2.2（原来第一个 5.1）", () => { for (const g of gapsOf(xsOfRow([sixteen, [W]], 0))) assert(near(g, 2.2), `${g}`); });
  it("对面是四个四分：十六分照样等距（原来每拍第一个 3.6）", () => { for (const g of gapsOf(xsOfRow([sixteen, [Q, Q, Q, Q]], 0))) assert(near(g, 2.2), `${g}`); });
  it("对面是整小节休止：十六分照样等距", () => { for (const g of gapsOf(xsOfRow([sixteen, [W]], 0, false, { "1:0": { whole: true } }))) assert(near(g, 2.2), `${g}`); });
  it("长音那一行跟着短音那一行走：四个四分各占四个十六分的宽", () => { for (const g of gapsOf(xsOfRow([sixteen, [Q, Q, Q, Q]], 1))) assert(near(g, 8.8), `${g}`); });
  it("这一拍密、下一拍疏：密的那拍宽，疏的那拍照自己的时值", () => {
    const g = gapsOf(xsOfRow([[S, S, S, S, Q, Q], [Q, Q, Q]], 1));
    assert(near(g[0]!, 8.8) && near(g[1]!, 3.6), `${g}`);
  });
});

describe("横向间距：连音均匀（user 11-08「三连音啊、四连音啊…让他们均匀紧凑一点」）", () => {
  const trip = Array.from({ length: 12 }, () => T8);
  it("八分三连音单声部：等距，比八分紧", () => { const g = gapsOf(xsOfRow([trip], 0)); for (const x of g) assert(near(x, g[0]!) && x < 2.85, `${x}`); });
  it("八分三连音对八分：三个三连音还是等距（原来 2.85 / 5.7 / 2.85）", () => {
    const g = gapsOf(xsOfRow([trip, Array.from({ length: 8 }, () => E)], 0));
    for (const x of g) assert(near(x, g[0]!, 1e-6), `不等距：${g.map((v) => v.toFixed(2)).join(" ")}`);
  });
  it("八分那一行落在按时间算的位置上（一拍的正中）", () => {
    const rows = [trip, Array.from({ length: 8 }, () => E)], a = xsOfRow(rows, 0), b = xsOfRow(rows, 1);
    assert(near(b[1]!, (a[0]! + a[3]!) / 2, 1e-6), `八分第二个 ${b[1]}，一拍正中 ${(a[0]! + a[3]!) / 2}`);
  });
});

describe("横向间距：撞了才撑（顶杆）", () => {
  it("带临时记号的音：对齐线不动（各声部符头对齐），前面够宽就不撑", () => {
    const plain = xsOfRow([[Q, Q, Q, Q]], 0), acc = xsOfRow([[Q, Q, Q, Q]], 0, false, { "0:2": { left: 1.3 } });
    for (let i = 0; i < 4; i++) assert(near(plain[i]!, acc[i]!), `第 ${i} 个挪了：${plain[i]} → ${acc[i]}`);
  });
  it("前面不够宽（密的三十二分）才撑：正好撑到 前一个的右伸 + 左伸 + 缝", () => {
    const run = Array.from({ length: 8 }, () => T32), g = gapsOf(xsOfRow([run], 0, true, { "0:3": { left: 1.3 } }));
    assert(near(g[2]!, HEAD + 1.3 + SP_DEFAULTS.pad), `撑到 ${g[2]}`); assert(near(g[0]!, 1.6) && near(g[3]!, 1.6), `别的不动：${g}`);
  });
  it("别的行的临时记号不撑这一行够不着的地方：两行符头仍然对齐", () => {
    const rows = [Array.from({ length: 8 }, () => T32), Array.from({ length: 8 }, () => T32)], x0 = xsOfRow(rows, 0, true, { "1:3": { left: 1.3 } }), x1 = xsOfRow(rows, 1, true, { "1:3": { left: 1.3 } });
    for (let i = 0; i < 8; i++) assert(near(x0[i]!, x1[i]!), `第 ${i} 列没对齐`);
  });
  it("行首第一个音带临时记号：往右让出来", () => { assert(near(xsOfRow([[Q, Q]], 0, false, { "0:0": { left: 1.3 } })[0]!, 1.3), "行首没让"); });
  it("固定列（小节线）隔开所有行：前面的东西不压线，后面的临时记号在线后面", () => {
    const cols: SpCol[] = [{ tick: 0, items: [{ row: 0, left: 0, right: 2.4, dur: T32 }] }, { tick: T32, fixed: 1.6, items: [] }, { tick: T32, items: [{ row: 0, left: 1.3, right: HEAD, dur: Q }] }];
    const o = opts(true), { xs } = placeLine(cols, idealGaps(cols, T32 + Q, o), rodsOf(cols, o), 0, 3, 0);
    assert(xs[1]! >= xs[0]! + 2.4 + o.pad - 1e-9, `压线了：${xs}`); assert(near(xs[2]!, xs[1]! + 1.6 + 1.3), `线后面：${xs}`);
  });
});

describe("横向间距：空小节窄", () => {
  it("各行都是整小节休止：这一段最宽 emptyBar，不按全音符算", () => {
    const { cols, end } = colsOf([[W], [W]], { "0:0": { whole: true }, "1:0": { whole: true } }), o = opts();
    assert(near(idealGaps(cols, end, o)[0]!, SP_DEFAULTS.emptyBar), `${idealGaps(cols, end, o)[0]}`);
  });
});

describe("横向间距：一行排满", () => {
  const rows = [[S, S, S, S, E, E, Q, Q], [Q, Q, Q, Q]];
  it("拉满：右端正好到行宽；只拉弹簧，比例一样", () => {
    const { cols, end } = colsOf(rows), o = opts(), g = idealGaps(cols, end, o), r = rodsOf(cols, o), nat = placeLine(cols, g, r, 0, cols.length, 0);
    const f = fitLine(cols, g, r, 0, cols.length, nat.end * 1.3, { squeeze: 0.15, justify: true });
    assert(near(f.end, nat.end * 1.3, 1e-4) && !f.over && f.stretch > 0, `end ${f.end} / ${nat.end * 1.3}`);
    const a = gapsOf(nat.xs), b = gapsOf(f.xs); for (let i = 0; i < a.length; i++) assert(near(b[i]! / a[i]!, 1 + f.stretch, 1e-4), `第 ${i} 段比例 ${b[i]! / a[i]!}`);
  });
  it("稍微超一点：压回来；压到头还超 = over（换行）", () => {
    const { cols, end } = colsOf(rows), o = opts(), g = idealGaps(cols, end, o), r = rodsOf(cols, o), nat = placeLine(cols, g, r, 0, cols.length, 0);
    const a = fitLine(cols, g, r, 0, cols.length, nat.end * 0.9, { squeeze: 0.15, justify: true });
    assert(!a.over && near(a.end, nat.end * 0.9, 1e-4) && a.stretch < 0, `压：${a.end}`);
    assert(fitLine(cols, g, r, 0, cols.length, nat.end * 0.7, { squeeze: 0.15, justify: true }).over, "该换行");
  });
  it("压的时候顶杆是下限：带临时记号的密音不被压到撞", () => {
    const run = Array.from({ length: 16 }, () => T32), ex = { "0:5": { left: 1.3 } }, { cols, end } = colsOf([run], ex), o = opts(true), g = idealGaps(cols, end, o), r = rodsOf(cols, o);
    const f = fitLine(cols, g, r, 0, cols.length, 1, { squeeze: 0.15, justify: true });   // 宽 1 = 一定压到头
    for (const rod of r) assert(f.xs[rod.to]! - f.xs[rod.from]! >= rod.min - 1e-9, `撞了：${rod.from}→${rod.to}`);
  });
  it("不要求排满的行（最后一行）：放得下就原样", () => {
    const { cols, end } = colsOf(rows), o = opts(), g = idealGaps(cols, end, o), r = rodsOf(cols, o), nat = placeLine(cols, g, r, 0, cols.length, 0);
    assert(fitLine(cols, g, r, 0, cols.length, nat.end * 2, { squeeze: 0.15, justify: false }).stretch === 0, "不该拉");
  });
  it("只摆其中一段（第二行）：从自己的第一列起算，跨行的顶杆不管", () => {
    const { cols, end } = colsOf([[Q, Q, Q, Q]]), o = opts(), g = idealGaps(cols, end, o), r = rodsOf(cols, o), b = placeLine(cols, g, r, 2, 4, 0);
    assert(near(b.xs[0]!, 0) && near(b.xs[1]!, 3.6) && near(b.end, 7.2), `${b.xs} ${b.end}`);
  });
});

describe("横向间距：随便什么谱都不许撞、不许倒着排", () => {
  it("随机 200 首：对齐线一路往右；每条顶杆都满足；拉 / 压之后也满足", () => {
    let seed = 20261108; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const DURS = [T32, S, E, Q, Q * 1.5, Q * 2, T8, T8 / 2];
    for (let n = 0; n < 200; n++) {
      const nRows = 1 + Math.floor(rnd() * 4), ex: Record<string, Partial<SpItem>> = {};
      const rows = Array.from({ length: nRows }, (_, row) => { const out: number[] = []; let t = 0; while (t < W * 2) { const d = DURS[Math.floor(rnd() * DURS.length)]!; out.push(d); if (rnd() < 0.2) ex[`${row}:${out.length - 1}`] = { left: 1.3 }; if (rnd() < 0.1) ex[`${row}:${out.length - 1}`] = { ...ex[`${row}:${out.length - 1}`], right: HEAD + 0.6 }; t += d; } return out; });
      const { cols, end } = colsOf(rows, ex), o = opts(n % 2 === 0), g = idealGaps(cols, end, o), r = rodsOf(cols, o);
      for (const s of [0, 0.7, -0.15]) {
        const { xs } = placeLine(cols, g, r, 0, cols.length, s);
        for (let k = 1; k < xs.length; k++) assert(xs[k]! > xs[k - 1]! - 1e-9, `#${n} 倒着排 @${k}`);
        for (const rod of r) assert(xs[rod.to]! - xs[rod.from]! >= rod.min - 1e-9, `#${n} 撞了 ${rod.from}→${rod.to}（s=${s}）`);
      }
    }
  });
});
