// PDF = 「全部 + 分页」预览除了控件和提示的样子（2026-10-09 Opus 5.5；user「pdf画出来和开分页预览的不一样，没有respect track hidding，到时候记得都一起修一下，
//   做到除了控件和提示外的wysiwyg」）。守两件事：① 预览比印多出来的只有控件开关（光标、占位提示、曲段控件…），这些开关不改版面——每一行、每个音、分页一样；
//   ② 隐藏的声部 / 纸在预览里是一条细行（控件），PDF 不印它、位置照留。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, addPart, addPaper, setPaperHidden, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { engrave, type PartView } from "../src/render/engrave.ts";
import { printOpts, isPrinted, LYRIC_RAISE } from "../src/export/score-pdf.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { songViewOf, setViewInC, setChordTags } from "../src/score/song-view.ts";

let id = 8000;
const S = "CDEFGAB", L = "あいうえおかきくけこさしすせそ";
const n = (k: number, lyric = true): Token => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave: 4 + ((k >> 3) & 1) }, dur: k % 3 ? TPQ : TPQ / 2, lyric: lyric ? L[k % L.length] : null }) as Token;
function song(): EditorState {
  let st = initState();
  const head = () => tr(st).slice(0, 3);
  st = addPart(st, { id: "P2", role: "r2", mic: "m2" } as never, st.at.paper);
  const fill = (paper: string, part: string, len: number, lyric: boolean) => { st = { ...st, song: withTrack(st.song, paper, part, [...(st.song.papers.find((p) => p.id === paper)!.tracks[part] ?? head()).slice(0, 3), ...Array.from({ length: len }, (_, k) => n(k, lyric))]) }; };
  const p1 = st.song.papers[0]!.id;
  fill(p1, st.song.parts[0]!.id, 70, true); fill(p1, "P2", 70, false);
  st = addPaper(st, p1); const p2 = st.song.papers[1]!.id; fill(p2, st.song.parts[0]!.id, 40, true);
  st = addPaper(st, p2); const p3 = st.song.papers[2]!.id; fill(p3, st.song.parts[0]!.id, 60, true);
  return setPaperHidden(st, p2, true);   // 中间那张藏起来
}
const parts = (st: EditorState): PartView[] => st.song.parts.map((p, k) => ({ id: p.id, name: k ? "Piano" : "Vocals", first: k === 0, clef: "G", hidden: p.id === "P2" }));
const measure = (s: string) => [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 16 : 9), 0);   // 假尺子：两边同一把就行
const geo = (Lt: ReturnType<typeof engrave>) => JSON.stringify({ rows: Lt.systems.map((r) => [r.top, r.staffTop, r.bottom, r.paper, r.part]), notes: Lt.notes.map((x) => [x.index, x.system, Math.round(x.x * 100), Math.round(x.y * 100)]), pages: Lt.pages, h: Lt.height });

