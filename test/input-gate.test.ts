// input-gate.test.ts —— 键盘总闸的判断（src/app/input-gate.ts）。created 2026-11-09 by Claude Fable 5.1
//   user 11-09：「我发现插头断掉的时候，你其他的一些像零啊、横杠啊这些东西还是有…那个拔插头的功能…没有做好」「在选乐器的时候，这些拔都是得做好」
//   「即使你被锁着，你键盘还是可以弹的」。三块：① 能不能写（三个原因合成一个答案、读的动作不问）② 键表里每个键是「写谱」还是「读」的明文表
//   （按效果算出来、冻在这里：加了新键 / 改了命令的行为，这张表不跟着改 = 红）③ 这一下按键归谁（先后顺序就是规矩）。
import { describe, it, eq, assert } from "./runner.mjs";
import { noWrite, writesScore, stepLocus, createInputGate, keyOwner, PLUG_LOCI, type KeyFacts, type NoWrite, type KeyOwner } from "../src/app/input-gate.ts";
import { BINDINGS } from "../src/keyboard/keys.ts";
import { apply } from "../src/score/commands.ts";
import { initState, withTrack, tr, TPQ, setUnit, type Token, type EditorState } from "../src/score/song.ts";
import { emptyHistory, record, type LocusKind } from "../src/score/history.ts";
import { emptyExtras } from "../src/format/project.ts";

let id = 9000;
const S = "CDEFGAB";
const note = (k: number): Token => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave: 4 }, dur: TPQ, lyric: null }) as Token;
const st0 = initState(), head = tr(st0).length;
const song = withTrack(st0.song, st0.at.paper, st0.at.part, [...tr(st0), note(0), note(1), note(2), note(3)]);
/** 写：光标在第二个音后面；改：选中中间两个音。 */
const W: EditorState = { ...st0, song, caret: head + 2, sel: null }, E: EditorState = { ...st0, song, caret: head + 3, sel: { from: head + 1, to: head + 3 } };
const rig = (f: { locked?: boolean; picking?: boolean; unplugged?: boolean }) => {
  const blocked: string[] = [];
  const g = createInputGate({ locked: () => !!f.locked, picking: () => !!f.picking, unplugged: () => !!f.unplugged, onBlocked: (why, kind) => { blocked.push(`${why}/${kind}`); } });
  return { g, blocked };
};

describe("键盘总闸：现在能不能往谱上写（三个原因现算成一个答案）", () => {
  it("都没有 = 能写；先说锁，再说在选乐器，最后才是自己拔的", () => {
    eq(noWrite({ locked: false, picking: false, unplugged: false }), null);
    eq(noWrite({ locked: true, picking: true, unplugged: true }), "locked");
    eq(noWrite({ locked: false, picking: true, unplugged: true }), "picking");
    eq(noWrite({ locked: false, picking: false, unplugged: true }), "unplugged");
  });
  for (const why of ["locked", "picking", "unplugged"] as NoWrite[]) it(`${why}：会改谱的一下被挡（安静 + 回调一次），只动光标 / 选中 / 输入状态的照常`, () => {
    const { g, blocked } = rig({ [why]: true });
    eq(g.why(), why);
    const rest = apply(W, { k: "rest" }, 0), left = apply(W, { k: "caret", d: -1 }, 0), sel = apply(W, { k: "selext", d: -1 }, 0), unit = setUnit(W, TPQ / 2), sharp = apply(W, { k: "acc", acc: 1 }, 0);
    assert(writesScore(W, rest) && !writesScore(W, left) && !writesScore(W, sel) && !writesScore(W, unit) && !writesScore(W, sharp), "（前提）休止改谱；挪光标 / 选中 / 时值旋钮 / 升降锁不改");
    eq(g.may(W, rest), false); eq(blocked.join(), `${why}/score`);
    eq(g.may(W, left), true); eq(g.may(W, sel), true); eq(g.may(W, unit), true); eq(g.may(W, sharp), true); eq(g.may(W, W), true);
    eq(blocked.length, 1, "读的动作不叫回调");
    eq(g.mayWrite(), false); eq(g.mayWrite("paper"), false); eq(blocked.slice(1).join(), `${why}/score,${why}/paper`);
  });
  it("能写的时候：什么都放行，不叫回调", () => {
    const { g, blocked } = rig({});
    eq(g.why(), null); eq(g.may(W, apply(W, { k: "rest" }, 0)), true); eq(g.mayWrite(), true); eq(g.mayToggle(), true); eq(blocked.length, 0);
  });
  it("「弹」这颗钮：锁着 / 在选乐器 = 强制拔着、拨不动；只是自己拔着 = 能接回去", () => {
    eq(rig({ unplugged: true }).g.mayToggle(), true);
    { const { g, blocked } = rig({ locked: true }); eq(g.mayToggle(), false); eq(blocked.join(), "locked/score"); }
    { const { g, blocked } = rig({ picking: true, unplugged: true }); eq(g.mayToggle(), false); eq(blocked.join(), "picking/score"); }
  });
  it("键盘上的撤销 / 重做：自己拔着时，轮到谱 / 纸上的那一步就停；乐器 / 混音 / 封面那几块照常；锁着和在选乐器不在这里拦", () => {
    const hist = (kind: LocusKind) => record(emptyHistory(), W, emptyExtras(), null, 0, { kind, label: "" });
    eq(stepLocus(emptyHistory(), "undo"), null); eq(stepLocus(hist("studio"), "undo"), "studio"); eq(stepLocus(hist("studio"), "redo"), null);
    assert(PLUG_LOCI.has("score") && PLUG_LOCI.has("paper") && !PLUG_LOCI.has("lounge") && !PLUG_LOCI.has("studio") && !PLUG_LOCI.has("cover"), "插头管谱和纸");
    const { g, blocked } = rig({ unplugged: true });
    eq(g.mayStep(hist("score"), "undo"), false); eq(g.mayStep(hist("paper"), "undo"), false); eq(blocked.join(), "unplugged/score,unplugged/paper");
    eq(g.mayStep(hist("lounge"), "undo"), true); eq(g.mayStep(hist("studio"), "undo"), true); eq(g.mayStep(hist("cover"), "undo"), true);
    eq(g.mayStep(emptyHistory(), "undo"), true, "没有可撤的：放行，让宿主照常说「没有可撤销的」");
    eq(rig({ locked: true }).g.mayStep(hist("score"), "undo"), true, "锁着：文档自己拒、自己说");
    eq(rig({ picking: true }).g.mayStep(hist("score"), "undo"), true, "在选乐器：乐器页自己的撤销");
    eq(rig({}).g.mayStep(hist("score"), "undo"), true);
  });
});

