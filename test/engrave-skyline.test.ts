// engrave-skyline.test.ts —— 刀 4b：挂件贴着天际线摆（用真的 engrave()）。created 2026-11-09 by Claude Opus 5.5
// 施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §2.3：user 点名的几样 + 性质测试（三首样张 × 六种视图：挂件互不相交、不压音符 / 符干 / 符杠）+ 注解不改版面。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { engrave, type Layout, type Prim } from "../src/render/engrave.ts";
import { primInk } from "../src/render/skyline.ts";
import { isPrinted } from "../src/export/score-pdf.ts";
import { SONGS, VIEWS, loadSong, snapshot } from "./fixtures/layout/cases.ts";

let id = 9000;
const S = "CDEFGAB";
type Extra = Record<string, unknown>;
const n = (k: number, octave = 4, extra: Extra = {}, dur = TPQ): Token => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave }, dur, lyric: null, ...extra }) as Token;
const dyn = (value: string): Token => ({ kind: "dyn", id: id++, value }) as Token;
const pin = (dir: "cresc" | "dim"): Token => ({ kind: "hairpin", id: id++, dir }) as Token;
const SP = 10, measure = (s: string) => s.length * SP;
function song(items: Token[]): EditorState { const st = initState(); return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), ...items]) }; }
const lay = (items: Token[], extra: Extra = {}): Layout => { const st = song(items); return engrave(st.song, { width: 900, sp: SP, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false }], measureLyric: measure, ...extra } as never); };
const cls = (p: Prim) => p.cls ?? "";
/** 一个图元的墨，切成小块（px）。 */
const boxes = (p: Prim, sp: number, m: (s: string, size: number) => number) => { const out: [number, number, number, number][] = []; primInk(p, sp, m, (x0, x1, y0, y1) => out.push([x0, x1, y0, y1])); return out; };
const bbox = (p: Prim) => { const b = boxes(p, SP, (s, size) => measure(s) * size / (1.6 * SP)); return [Math.min(...b.map((x) => x[0])), Math.max(...b.map((x) => x[1])), Math.min(...b.map((x) => x[2])), Math.max(...b.map((x) => x[3]))] as const; };

describe("刀 4b：挂件贴着天际线（user 11-08 截图里点名的几样）", () => {
  it("音内 <> 在这个音最高点上方 1.2 个线间距以内（原来整行一条里道，飘得高）", () => {
    const L = lay([n(5, 5, { art: ["swellBoth"] }), n(0, 5), n(1, 5), n(2, 5)]);   // A5：谱上面、符干朝下 = 最高点是符头
    const hp = L.prims.find((p) => p.t === "path" && /\bhairpin\b/.test(cls(p)))!, note = L.notes[0]!;
    const gap = (note.y - 0.5 * SP - bbox(hp)[3]) / SP;
    assert(gap > 0 && gap <= 1.2, `小发夹底边离符头顶 ${gap.toFixed(2)} 个线间距`);
  });
  it("低音区的 p 不被同一行远处的高音抬高（基线离第五线 ≤ 3 个线间距）", () => {
    const L = lay([dyn("p"), n(2, 4), n(3, 4), n(4, 4), n(5, 4), n(0, 4), n(1, 4), n(2, 4), n(0, 7)]);   // 同一行最后一个音 C7（上加好几线）
    const p = L.prims.find((x) => x.t === "glyph" && /\bdyn\b/.test(cls(x))) as { y: number };
    const rise = (L.systems[0]!.staffTop - p.y) / SP;
    assert(L.systems.length === 1, "一行放得下");
    assert(rise > 0 && rise <= 3, `p 的基线在第五线上方 ${rise.toFixed(2)} 个线间距`);
  });
  it("用发夹连着的两个力度字同一条基线（这一串里最高的那个）", () => {
    const L = lay([dyn("p"), pin("cresc"), n(0, 4), n(1, 4), n(2, 6), n(3, 4), dyn("f"), n(4, 4)]);   // 中间有个高音：整串一起抬
    const ds = L.prims.filter((x) => x.t === "glyph" && /\bdyn\b/.test(cls(x))) as { y: number }[];
    eq(ds.length, 2);
    assert(Math.abs(ds[0]!.y - ds[1]!.y) < 0.01, `p ${ds[0]!.y} / f ${ds[1]!.y}`);
  });
  it("没有挂件的行：谱上面只留版式的最小值", () => {
    const st = song([n(0, 5), n(1, 5), n(2, 5), n(3, 5)]), id2 = "p2";
    const s2 = { ...st.song, parts: [...st.song.parts, { ...st.song.parts[0]!, id: id2, role: "r9", mic: "m9" }], papers: st.song.papers.map((pp) => ({ ...pp, tracks: { ...pp.tracks, [id2]: [...tr(st).slice(0, 3), n(6, 4), n(5, 4), n(4, 4), n(3, 4)] } })) };
    const L = engrave(s2, { width: 900, sp: SP, at: st.at, parts: [st.at.part, id2].map((pid, k) => ({ id: pid, name: `V${k}`, empty: false, first: k === 0, clef: "G" as const, hidden: false, badges: [], mono: false })), measureLyric: measure } as never);
    const r2 = L.systems.find((r) => r.part === id2)!;
    const above = (r2.staffTop - r2.top) / SP;
    assert(Math.abs(above - 4.6) < 1e-6, `第二位那一行谱上面留 ${above}（舒适档最小值 4.6）`);
  });
  it("和弦级数在和弦右下角（符头右边、谱下面），不压歌词", () => {
    const ch = (k: number, lyric: string) => n(k, 4, { chord: [{ step: S[(k + 4) % 7], alter: 0, octave: k + 4 >= 7 ? 5 : 4 }, { step: S[(k + 2) % 7], alter: 0, octave: k + 2 >= 7 ? 5 : 4 }].sort(() => 0), lyric });
    const L = lay([ch(0, "あ"), ch(3, "い"), ch(4, "う"), ch(0, "え")], { chordTags: true });
    const tags = L.prims.filter((p) => p.t === "text" && /\bchord-tag\b/.test(cls(p))), lys = L.prims.filter((p) => p.t === "text" && /^lyric\b/.test(cls(p)));
    assert(tags.length >= 3, `标了 ${tags.length} 个`);
    const bottom = L.systems[0]!.staffTop + 4 * SP;
    for (const t of tags) {
      const b = bbox(t), head = L.notes.find((x) => Math.abs(x.x + x.w + 0.3 * SP - (t as { x: number }).x) < 1)!;
      assert(!!head, `级数靠左对齐在某个符头右缘 + 0.3（x ${(t as { x: number }).x}）`);
      assert(b[2] > bottom, `在谱下面（字顶 ${b[2]} > 第一线 ${bottom}）`);
      for (const l of lys) { const c = bbox(l); assert(b[1] <= c[0] || c[1] <= b[0] || b[3] <= c[2] || c[3] <= b[2], `级数 ${(t as { s: string }).s} 不压歌词 ${(l as { s: string }).s}`); }
    }
  });
});

