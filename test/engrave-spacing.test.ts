// engrave-spacing.test.ts —— 刀 3 接进排版器之后的样子（用真的 engrave()）。created 2026-11-09 by Claude Opus 5.5
// 施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §1.5：§0 那张表的每一行一条。单位 = 线间距（sp = 10）。
import { describe, it, assert } from "./runner.mjs";
import { engrave, type Layout } from "../src/render/engrave.ts";
import { TPQ, headTokens, type Token, type Song } from "../src/score/song.ts";

let id = 100;
const C5 = { step: "C" as const, octave: 5, alter: 0 };
const N = (dur: number, extra: Record<string, unknown> = {}): Token => ({ kind: "note", id: id++, pitch: C5, dur, lyric: null, ...extra }) as Token;
const R = (dur: number): Token => ({ kind: "rest", id: id++, dur }) as Token;
const head = (m: { beats?: number; beatType?: number } = {}): Token[] => headTokens(m).map((t) => ({ ...t, id: id++ }) as Token);
const S16 = TPQ / 4, T8 = TPQ / 3, W = TPQ * 4;
function lay(tracks: Record<string, Token[]>, extra: Partial<Song> = {}, width = 900): Layout {
  const parts = Object.keys(tracks).map((pid, k) => ({ id: pid, role: `r${k}`, mic: `m${k}` }));
  const song = { hum: "n", parts, papers: [{ id: "A", name: "", tracks }], ...extra } as Song;
  return engrave(song, { width, sp: 10, at: { paper: "A", part: parts[0].id }, parts: parts.map((p, k) => ({ id: p.id, name: `P${k}`, first: k === 0, clef: "G" as const, hidden: false, badges: [] })), measureLyric: (s) => s.length * 10, autoBars: true });
}
/** 第 k 个声部第一行谱上每个音的 x（线间距）。 */
const xsOf = (L: Layout, part: string) => { const row = L.systems.findIndex((s) => s.part === part); return L.notes.filter((n) => n.system === row).map((n) => n.x / L.sp).sort((a, b) => a - b); };
const gaps = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]!);
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) <= e;
const sixteen = (first: Record<string, unknown> = {}) => [...head(), N(S16, first), ...Array.from({ length: 15 }, () => N(S16))];

describe("刀 3：别的声部的长音不撑开这边的短音（user 11-08「第一个音它也会拉得很长」）", () => {
  for (const [name, other] of [["全音符", () => [...head(), N(W)]], ["四个四分", () => [...head(), N(TPQ), N(TPQ), N(TPQ), N(TPQ)]], ["整小节休止", () => [...head(), R(W)]]] as const) {
    it(`十六分对${name}：等距（压紧 = 1.9）`, () => { for (const g of gaps(xsOf(lay({ a: sixteen(), b: other() }), "a"))) assert(near(g, 1.9), `${g}`); });
  }
  it("三连音对八分：三连音等距（原来 2.85 / 5.7 / 2.85）", () => {
    const g = gaps(xsOf(lay({ a: [...head(), ...Array.from({ length: 12 }, () => N(T8))], b: [...head(), ...Array.from({ length: 8 }, () => N(TPQ / 2))] }), "a"));
    for (const x of g) assert(near(x, g[0]!, 1e-6), g.map((v) => v.toFixed(2)).join(" "));
  });
});

describe("刀 3：挂在音上的记号不占宽", () => {
  const base = xsOf(lay({ a: sixteen() }), "a");
  const cases: [string, () => Token[]][] = [
    ["重音", () => sixteen({ art: ["accent"] })], ["音内起伏", () => sixteen({ art: ["swellBoth"] })], ["sfz", () => sixteen({ art: ["sfz"] })],
    ["力度", () => { const t = sixteen(); t.splice(3, 0, { kind: "dyn", id: id++, value: "fff" } as Token); return t; }],
    ["渐强", () => { const t = sixteen(); t.splice(3, 0, { kind: "hairpin", id: id++, dir: "cresc" } as Token); return t; }],
    ["风格", () => { const t = sixteen(); t.splice(3, 0, { kind: "groove", id: id++, style: "swing" } as Token); return t; }],
  ];
  for (const [name, mk] of cases) it(`${name}：每个音的 x 和不挂时一样`, () => { const xs = xsOf(lay({ a: mk() }), "a"); assert(xs.length === base.length && xs.every((x, i) => near(x, base[i]!)), `${xs.slice(0, 4)} vs ${base.slice(0, 4)}`); });
});