describe("键盘总闸：键表里每个键是写谱还是读（明文表；按效果算，冻在这里）", () => {
  // 写 = 光标在音中间；改 = 选中两个音。「写谱」= 拔着时这一下不做；「读」「没动」= 照常。
  // 不是编辑命令的那些（k ≠ cmd）由 main.ts run() 明着处理：stack / 剪切 / 粘贴 = 写；复制 / 全选 / 放 / 存 / 开 = 读；撤销 / 重做看那一步改的是哪；歌词框 / 记号框的键归框。
  const FROZEN = `
degree.near|写谱|写谱
stack|stack|stack
degree.down|写谱|写谱
rest|写谱|写谱
bar|写谱|写谱
shorter|读|读
longer|读|读
tuplet|读|读
extend|写谱|没动
sharp|读|写谱
flat|读|写谱
octave.up|写谱|写谱
octave.down|写谱|写谱
step.up|写谱|写谱
step.down|写谱|写谱
alter.up|写谱|写谱
alter.down|写谱|写谱
left|读|读
right|读|读
sel.left|读|读
sel.right|读|读
sel.home|读|读
sel.end|读|读
home|读|读
end|读|读
escape|读|没动
backspace|写谱|写谱
delete|写谱|写谱
play|play|play
impro|impro|impro
file.save|file:save|file:save
file.export|file:export|file:export
file.open|file:open|file:open
clip.copy|clip:copy|clip:copy
clip.cut|clip:cut|clip:cut
clip.paste|clip:paste|clip:paste
clip.all|clip:all|clip:all
undo|undo|undo
redo|redo|redo
lyric.next|lyric:next|lyric:next
lyric.prev|lyric:prev|lyric:prev
lyric.hyphen|lyric:hyphen|lyric:hyphen
lyric.commit|lyric:commit|lyric:commit
mark.commit|mark:commit|mark:commit`.trim();
  const cell = (s: EditorState, where: "write" | "edit", b: (typeof BINDINGS)[number]): string => {
    const a = b.act(0, where);
    if (a.k !== "cmd") return a.k + ("a" in a ? ":" + a.a : "");
    const nx = apply(s, a.cmd, 0);
    return writesScore(s, nx) ? "写谱" : nx === s ? "没动" : "读";
  };
  it("表和现在的键表对得上（加了键 / 改了命令 = 回来对一遍这张表）", () => {
    const now = BINDINGS.map((b) => [b.id, cell(W, "write", b), cell(E, "edit", b)].join("|")).join("\n");
    eq(now, FROZEN);
  });
  it("拔着时：表里「写谱」的每一下都被挡，「读」的每一下都放行", () => {
    const { g } = rig({ unplugged: true });
    for (const b of BINDINGS) for (const [s, where] of [[W, "write"], [E, "edit"]] as const) {
      const a = b.act(0, where); if (a.k !== "cmd") continue;
      const nx = apply(s, a.cmd, 0);
      eq(g.may(s, nx), !writesScore(s, nx), `${b.id} · ${where}`);
    }
  });
  it("「弹」的时候音键和叠在键表里就是只响（audition）", () => {
    for (const idb of ["degree.near", "degree.down", "stack"]) eq(BINDINGS.find((b) => b.id === idb)!.act(0, "impro").k, "audition", idb);
  });
});