describe("刀 4b：注解不改版面（注解只看天际线、不写）", () => {
  for (const key of Object.keys(SONGS)) for (const v of VIEWS) it(`${key} · ${v.name}`, () => {
    const { song: s0, labels } = loadSong(key), sg = v.song ? v.song(s0) : s0, o = v.opts(sg, labels);
    const a = JSON.stringify(snapshot(engrave(sg, o))), b = JSON.stringify(snapshot(engrave(sg, { ...o, __noAnn: true })));
    assert(a === b, "关掉注解之后可印的图元 / 锚点变了 = 注解推了别人");
  });
});

/** 挂件（贴天际线摆的那些）和音符层（符头 / 符干 / 符杠）。 */
const ATTACH = /^(dyn|hairpin|dyn-word|ottava|volta|nav-mark|nav-word|nav-sign|tempo|groove-mark|bar-no|chord-tag)\b/;
const isStrongArt = (p: Prim) => p.t === "glyph" && /^art\b/.test(cls(p)) && ["\u{E4A0}", "\u{E4AC}", "\u{E4B6}", "\u{E4B8}"].includes(p.ch);
const isNoteInk = (p: Prim, sp: number) => (p.t === "glyph" && /^note\b/.test(cls(p))) || /^beam\b/.test(cls(p)) || (p.t === "line" && (!p.cls || p.cls === "ghost") && Math.abs(p.w - 0.12 * sp) < 1e-6);
describe("刀 4b 性质：三首样张 × 六种视图，挂件互不相交、不压音符 / 符干 / 符杠", () => {
  for (const key of Object.keys(SONGS)) for (const v of VIEWS) it(`${key} · ${v.name}`, () => {
    const { song: s0, labels } = loadSong(key), sg = v.song ? v.song(s0) : s0, o = v.opts(sg, labels), L = engrave(sg, o), sp = L.sp, tol = 0.05 * sp;
    const m = (s: string, size: number) => (o.measureLyric(s) * size) / (1.6 * sp * (o.textScale ?? 1));   // 量字的尺子按字的字号（刀 2）
    const att = L.prims.filter((p) => isPrinted(p.cls) && (ATTACH.test(cls(p)) || isStrongArt(p))).map((p) => ({ p, b: boxes(p, sp, m) }));
    const ink = L.prims.filter((p) => isNoteInk(p, sp)).map((p) => ({ p, b: boxes(p, sp, m) }));
    const hit = (a: number[][], b: number[][]) => a.some((x) => b.some((y) => x[0] + tol < y[1] && y[0] + tol < x[1] && x[2] + tol < y[3] && y[2] + tol < x[3]));
    const bad: string[] = [];
    for (let i = 0; i < att.length; i++) {
      for (let j = i + 1; j < att.length; j++) {
        const pair = [cls(att[i]!.p), cls(att[j]!.p)];
        if (pair.some((c) => /^dyn-word\b/.test(c)) && pair.some((c) => /^dyn-dash\b/.test(c))) continue;   // 「cresc.」和它自己后面的虚线：排版器按浏览器里量过的字宽（PIN_WORD）留缝，这里的粗估量字（每个拉丁字母 0.56 字宽）会估宽、误报
        if (hit(att[i]!.b, att[j]!.b)) bad.push(`${pair[0]} × ${pair[1]}`);
      }
      for (const k of ink) if (hit(att[i]!.b, k.b)) bad.push(`${cls(att[i]!.p)} 压 ${cls(k.p) || "符干"}`);
    }
    assert(bad.length === 0, `${bad.length} 处：${[...new Set(bad)].slice(0, 6).join("；")}`);
  });
});
