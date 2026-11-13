// 文档的唯一入口（src/app/document.ts）：commit / run / undo / 锁 / 脏，不碰 DOM。created 2026-10-16 by Claude Fable 5.1（doc 这一刀）
import { describe, it, eq, assert } from "./runner.mjs";
import { createDocument, type DocHooks } from "../src/app/document.ts";
import { initState, type EditorState } from "../src/score/song.ts";
import { emptyExtras, withCalibration, withThumbnail } from "../src/format/project.ts";

function make(o: { normalize?: boolean; refs?: () => number } = {}) {
  const log: string[] = [];
  let t = 1000;
  const hooks: DocHooks = {
    now: () => t,
    onState: (p, n, moved) => log.push(`state${moved ? "+moved" : ""}:${n.song !== p.song ? "song" : "cursor"}`),
    onExtras: (_p, _n, l) => log.push(`extras:${l.kind}`),
    onRefused: (w) => log.push(`refused:${w}`),
    onRestored: (r, verb) => log.push(`${verb}:${r.locus.kind}`),
    ...(o.normalize ? { normalize: (s: EditorState) => ({ ...s, log: [] }) } : {}),
    ...(o.refs ? { extraDirty: o.refs } : {}),
  };
  const st0 = initState(), ex0 = emptyExtras();
  const D = createDocument({ st: st0, extras: ex0 }, hooks);
  return { D, log, st0, ex0, tick: (ms: number) => { t += ms; } };
}
const write = (D: ReturnType<typeof make>["D"], degree = 1) => D.run({ k: "degree", degree, dir: "near" });

describe("文档的唯一入口", () => {
  it("run（指令）→ commit：谱变了 = 进撤销栈 + onState；只挪光标 = 不进栈；没变 = changed:false", () => {
    const { D, log } = make();
    const r = write(D); assert(r.ok && r.changed, JSON.stringify(r));
    eq(D.history.past.length, 1); eq(log.join(","), "state:song");
    const c = D.run({ k: "caret", d: -1 }); assert(c.ok);
    eq(D.history.past.length, 1, "光标不进栈"); eq(log.at(-1), "state:cursor");
    eq(JSON.stringify(D.commit({ st: D.st })), JSON.stringify({ ok: true, changed: false }));
  });
  it("extras 走同一个入口：进栈、onExtras 带 locus；两个一起 = 一步", () => {
    const { D, log } = make();
    D.commit({ extras: withCalibration(D.extras, "r1", -3, "n") }, { locus: { kind: "lounge", label: "响度" } });
    eq(D.history.past.length, 1); eq(log.at(-1), "extras:lounge");
    write(D); eq(D.history.past.length, 2);
    const both = D.commit({ st: { ...D.st, song: { ...D.st.song, title: "x" } }, extras: withCalibration(D.extras, "r1", 2, "n") }, { locus: { kind: "lounge", label: "both" } });
    assert(both.ok); eq(D.history.past.length, 3, "两个一起 = 一步");
  });
  it("连续动作（gesture）1.5 s 内并成一步；撤销 / 重做回到那一步之前；undo = onRestored 不叫 onState", () => {
    const { D, log, tick } = make();
    write(D, 1); tick(300); D.run({ k: "step", d: 1 }, { gesture: "drag" }); tick(300); D.run({ k: "step", d: 1 }, { gesture: "drag" });
    eq(D.history.past.length, 2, "写一个 + 一次拖（两下并成一步）");
    const before = D.st;
    assert(D.undo()); eq(log.at(-1), "撤销:score"); eq(D.history.future.length, 1);
    assert(D.redo()); eq(D.st.song, before.song, "重做回来是同一份 song（引用）");
    assert(!D.redo(), "没有可重做的");
  });
  it("规整（normalize）在 commit 里：撤销提示按你做的那一下说", () => {
    const { D } = make({ normalize: true });
    write(D); eq(D.st.log.length, 0, "normalize 清掉了 log"); eq(D.history.past[0].locus.label, "写了 1 个");
  });
  it("脏：改谱 / 换封面 / 改休息室 = 脏；markSaved / adoptSaved 清；参考窗的 rev 也算", () => {
    let refs = 0;
    const { D } = make({ refs: () => refs });
    eq(D.dirty(), false);
    write(D); eq(D.dirty(), true); D.markSaved(); eq(D.dirty(), false);
    D.commit({ extras: withThumbnail(D.extras, new Uint8Array([1])) }, { locus: { kind: "cover", label: "" } }); eq(D.dirty(), true);
    const m = D.savedMark(); D.commit({ extras: withCalibration(D.extras, "r1", 1, "n") }, { locus: { kind: "lounge", label: "" } });
    D.adoptSaved(m); eq(D.dirty(), true, "adopt 的是 encode 那一刻的基线，之后又改了 = 还脏");
    D.markSaved(); eq(D.dirty(), false); refs = 1; eq(D.dirty(), true, "参考窗加了卡");
  });
  it("锁不在文档里：宿主没注入 writeGate / lockedWhy = 什么都放、locked() = null（注入之后的拦法在 test/edit-lock.test.ts）", () => {
    const { D } = make();
    eq(D.locked(), null); assert(write(D).ok && D.undo() && D.redo());
    eq(D.dirtyKind(), "content");
  });
  it("load：换歌 = 栈清空、基线 = 现在、不叫 hooks", () => {
    const { D, log } = make();
    write(D); const n = log.length;
    D.load(initState(), emptyExtras());
    eq(D.history.past.length, 0); eq(D.dirty(), false); eq(log.length, n);
  });
});