describe("键盘总闸：这一下按键归谁（先后顺序就是规矩）", () => {
  const base: KeyFacts = { galleryOpen: false, finderShown: false, finderOpen: false, fileCombo: false, composing: false, escape: false, mod: false, typing: false, ownField: false, formControl: false, instShown: false, inRef: false, studioOpen: false, inStudio: false, escFree: true, listen: false };
  const own = (f: Partial<KeyFacts>): KeyOwner => keyOwner({ ...base, ...f });
  it("什么都没开 = 谱", () => eq(own({}), "score"));
  it("歌库开着：键盘归它；歌库上面的乐器目录 = 只弹着玩", () => {
    eq(own({ galleryOpen: true, typing: true, formControl: true, listen: true }), "gallery");
    eq(own({ galleryOpen: true, finderShown: true }), "galleryFinder");
    eq(own({ galleryOpen: true, fileCombo: true }), "gallery", "歌库开着时 Ctrl+S 不归这首歌");
  });
  it("存 / 另存 / 打开：不管焦点在谁身上（打字的框、乐器页、乐器目录、混音台、听）都是这首歌的事", () => {
    for (const f of [{ typing: true, formControl: true }, { instShown: true }, { finderOpen: true, finderShown: true }, { studioOpen: true, inStudio: true }, { listen: true }, { inRef: true }, { composing: true }] as Partial<KeyFacts>[])
      eq(own({ ...f, fileCombo: true, mod: true }), "file", JSON.stringify(f));
  });
  it("打字的框拿着焦点 = 键归框，不论哪一页、哪个模式（v0.16.14：听模式里改名，空格被拿去放 / 停）", () => {
    for (const f of [{}, { listen: true }, { studioOpen: true, inStudio: true }, { instShown: true }, { finderOpen: true, finderShown: true }] as Partial<KeyFacts>[])
      eq(own({ ...f, typing: true, formControl: true }), "field", JSON.stringify(f));
    eq(own({ typing: true, composing: true }), "ime", "输入法正在拼字先于一切（除了存 / 开）");
    eq(own({ composing: true }), "ime");
  });
  it("打字的框里按 Esc：不归框，归各页自己的「收起」", () => {
    eq(own({ typing: true, formControl: true, escape: true, instShown: true }), "inst");
    eq(own({ typing: true, formControl: true, escape: true, finderOpen: true, finderShown: true }), "finder");
    eq(own({ typing: true, formControl: true, escape: true, studioOpen: true, inStudio: true, escFree: false }), "studio");
    eq(own({ typing: true, formControl: true, escape: true }), "control", "谱上的字框（歌名那一行）里按 Esc：没有页面接 = 不落到谱上");
  });
  it("谱自己的歌词框 / 记号框：走键表（不算「打字的框」），Ctrl 组合也走键表", () => {
    eq(own({ typing: true, ownField: true }), "score");
    eq(own({ typing: true, ownField: true, mod: true }), "score");
  });
  it("别的打字的框里 Ctrl / ⌘ 组合（贴 / 全选 / 撤销）归浏览器（W-36）", () => {
    eq(own({ typing: true, formControl: true, mod: true }), "field");
  });
  it("下拉框 / 滑块拿着焦点：它们自己吃方向键 / 空格；Ctrl 组合照样到谱", () => {
    eq(own({ formControl: true }), "control");
    eq(own({ formControl: true, mod: true }), "score");
  });
  it("乐器目录 / 乐器页 / 参考窗 / 混音台 / 听，按这个先后", () => {
    eq(own({ finderOpen: true, finderShown: true, instShown: true, listen: true }), "finder");
    eq(own({ instShown: true, inRef: true, listen: true, studioOpen: true, inStudio: true }), "inst");
    eq(own({ inRef: true, listen: true, studioOpen: true, inStudio: true }), "ref");
    eq(own({ studioOpen: true, inStudio: true, listen: true }), "studio");
    eq(own({ studioOpen: true, listen: true }), "listen", "混音台开着但焦点不在它里面 = 听的规矩");
    eq(own({ listen: true, formControl: true }), "listen");
  });
  it("混音台开着按 Esc：谱上没别的可退 = 回到写；谱上还有选中 / 框开着 = 先退它们", () => {
    eq(own({ studioOpen: true, escape: true, escFree: true }), "studioEsc");
    eq(own({ studioOpen: true, escape: true, escFree: false, listen: true }), "listen");
    eq(own({ studioOpen: true, inStudio: true, escape: true, escFree: false }), "studio");
  });
});
