// 文档的唯一入口（src/app/document.ts）：commit / run / undo / 锁 / 脏，不碰 DOM。created 2026-10-16 by Claude Fable 5.1（doc 这一刀）
import { describe, it, eq, assert } from "./runner.mjs";
import { createDocument, type DocHooks } from "../src/app/document.ts";
import { initState, type EditorState } from "../src/score/song.ts";
import { emptyExtras, withCalibration, withThumbnail, withFinal, withoutFinal, contentFingerprintOf, FINAL_MP3_ENTRY, type FinalRecord } from "../src/format/project.ts";

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
  it("锁（定稿）：谱 / 休息室 / 封面 / 撤销都拒（onRefused 带人话）；光标照常；定稿 / 改稿自己（locus final）放行、不进栈", () => {
    const { D, log } = make();
    write(D);
    const fp = contentFingerprintOf({ song: D.st.song, hum: D.st.song.hum, extras: D.extras, app: "t", date: "t" });
    const rec: FinalRecord = { at: "t", rev: 1, app: "t", core: { version: "0", hash: "0" }, fingerprint: fp, mp3: { path: FINAL_MP3_ENTRY, bytes: 1, sha256: "0", secs: 1, sr: 44100, kbps: 128, stereo: true }, parts: [] };
    const past = D.history.past.length;
    assert(D.commit({ extras: withFinal(D.extras, rec, new Uint8Array([1])) }, { locus: { kind: "final", label: "定稿" }, undo: false }).ok);
    eq(D.history.past.length, past, "定稿不进栈"); assert(D.final && D.locked());
    const r1 = write(D, 2); assert(!r1.ok); eq(log.at(-1), "refused:谱 / 歌名 / 作者栏");
    const r2 = D.commit({ extras: withCalibration(D.extras, "r1", 1, "n") }, { locus: { kind: "studio", label: "" } }); assert(!r2.ok); eq(log.at(-1), "refused:混音");
    const r3 = D.commit({ extras: withThumbnail(D.extras, new Uint8Array([2])) }, { locus: { kind: "cover", label: "" } }); assert(!r3.ok); eq(log.at(-1), "refused:封面");
    assert(!D.undo()); eq(log.at(-1), "refused:撤销");
    assert(D.run({ k: "caret", d: -1 }).ok, "光标照常");
    assert(D.commit({ extras: withoutFinal(D.extras) }, { locus: { kind: "final", label: "改稿" }, undo: false }).ok);
    eq(D.locked(), null); assert(write(D, 2).ok, "改稿后能写了");
  });
  it("load：换歌 = 栈清空、基线 = 现在、不叫 hooks", () => {
    const { D, log } = make();
    write(D); const n = log.length;
    D.load(initState(), emptyExtras());
    eq(D.history.past.length, 0); eq(D.dirty(), false); eq(log.length, n);
  });
});
