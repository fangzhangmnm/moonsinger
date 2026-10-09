// PDF = 「全部 + 分页」预览除了控件和提示的样子（2026-10-09 Opus 5.5；user「pdf画出来和开分页预览的不一样，没有respect track hidding，到时候记得都一起修一下，
//   做到除了控件和提示外的wysiwyg」）。守两件事：① 预览比印多出来的只有控件开关（光标、占位提示、曲段控件…），这些开关不改版面——每一行、每个音、分页一样；
//   ② 隐藏的声部 / 纸在预览里是一条细行（控件），PDF 不印它、位置照留。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, addPart, addPaper, setPaperHidden, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { engrave, type PartView } from "../src/render/engrave.ts";
import { printOpts, isPrinted, LYRIC_RAISE } from "../src/export/score-pdf.ts";

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
      const base = printOpts(st.song, sp, parts(st), measure, true, LYRIC_RAISE[font]);
      const print = engrave(st.song, base);
      for (const ctl of [{ titlePlaceholder: true }, { caret: 20, justWrote: true }, { at: { paper: st.song.papers[2]!.id, part: st.song.parts[0]!.id } }, { paperLabel: "A5" }, { sel: { from: 5, to: 9 } }]) {
        const prev = engrave(st.song, { ...base, ...ctl } as never);
        eq(geo(prev), geo(print), `开关 ${JSON.stringify(ctl)} 不改版面`);
      }
      assert(print.pages.length >= 2, `排成了好几页（${print.pages.length}）`);
    });
  }
  it("只印这一张纸 = 分页预览的「本段」：控件开关同样不改版面（2026-10-09，user「只印一段或一个声部…和wxhw差不多」）", () => {
    for (const paper of st.song.papers) {
      const base = printOpts(st.song, sp, parts(st), measure, true, 0, paper.id), print = engrave(st.song, base);
      eq(geo(engrave(st.song, { ...base, titlePlaceholder: true, caret: 20, justWrote: true, paperLabel: "A5" } as never)), geo(print), `纸 ${paper.name || paper.id}`);
      assert(print.systems.every((r) => r.paper === paper.id), "只有这一张纸的谱行");
    }
  });
  it("隐藏的声部：预览里一条细行（控件），PDF 不印；隐藏的纸：折叠的曲段名 + 细行，PDF 也不印", () => {
    const Lt = engrave(st.song, printOpts(st.song, 10, parts(st), measure, true, 0));
    const stub = Lt.prims.filter((p) => (p as { cls?: string }).cls?.includes("part-stub"));
    const hiddenName = Lt.prims.filter((p) => (p as { cls?: string }).cls?.includes("hidden-paper"));
    assert(stub.length >= 2, `预览里有细行（${stub.length}）`);
    assert(stub.every((p) => !isPrinted((p as { cls?: string }).cls)), "细行不印");
    eq(hiddenName.length, 1, "折叠的隐藏纸画了曲段名"); assert(!isPrinted((hiddenName[0] as { cls?: string }).cls), "隐藏纸的曲段名不印");
    assert(Lt.systems.every((r) => r.part !== "P2"), "隐藏的声部没有谱行");
  });
  it("声部名：还没人上场（屏幕上画淡，part-name empty）照印；占位提示（歌名 / 作者 / 曲段名的 empty）不印", () => {
    assert(isPrinted("part-name empty"), "声部名照印"); assert(!isPrinted("song-title empty") && !isPrinted("credits empty") && !isPrinted("paper-name empty"), "占位提示不印");
  });
});
