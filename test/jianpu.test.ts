// 简谱数字行（谱面分家第四刀；src/render/jianpu/、src/render/notations.ts）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   这一份守画法本身（数字 / 八度点 / 下划线 / 谱种表怎么分行 / 点击框 / 记号 / 弧线 / 连音 / 五线谱专有记号的小灰标）；全量（每个 token 都有图元）、点击只指 token 的守卫在第四刀收尾时加。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { initState, TPQ, type Song, type Token } from "../src/score/song.ts";
import { setNotation } from "../src/score/song-view.ts";
import { GEOMETRY, DRAWERS } from "../src/render/notations.ts";
import { SIGNS } from "../src/render/signs.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { FULL_VIEWS } from "./fixtures/layout/full.ts";

const P = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
/** 一条声部、给定的音（谱头照 initState）→ 简谱排一遍。 */
function lay(body: Omit<Token, "id">[], song?: (s: Song) => Song) {
  const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
  let id = 1000; const toks = [...paper.tracks[part]!, ...body.map((t) => ({ ...t, id: id++ }) as Token)];
  let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: toks } }] };
  s = setNotation({ ...st0, song: s }, "jianpu").song; if (song) s = song(s);
  const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
  return { L, toks };
}
const digits = (ps: Prim[]) => ps.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")).map((p) => p.s);
const n = (p: ReturnType<typeof P>, dur = TPQ, extra: object = {}) => ({ kind: "note", pitch: p, dur, lyric: null, ...extra }) as Omit<Token, "id">;