describe("PDF = 分页预览（除了控件和提示）", () => {
  const st = song(), sp = 10;
  for (const font of ["sans", "pinyin"] as const) {
    it(`${font}：预览多的只有控件开关（光标、占位提示、曲段控件、刚写过），版面一模一样`, () => {
      const base = printOpts(st.song, sp, parts(st), createTextMeasure(measure), true, LYRIC_RAISE[font]);
      const print = engrave(st.song, base);
      for (const ctl of [{ chrome: { famGap: 0.8, navRoom: 16 } }, { at: { paper: st.song.papers[2]!.id, part: st.song.parts[0]!.id } }]) {   // 刀 1：编辑器的控件 / 提示不在排版器里了，只剩几何参数 chrome（分页 = 不留虚线框）   // 光标 / 选区 / 刚写过已不进排版（W-17 第 1 刀）
        const prev = engrave(st.song, { ...base, ...ctl } as never);
        eq(geo(prev), geo(print), `开关 ${JSON.stringify(ctl)} 不改版面`);
      }
      assert(print.pages.length >= 2, `排成了好几页（${print.pages.length}）`);
    });
  }
  it("按 C 调看 + 和弦级数（v0.16.13，user「和弦级数和accessibility也进打印和最好导出，wysiwyg」）：印的带上它们，控件开关照样不改版面；专业模式 C 调的淡「1=C」不印", () => {
    // 谱面分家第三刀起这两样是歌里的设置：印的跟着歌（不再从印的选项进来）
    const song = setChordTags(setViewInC(st, true), true).song, base = printOpts(song, sp, parts(st), createTextMeasure(measure), true, 0), print = engrave(song, base);
    eq(songViewOf(song).inC, true); eq(songViewOf(song).chordTags, true); eq(base.chrome, undefined, "印 = 不给编辑器留地方");
    eq(geo(engrave(song, { ...base, chrome: { famGap: 0.8, navRoom: 16 } })), geo(print), "编辑器的几何参数（分页时）不改版面");
    assert(print.prims.some((p) => (p as { cls?: string }).cls?.includes("key-label") && isPrinted((p as { cls?: string }).cls)), "「1=原来的调」印");
    assert(!print.prims.some((p) => ((p as { cls?: string }).cls ?? "").includes("key-hint")), "淡「1=C」不是排版器画的（覆盖层，刀 1）");
    eq(geo(engrave(setChordTags({ ...st, song }, false).song, base)), geo(print), "和弦级数不占地方（开关不改版面）");
  });
  it("只印这一张纸 = 分页预览的「本段」：控件开关同样不改版面（2026-10-09，user「只印一段或一个声部…和wxhw差不多」）", () => {
    for (const paper of st.song.papers) {
      const base = printOpts(st.song, sp, parts(st), createTextMeasure(measure), true, 0, paper.id), print = engrave(st.song, base);
      eq(geo(engrave(st.song, { ...base, chrome: { famGap: 0.8, navRoom: 16 } })), geo(print), `纸 ${paper.name || paper.id}`);
      assert(print.systems.every((r) => r.paper === paper.id), "只有这一张纸的谱行");
    }
  });
  it("隐藏的声部：不排、不占地方（刀 1，施工单 §4 第 5 条：预览的版面 = PDF）；隐藏的整张纸也不排、不占地方（v0.16.34，user 11-09「打印的时候不留…显示的时候要和打印时的排版一样」）", () => {
    const Lt = engrave(st.song, printOpts(st.song, 10, parts(st), createTextMeasure(measure), true, 0));
    assert(!Lt.prims.some((p) => /part-stub|hidden-paper|hidden-note/.test((p as { cls?: string }).cls ?? "")), "排版器不画细行 / 隐藏纸的名字 / 说明（覆盖层）");
    assert(Lt.systems.every((r) => r.part !== "P2"), "隐藏的声部没有谱行");
    const hp = Lt.papers.find((p) => p.hidden); assert(!!hp && hp.top === hp.bottom && !hp.title.shown, "隐藏的纸：一点地方都不占（top = bottom、没有曲段名那一条）");
    assert(Lt.systems.every((r) => r.paper !== hp!.id) && !Lt.prims.some((p) => p.t === "text" && (p.cls ?? "").includes("paper-name") && p.s === st.song.papers.find((x) => x.id === hp!.id)!.name), "隐藏的纸：没有谱行、名字也不印");
    const unhid = { ...st.song, papers: st.song.papers.map((p) => ({ ...p, hidden: false })) };
    assert(engrave(unhid, printOpts(unhid, 10, parts(st), createTextMeasure(measure), true, 0)).systems.length > Lt.systems.length, "放出来 = 多排几行");
    assert(Lt.papers.filter((p) => !p.hidden).every((p) => p.hiddenParts.includes("P2") || !st.song.papers.find((x) => x.id === p.id)!.tracks.P2), "锚点里记着哪几位隐藏着（覆盖层的「隐藏 N」）");
    const shown = engrave(st.song, printOpts(st.song, 10, parts(st).map((p) => ({ ...p, hidden: false })), createTextMeasure(measure), true, 0));
    assert(shown.height > Lt.height || shown.pages.length > Lt.pages.length || shown.systems.length > Lt.systems.length, "放出来 = 多排几行（隐藏时真的不占地方）");
  });
  it("声部名：还没人上场（屏幕上画淡，part-name empty）照印；排版器里没有占位提示；只给写谱的人看的披露（ann）不印", () => {
    assert(isPrinted("part-name empty"), "声部名照印"); assert(!isPrinted("tempo-change ann") && !isPrinted("dyn-implied ann"), "披露不印");
    const Lt = engrave(st.song, printOpts(st.song, 10, parts(st), createTextMeasure(measure), true, 0));
    assert(!Lt.prims.some((p) => / empty|^empty/.test((p as { cls?: string }).cls ?? "") && !/part-name/.test((p as { cls?: string }).cls ?? "")), "没有占位提示（覆盖层画）");
  });
});