// ── 第 21 条补（v0.17.38，统筹 28858491）：「一笔没动」= 装入之后没有过任何一次真改了歌 / extras 的提交（宿主 main.ts untouchedNewSong 只问它 + 新建出来的 + 有没有家）──
describe("文档 · 一笔没动（touched）", () => {
  it("出生 / 装入 = 没动过；只挪光标不算；写一个音、改一项看法、改歌名、改 extras、撤销都算；再装入 = 回到没动过", () => {
    const { D, st0, ex0 } = make();
    eq(D.touched(), false, "出生");
    D.commit({ st: { ...D.st, caret: 0 } }); eq(D.touched(), false, "只挪光标");
    write(D); eq(D.touched(), true, "写一个音");
    D.load(st0, ex0); eq(D.touched(), false, "装入 = 回到没动过");
    D.commit({ st: { ...D.st, song: { ...D.st.song, notation: "jianpu" } } }, { locus: { kind: "songLook", label: "谱种" } }); eq(D.touched(), true, "页面设置换一项（看法）也算");
    D.load(st0, ex0); D.commit({ st: { ...D.st, song: { ...D.st.song, title: "歌名" } } }); eq(D.touched(), true, "改歌名");
    D.load(st0, ex0); D.commit({ extras: withCalibration(D.extras, "r1", -3, "n") }); eq(D.touched(), true, "改 extras（混音台、乐手…）");
    D.load(st0, ex0); write(D); D.load(D.st, D.extras); eq(D.touched(), false); D.commit({ st: D.st }); eq(D.touched(), false, "没变的提交不算");
    D.load(st0, ex0); write(D); const D2 = D; D2.load(D.st, D.extras); eq(D2.touched(), false); write(D2); D2.undo(); eq(D2.touched(), true, "撤销也算");
  });
  // v0.17.39（统筹审 v0.17.38）：没有家的不只是新歌——iPad 上选的文件、别家的谱、有读不进来的东西的，打开了也没有家。改习惯只许重建「新建那条路建出来的」
  it("走新建那条路建出来的（newSong）：出生 = 是；装入没点名 = 不是（打开文件、歌库、换回…都是）；点名 new = 是；动没动不影响它", () => {
    const { D, st0, ex0 } = make();
    eq(D.newSong(), true, "出生（开 app 那一首）");
    D.load(st0, ex0); eq(D.newSong(), false, "装入没点名 = 打开的");
    D.load(st0, ex0, "new"); eq(D.newSong(), true, "新建那条路点名");
    write(D); eq(D.newSong(), true, "动过了还是新建出来的（动没动归 touched）");
    D.load(st0, ex0); eq(D.newSong(), false, "再装入别的 = 清掉");
  });
});