describe("简谱数字行", () => {
  it("谱种是简谱：有音高、没有叠音的声部排成数字行（行框 kind = jianpu；每一行都写种类）；C 大调音阶 = 1–7、高八度的 1 带一个点", () => {
    const { L } = lay(["C", "D", "E", "F", "G", "A", "B"].map((s) => n(P(s as "C"))).concat([n(P("C", 5))]));
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "jianpu"), "都是数字行");
    eq(digits(L.prims).join(""), "12345671");
    assert(L.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "")).length === 1, "高八度的 1 上一个点（八度基准 = 点最少：七个音在 0 组）");
  });
  it("叠音的声部照旧排五线谱的行（这一刀数字行只画单声部；同一张纸上两种行并排 = 过渡）", () => {
    const { L } = lay([n(P("E")), n(P("G"), TPQ, { chord: [P("C")] })]);
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "staff"), "有叠音 = 五线谱的行");
  });
  it("下划线按拍连：两个八分在同一拍 = 一条；跨拍 = 断开；十六分 = 两层", () => {
    const e = TPQ / 2, s16 = TPQ / 4;
    const ul = (body: Omit<Token, "id">[]) => lay(body).L.prims.filter((p) => p.t === "line" && /jp-ul/.test(p.cls ?? "")).length;
    eq(ul([n(P("C"), e), n(P("D"), e)]), 1, "一拍里的两个八分 = 一条");
    eq(ul([n(P("C"), TPQ), n(P("D"), e), n(P("E"), e), n(P("F"), e), n(P("G"), e)]), 2, "两拍各一条");
    eq(ul([n(P("C"), s16), n(P("D"), s16), n(P("E"), e)]), 2, "十六分十六分八分 = 第一层一条 + 第二层一条");
  });
  it("点击框：每个音、休止各一个（音的 d = NaN：数字行没有「纵向 = 音高」，不提供竖着拖）；长音 = 数字 + 横线、几拍的休止一拍一个 0", () => {
    const { L, toks } = lay([n(P("C"), TPQ * 2), { kind: "rest", dur: TPQ * 2 } as Omit<Token, "id">]);
    const iC = toks.findIndex((t) => t.kind === "note"), iR = toks.findIndex((t) => t.kind === "rest");
    assert(L.notes.some((h) => h.index === iC && Number.isNaN(h.d)), "音的点击框");
    assert(L.rests.some((h) => h.index === iR), "休止的点击框");
    eq(digits(L.prims).join(""), "100", "二分音符 1 –、二分休止 0 0");
    assert(L.prims.some((p) => p.t === "line" && /jp-dash/.test(p.cls ?? "")), "长音后面的横线");
  });
  it("长音不是整拍时后一截不画横线（统筹看第四刀成品样张后定的第 1 处）：3/4 里四拍半的音 = 第一小节「1 – –」，第二小节重写「1·」、连线连上；横线只表示整拍", () => {
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    const head = paper.tracks[part]!.map((t) => (t.kind === "time" ? { ...t, beats: 3, beatType: 4 } : t));
    let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...head, { ...n(P("C"), TPQ * 4.5), id: 1000 } as Token, { ...n(P("D"), TPQ * 1.5), id: 1001 } as Token] } }] };
    s = setNotation({ ...st0, song: s }, "jianpu").song;
    const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
    eq(digits(L.prims).join(""), "112", "C 写两次（第二小节重写），D 一次");
    eq(L.prims.filter((p) => p.t === "line" && /jp-dash/.test(p.cls ?? "") && p.tok === 1000).length, 2, "C 的横线只有第一小节那两根（一拍一根）");
    eq(L.prims.filter((p) => p.t === "path" && /jp-tie/.test(p.cls ?? "")).length, 1, "重写的「1」用连线连到前一小节的「1」");
    assert(L.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "") && p.tok === 1000).length >= 1, "第二小节那一拍半 = 带附点");
    assert(L.notes.filter((h) => h.index === paper.tracks[part]!.length).length === 1, "点击框只有一个、指回这个音");
  });
  it("记号（UX 稿第 5 节）：跳音 = 楔形、保持 = 短横、重音的帽子、次重音细一号、幽灵音小一号、气声 ×、换气 V + 吸、滚奏三道斜线", () => {
    const { L } = lay([
      n(P("C"), TPQ, { art: ["staccato"] }), n(P("D"), TPQ, { art: ["tenuto"] }), n(P("E"), TPQ, { art: ["accent"] }), n(P("F"), TPQ, { art: ["stress"] }),
      n(P("G"), TPQ, { art: ["ghost"] }), n(P("A"), TPQ, { art: ["whisper"] }), n(P("B"), TPQ, { art: ["breath"], inhale: "soft" }), n(P("C", 5), TPQ, { art: ["roll"] }),
    ]);
    const glyphs = L.prims.filter((p): p is Extract<Prim, { t: "glyph" }> => p.t === "glyph");
    assert(glyphs.some((g) => g.ch === "\u{E4A8}"), "跳音 = 楔形（E4A8）");
    assert(glyphs.some((g) => g.ch === "\u{E4A4}"), "保持 = 短横（E4A4）");
    const acc = glyphs.filter((g) => g.ch === "\u{E4A0}");
    eq(acc.length, 2, "重音、次重音都是 >");
    const sz = acc.map((g) => g.size ?? 40).sort((a, b) => a - b);
    assert(sz[0]! < sz[1]!, "次重音细一号（字号小）");
    const ds = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? ""));
    const gh = ds.find((p) => /art-ghost/.test(p.cls ?? ""));
    assert(gh !== undefined && gh.size! < ds.find((p) => !/ghost/.test(p.cls ?? ""))!.size! && !/(^|\s)ghost(\s|$)/.test(gh.cls ?? ""), "幽灵音 = 数字小一号（不是灰的：灰 = 没写音高）");
    const texts = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text").map((p) => p.s);
    assert(texts.includes("×") && texts.includes("V") && texts.includes("吸"), "气声 ×、换气 V、出声的换气「吸」");
    eq(L.prims.filter((p) => p.t === "line" && /jp-roll/.test(p.cls ?? "")).length, 3, "滚奏 = 三道短斜线");
  });
  it("没写音高的音 = 灰色 x（点得到）", () => {
    const { L, toks } = lay([n(P("C")), { kind: "note", pitch: null, dur: TPQ * 2, lyric: null } as Omit<Token, "id">]);
    const i = toks.findIndex((t) => t.kind === "note" && t.pitch === null);
    const x = L.prims.find((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && p.tok === toks[i]!.id && p.s === "x");
    assert(x !== undefined && /(^|\s)ghost(\s|$)/.test(x.cls ?? ""), "灰色 x");
    assert(L.notes.some((h) => h.index === i), "点得到");
  });
  it("建轨是谱种表里的一项（第五刀 5-2）：简谱的合租不叠成一行（一家几位各自一行、没有虚拟轨、没有只读的叠起来的行）；五线谱照旧叠", () => {
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, staff = fullSong(), jp = { ...fullSong(), notation: "jianpu" } as Song;
    const Ls = engrave(staff, v.opts(staff)), Lj = engrave(jp, v.opts(jp));
    assert(!!Ls.virtual["pa:X"] && Ls.sharedRows.length > 0, "五线谱：X、Y 叠成一行虚拟轨（只读）");
    eq(Object.keys(Lj.virtual).join(","), "", "简谱：没有虚拟轨（哪一家都不叠）");
    eq(Lj.sharedRows.length, 0, "简谱：没有只读的叠起来的行");
    for (const id of ["X", "Y"]) assert(Lj.systems.some((r) => r.paper === "pa" && r.part === id), `简谱：${id} 有自己的行`);
  });
  it("力度 = p / f 字母（和五线谱同一套字形，不分界面语言；user 11-11 夜纪要第 88 节「中文的字确实有点太抢眼了」）；中文叫法在说明栏里", () => {
    const body = [{ kind: "dyn", value: "mf" } as Omit<Token, "id">, n(P("C")), { kind: "dyn", value: "pp" } as Omit<Token, "id">, n(P("D"))];
    const glyphs = (locale: "zh" | "en") => {
      const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
      let id = 1000; let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...paper.tracks[part]!, ...body.map((t) => ({ ...t, id: id++ }) as Token)] } }] };
      s = setNotation({ ...st0, song: s }, "jianpu").song;
      const L = engrave(s, { width: 900, sp: 10, locale, at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
      return L.prims.filter((p) => /(^|\s)dyn(\s|$)/.test(p.cls ?? "")).map((p) => (p.t === "glyph" ? p.ch : p.t === "text" ? `text:${p.s}` : p.t)).join(" ");
    };
    eq(glyphs("zh"), "\u{E52D} \u{E52B}", "中文界面：mf、pp 的字母字形");
    eq(glyphs("en"), glyphs("zh"), "英文界面一样");
    assert(SIGNS["dyn:mf"].says("zh").includes("中强") && SIGNS["dyn:pp"].says("zh").includes("很弱"), "中文叫法在说明栏");
    eq(SIGNS["dyn:mf"].draw.jianpu, SIGNS["dyn:mf"].draw.staff, "简谱那一栏 = 五线谱那一栏");
  });
  it("几何表（谱面只查它；统筹审接口第 2 条）：数字行没有「纵向 = 音高」；鬼音符 = 数字 + 升降 + 照这一行八度基准的点；光标在数字行的上下沿之间", () => {
    assert(!GEOMETRY.jianpu.pitchAxis && !!GEOMETRY.staff.pitchAxis, "数字行不提供竖着拖改音高");
    const { L } = lay([n(P("C")), n(P("E")), n(P("G"))]);
    const row = L.systems.find((r) => r.kind === "jianpu")!;
    assert(typeof row.octBase === "number", "数字行带着八度基准");
    const g = (p: ReturnType<typeof P>, shown: number | null) => GEOMETRY.jianpu.ghost(row, 100, [{ p, shown, shift: 0, fifths: 0 }], 5, true);
    const dots = (svg: string) => (svg.match(/<path /g) ?? []).length, digit = (svg: string) => /middle">(\d)<\/text>/.exec(svg)?.[1];
    eq([digit(g(P("C"), null)), dots(g(P("C"), null))].join(","), "1,0", "和这一行同一个八度的 1：不加点");
    eq([digit(g(P("C", 5), null)), dots(g(P("C", 5), null))].join(","), "1,1", "高八度：一个点");
    eq([digit(g(P("A", 3), null)), dots(g(P("A", 3), null))].join(","), "6,1", "低八度的 6：一个点");
    assert(g(P("F", 4, 1), 1).includes("♯") && digit(g(P("F", 4, 1), 1)) === "4", "♯4：画升号（shown 不是 null）");
    assert(!g(P("F", 4, 1), null).includes("♯"), "shown = null 不画升降（同排版的规矩）");
    const cs = GEOMETRY.jianpu.caretSpan(row, 5), a = DRAWERS.jianpu.anchors(row.staffTop, 5 * (row.scale ?? 1));   // 行身按这一行的尺寸比例取（第五刀 5-0c）
    assert(cs.y1 < a.top + 1e-6 && cs.y2 > a.bottom - 1e-6, "光标盖住行身");
  });
  it("弧线：延音线（数据里的 tie）、圆滑线（一串连着的一条）；连音 = 组上方一个小数字；反复小节线带点", () => {
    const tr = TPQ / 3;
    const { L } = lay([
      n(P("C")), n(P("C"), TPQ, { tie: true }), n(P("D"), TPQ, { slur: true }), n(P("E"), TPQ, { slur: true }), n(P("F")),
      { kind: "bar", repeat: "start" } as Omit<Token, "id">, n(P("G"), tr), n(P("A"), tr), n(P("B"), tr), n(P("C", 5), TPQ * 3), { kind: "bar", repeat: "end" } as Omit<Token, "id">,
    ]);
    eq(L.prims.filter((p) => p.t === "path" && /jp-tie/.test(p.cls ?? "")).length, 1, "一条延音线");
    eq(L.prims.filter((p) => p.t === "path" && /jp-slur/.test(p.cls ?? "")).length, 1, "D–E–F 一条圆滑线");
    const tup = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-tuplet/.test(p.cls ?? ""));
    eq(tup.map((p) => p.s).join(","), "3", "三连音一组一个「3」");
    eq(L.prims.filter((p) => p.t === "path" && /tuplet-bracket/.test(p.cls ?? "")).length, 0, "有下划线的组不加括号");
    eq(L.prims.filter((p) => p.t === "path" && /repeat-dot/.test(p.cls ?? "")).length, 4, "|: 和 :| 各两个点");
  });
  it("五线谱才有的记号（行中间的谱号、八度线）落在数字行上 = 小灰标（不印）+ 点得到；token 都有图元", () => {
    const { L, toks } = lay([n(P("C")), { kind: "clef", clef: "F" } as Omit<Token, "id">, n(P("D")), { kind: "ottava", shift: 1 } as Omit<Token, "id">, n(P("E")), { kind: "ottava", shift: 0 } as Omit<Token, "id">]);
    const lab = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-staffonly/.test(p.cls ?? ""));
    eq(lab.map((p) => p.s).join(","), "谱号,8va,loco");
    assert(lab.every((p) => /\bann\b/.test(p.cls ?? "")), "编辑器专用（ann = 不印）");
    for (const k of ["clef", "ottava"] as const) {
      const ids = toks.filter((t) => t.kind === k).map((t) => t.id);
      assert(ids.every((id) => L.prims.some((p) => p.tok === id)), `${k} 每个 token 都有图元`);
    }
    eq(L.clefs.filter((h) => h.kind === "mid").length + L.clefs.filter((h) => h.kind === "ottava").length, 3, "三个都点得到");
  });
});