describe("刀 3：符头对齐 + 临时记号挂在左边", () => {
  it("两个声部同一时刻、一个带升号：两个符头 x 相同，升号在符头左边", () => {
    const sharp = { pitch: { step: "F", octave: 5, alter: 1 } };
    const L = lay({ a: [...head(), N(TPQ), N(TPQ, sharp), N(TPQ), N(TPQ)], b: [...head(), N(TPQ), N(TPQ), N(TPQ), N(TPQ)] });
    const a = xsOf(L, "a"), b = xsOf(L, "b");
    for (let i = 0; i < 4; i++) assert(near(a[i]!, b[i]!), `第 ${i} 个：${a[i]} vs ${b[i]}`);
    const rowA = L.systems.findIndex((s) => s.part === "a"), acc = L.prims.find((p) => p.t === "glyph" && p.ch === "\u{E262}");
    assert(acc && acc.t === "glyph" && acc.x < a[1]! * L.sp - 0.5 * L.sp, `升号 ${acc && "x" in acc ? acc.x : "?"} 在符头 ${a[1]! * L.sp} 左边`);
    assert(rowA >= 0);
  });
});

describe("刀 3：整小节休止 + 空小节", () => {
  it("6/8 整小节休止 = 全休止字形、在两条小节线正中、不画附点", () => {
    const m68 = { beats: 6, beatType: 8 }, L = lay({ a: [...head(m68), N(TPQ * 1.5), N(TPQ * 1.5), R(TPQ * 3), N(TPQ * 3)] });
    const rest = L.prims.filter((p) => p.t === "glyph" && (p.cls ?? "").startsWith("rest"));
    assert(rest.length === 1 && rest[0]!.t === "glyph" && rest[0]!.ch === "\u{E4E3}", `休止 ${rest.map((r) => (r.t === "glyph" ? r.ch.codePointAt(0)!.toString(16) : "")).join(",")}`);
    const bx = L.bars.map((b) => b.x).sort((a, b) => a - b), r = rest[0]!, cx = (r.t === "glyph" ? r.x : 0) + 1.128 * L.sp / 2;
    const left = bx.filter((x) => x < cx).at(-1)!, right = bx.find((x) => x > cx)!;
    assert(Math.abs(cx - (left + right) / 2) < 0.1 * L.sp, `中心 ${cx}，两条小节线 ${left} / ${right}`);
    assert(!L.prims.some((p) => p.t === "glyph" && p.ch === "\u{E1E7}" && p.x > left && p.x < right), "这一小节里没有附点（前面两个附点四分的附点不算）");
  });
  it("各声部都空的小节比写满的窄", () => {
    const L = lay({ a: [...head(), N(TPQ), N(TPQ), N(TPQ), N(TPQ), R(W), N(TPQ), N(TPQ), N(TPQ), N(TPQ)], b: [...head(), N(W), R(W), N(W)] });
    const ms = L.measures.filter((m) => m.row === 0).map((m) => m.x / L.sp);
    const w1 = ms[1]! - ms[0]!, w2 = ms[2]! - ms[1]!;
    assert(w2 < w1 * 0.75, `空小节 ${w2.toFixed(1)}，写满的 ${w1.toFixed(1)}`);
  });
});

describe("刀 3：短音符压紧的开关", () => {
  it("默认压紧：十六分 1.9；denseShort off：2.2", () => {
    for (const g of gaps(xsOf(lay({ a: sixteen() }), "a"))) assert(near(g, 1.9), `默认 ${g}`);
    for (const g of gaps(xsOf(lay({ a: sixteen() }, { denseShort: "off" }), "a"))) assert(near(g, 2.2), `松 ${g}`);
  });
});

describe("刀 3：折行不留孤零零的最后一个小节", () => {
  it("十六个一样的小节、一行放得下七个：不排成 7 + 7 + 2", () => {
    const t = [...head()]; for (let m = 0; m < 16; m++) for (let k = 0; k < 4; k++) t.push(N(TPQ));
    const L = lay({ a: t }, {}, 560), per = new Map<number, number>();
    for (const m of L.measures) per.set(m.row, (per.get(m.row) ?? 0) + 1);
    const counts = [...per.values()];
    assert(counts.length >= 2 && Math.min(...counts) >= Math.max(...counts) - 2, `每行 ${counts.join(" / ")}`);
  });
});

describe("刀 3：三首样张 × 六种视图，同一行的符头不叠", () => {
  it("同一条谱行上前后两个符头至少隔一个符头宽", async () => {
    const C = await import("./fixtures/layout/cases.ts");
    for (const key of Object.keys(C.SONGS)) for (const v of C.VIEWS) {
      const L = C.caseLayout(key, v), bySys = new Map<number, number[]>();
      for (const n of L.notes) if (!n.part) { const a = bySys.get(n.system) ?? []; a.push(n.x); bySys.set(n.system, a); }
      for (const [sys, xs] of bySys) {
        const u = [...new Set(xs.map((x) => Math.round(x * 1000) / 1000))].sort((a, b) => a - b);
        for (let i = 1; i < u.length; i++) assert(u[i]! - u[i - 1]! >= 1.18 * L.sp - 1e-6, `${key} · ${v.name} 行 ${sys}：${(u[i - 1]! / L.sp).toFixed(2)} 和 ${(u[i]! / L.sp).toFixed(2)} 叠了`);
      }
    }
  });
});
