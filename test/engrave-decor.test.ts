// engrave-decor.test.ts —— W-17 第 1 刀（2026-10-15）：光标 / 选区 / 写字头 / 强调色不进排版——排版的图元带 data-tok（score-view 按它开关 class），落点带 shift（鬼音符），
//   排出来的东西里没有 caret / selbox / cur / sel / hot / in-span。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, tr, type EditorState } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";
import { primSvg, toSvg } from "../src/render/svg.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const song = (n: number) => { let st = initState(); for (let i = 0; i < n; i++) st = writeDegree(st, (i % 7) + 1, "near"); return st; };
const lay = (st: EditorState, tailOpen = false) => engrave(st.song, { width: 420, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, hidden: false, badges: [], mono: true }], locale: "zh", measure: createTextMeasure((s) => s.length * 10), autoBars: true, ...(tailOpen ? { tailOpen: true } : {}) });

describe("排版不认光标（W-17 第 1 刀）", () => {
  it("每个符头 / 符干带 data-tok = 它的 token id；svg 里写成 data-tok 属性", () => {
    const st = song(12), L = lay(st), ids = new Set(tr(st).filter((t) => t.kind === "note").map((t) => t.id));
    const heads = L.prims.filter((p) => p.t === "glyph" && p.cls?.startsWith("note"));
    assert(heads.length === 12, `12 个符头（${heads.length}）`);
    for (const h of heads) assert(h.tok !== undefined && ids.has(h.tok), `符头带 tok：${JSON.stringify(h)}`);
    const stems = L.prims.filter((p) => p.t === "line" && p.tok !== undefined);
    assert(stems.length >= 12, `符干也带 tok（${stems.length}）`);
    assert(/data-tok="\d+"/.test(primSvg(heads[0], "40", "12", "6")), "primSvg 写出 data-tok");
    assert((toSvg(L).match(/data-tok=/g) ?? []).length >= 24, "整张 svg 里有 data-tok");
  });
  it("排出来的东西里没有光标 / 选区 / 写字头 / 强调色的 class（它们在 score-view 的 ink 层和 DOM class 上）", () => {
    const st = song(12), L = lay(st);
    for (const p of L.prims) { const c = p.cls ?? ""; assert(!/\b(caret|selbox|cur|sel|hot|in-span)\b/.test(c), `不该有：${c}`); }
  });
  it("写字头画在哪（heads）：每个 caret 位置都有一条、带 shift；光标停在小节线前 = 画在小节线后面的那个音那儿（老规矩）", () => {
    const st = song(12), L = lay(st), n = tr(st).length;
    for (let c = 3; c <= n; c++) { const h = L.heads.find((x) => x.caret === c && !x.end && x.lead === undefined); assert(h, `caret ${c} 有写字头位置`); eq(typeof h!.shift, "number"); }
    // 4/4 里 12 个四分音符 = 3 个整小节；自动小节线不是 token，所以每个 caret 都落在下一个音那一列（2026-11-11 Claude Opus 5.5 改：原来断言「= 符头的 x」写于 10-15，刀 3 起光标在列的对齐线上、符头在它右边 0.35，这条测试一直没登记、没跑，谱面分家第二刀第一步收）
    const notes = L.notes, byIdx = new Map(notes.map((x) => [x.index, x]));
    for (let c = 3; c < n; c++) { const h = L.heads.find((x) => x.caret === c && !x.end && x.lead === undefined)!, nx = byIdx.get(c)!; eq(h.system, nx.system, `caret ${c} 和音同一行`); assert(Math.abs((nx.x - h.x) - 0.35 * 10) < 1e-6, `caret ${c} 画在这个音的对齐线上（符头左边 0.35 个线间距：刀 3 v0.16.33 起符头画在列的 x + 0.35、光标在列的 x 再让开临时记号）`); }
  });
  it("tailOpen：写字头在尾巴后面 = 最后一行五线画到右边；别的一样", () => {
    const st = song(40), a = lay(st, false), b = lay(st, true);
    const last = (L: typeof a) => L.prims.filter((p): p is Extract<typeof p, { t: "line" }> => p.t === "line" && p.cls === "staff").at(-1)!;
    assert(last(b).x2 > last(a).x2 + 1, "最后一行画到右边");
    eq(a.notes.map((x) => [x.index, x.system, Math.round(x.x)]).join(";"), b.notes.map((x) => [x.index, x.system, Math.round(x.x)]).join(";"), "音的位置不变");
  });
});
