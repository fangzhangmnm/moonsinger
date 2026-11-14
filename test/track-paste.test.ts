// 混音台拷 / 粘一条轨的设置（src/format/project.ts copyTrackSettings / pasteTrackSettings；v0.17.54）。created 2026-11-14 by Claude Opus 5.5（MoonSinger小弟）
//   守（统筹 2026-11-14 七条 + 跨歌 / 编号核对）：同一类才粘；整份换掉、名字 / 种类不动；会接成环的出到 / 发送不粘、出到退回总轨；被谁压指的就是它自己 = 那一格去掉被谁压；
//   指着的混音轨不在了 / 名字对不上（编号被别的轨拿走）= 不粘；别的歌里拷的 = 连线一条都不粘、增益声像效果旁通照粘；名单对得上；走真的写入口一步撤销回去。
import { describe, it, eq as eqStrict, assert } from "./runner.mjs";
const eq = (a: unknown, b: unknown) => eqStrict(JSON.stringify(a), JSON.stringify(b));   // 按值比（runner 的 eq 是 ===）
import { initState } from "../src/score/song.ts";
import { emptyExtras, withTrack, withoutBus, studioTrack, newBusId, copyTrackSettings, pasteTrackSettings, type Extras, type TrackClip } from "../src/format/project.ts";
import { createDocument } from "../src/app/document.ts";

const comp = (key?: string) => ({ id: "comp1", kind: "comp", on: true, params: { thresholdDb: -20, ratio: 3 }, ...(key ? { key } : {}) });
const eqFx = { id: "eq", kind: "eq", on: false, params: { lowDb: 2 } };
/** 三位歌手（p1 → 麦克风 m1、p2 → m2、p3 → m3）+ 两条混音轨 b1「混响」、b2「回声」。名字表 = 界面上显示的名字。 */
function setup(): { x: Extras; names: Map<string, string> } {
  let x = emptyExtras();
  x = withTrack(x, "m1", { gainDb: -3, pan: -0.5, chain: [eqFx as never, comp("p2") as never], sends: [{ to: "b1", gainDb: -9 }], to: "b2", bypass: false });
  x = withTrack(x, "m2", {});
  x = withTrack(x, "m3", {});
  x = withTrack(x, "b1", { kind: "bus", name: "混响" });
  x = withTrack(x, "b2", { kind: "bus", name: "回声" });
  const names = new Map([["p1", "Piano"], ["p2", "Vo."], ["p3", "Vln."], ["b1", "混响"], ["b2", "回声"]]);
  return { x, names };
}
const nameOf = (names: Map<string, string>) => (id: string) => names.get(id) ?? null;
const ctx = (names: Map<string, string>, self: string | null, foreign = false) => ({ foreign, nameOf: nameOf(names), singers: ["p1", "p2", "p3"], self });

describe("混音台拷 / 粘一条轨的设置", () => {
  it("歌手轨 → 歌手轨：增益 / 声像 / 链（连开关）/ 发送 / 出到 / 旁通整份换掉；名字、种类不动；名单写目标现在的名字", () => {
    const { x, names } = setup();
    const clip = copyTrackSettings(x, "m1", nameOf(names))!; assert(clip);
    eq(clip.names, { b2: "回声", b1: "混响", p2: "Vo." });
    const r = pasteTrackSettings(x, "m3", clip, ctx(names, "p3")); assert(r.ok);
    if (!r.ok) return;
    const t = studioTrack(r.extras, "m3")!;
    eq([t.kind, t.gainDb, t.pan, t.to, t.bypass], ["mic", -3, -0.5, "b2", false]);
    eq(t.chain.map((f) => [f.id, f.on, f.key ?? null]), [["eq", false, null], ["comp1", true, "p2"]]);
    eq(t.sends, [{ to: "b1", gainDb: -9 }]);
    eq(studioTrack(r.extras, "m3")!.name, studioTrack(x, "m3")!.name);
    eq(r.report, { fx: 2, sends: [{ id: "b1", name: "混响" }], to: { id: "b2", name: "回声" }, dropped: [] });
  });
  it("只在同一类之间：歌手轨的设置粘不到混音轨上、混音轨的粘不到歌手轨上", () => {
    const { x, names } = setup();
    const mic = copyTrackSettings(x, "m1", nameOf(names))!, bus = copyTrackSettings(x, "b1", nameOf(names))!;
    eq(pasteTrackSettings(x, "b2", mic, ctx(names, null)), { ok: false, why: "kind" });
    eq(pasteTrackSettings(x, "m2", bus, ctx(names, "p2")), { ok: false, why: "kind" });
    eq(pasteTrackSettings(x, "nope", mic, ctx(names, null)), { ok: false, why: "missing" });
  });
  it("被谁压指的正是目标自己 = 那一格去掉被谁压（这一格照粘），名单里有这一条", () => {
    const { x, names } = setup();
    const r = pasteTrackSettings(x, "m2", copyTrackSettings(x, "m1", nameOf(names))!, ctx(names, "p2")); assert(r.ok);
    if (!r.ok) return;
    const c = studioTrack(r.extras, "m2")!.chain.find((f) => f.id === "comp1")!;
    eq(c.key, undefined); eq(c.params.ratio, 3);
    eq(r.report.dropped, [{ what: "key", id: "p2", name: "Vo.", why: "self" }]);
    eq(r.report.fx, 2);
  });
  it("会接成环的出到 / 发送不粘：出到退回总轨、那条发送去掉；指的就是它自己也不粘", () => {
    let { x, names } = setup();
    x = withTrack(x, "b1", { to: "b2" });                                  // 混响 → 回声
    x = withTrack(x, "b3" as string, { kind: "bus", name: "合唱", to: "b1", sends: [{ to: "b2", gainDb: -6 }] });   // 合唱 → 混响，发给回声
    names = new Map([...names, ["b3", "合唱"]]);
    const clip = copyTrackSettings(x, "b3", nameOf(names))!;
    const r = pasteTrackSettings(x, "b2", clip, ctx(names, null)); assert(r.ok);   // 粘到回声：出到混响（混响 → 回声 = 环）、发给回声（自己）
    if (!r.ok) return;
    const t = studioTrack(r.extras, "b2")!;
    eq([t.to, t.sends.length, t.name], ["master", 0, "回声"]);
    eq(r.report.to, null);
    eq(r.report.dropped, [{ what: "to", id: "b1", name: "混响", why: "cycle" }, { what: "send", id: "b2", name: "回声", why: "self" }]);
  });
  it("别的歌里（或重新打开之后）拷的：增益、声像、效果、旁通照粘；出到、发送、被谁压一条都不粘，名单写「别的歌里的」", () => {
    const { x, names } = setup();
    const clip = copyTrackSettings(x, "m1", nameOf(names))!;
    const r = pasteTrackSettings(x, "m3", clip, ctx(names, "p3", true)); assert(r.ok);
    if (!r.ok) return;
    const t = studioTrack(r.extras, "m3")!;
    eq([t.gainDb, t.pan, t.to, t.sends.length, t.chain.length, t.chain[1]!.key], [-3, -0.5, "master", 0, 2, undefined]);
    eq(r.report.dropped.map((d) => `${d.what}:${d.id}:${d.why}`), ["to:b2:foreign", "send:b1:foreign", "key:p2:foreign"]);
    eq(r.report.sends, []); eq(r.report.to, null);
  });
  it("同一次打开里目标变了：混音轨改了名 = 不粘（changed）；删了再加拿回同一个编号、名字不一样 = 不粘；删了没再加 = 不在了（missing）", () => {
    const { x, names } = setup();
    const clip: TrackClip = copyTrackSettings(x, "m1", nameOf(names))!;
    // 回声改名
    const renamed = new Map(names); renamed.set("b2", "长回声");
    const r1 = pasteTrackSettings(withTrack(x, "b2", { name: "长回声" }), "m3", clip, ctx(renamed, "p3")); assert(r1.ok);
    if (r1.ok) { eq(studioTrack(r1.extras, "m3")!.to, "master"); eq(r1.report.dropped.map((d) => `${d.what}:${d.id}:${d.why}`), ["to:b2:changed"]); }
    // 删掉回声（最大号）再加一条：编号 = 现有最大号 + 1 = 又是 b2
    let y = withoutBus(x, "b2"); const again = newBusId(y); eq(again, "b2");
    y = withTrack(y, again, { kind: "bus", name: "镶边" });
    const swapped = new Map(names); swapped.set("b2", "镶边");
    const r2 = pasteTrackSettings(y, "m3", clip, ctx(swapped, "p3")); assert(r2.ok);
    if (r2.ok) eq(r2.report.dropped.map((d) => `${d.what}:${d.id}:${d.why}`), ["to:b2:changed"]);
    // 混响删掉、没再加
    const gone = new Map(names); gone.delete("b1");
    const r3 = pasteTrackSettings(withoutBus(x, "b1"), "m3", clip, ctx(gone, "p3")); assert(r3.ok);
    if (r3.ok) { eq(studioTrack(r3.extras, "m3")!.sends.length, 0); eq(r3.report.dropped.map((d) => `${d.what}:${d.id}:${d.why}`), ["send:b1:missing"]); }
    // 被谁压的那位歌手改了名
    const sung = new Map(names); sung.set("p2", "Soprano");
    const r4 = pasteTrackSettings(x, "m3", clip, ctx(sung, "p3")); assert(r4.ok);
    if (r4.ok) eq(r4.report.dropped.map((d) => `${d.what}:${d.id}:${d.why}`), ["key:p2:changed"]);
  });
  it("粘 = 走写入口一步；撤销一步回到粘之前", () => {
    const { x, names } = setup();
    const D = createDocument({ st: initState(), extras: x }, { now: () => 0, onState: () => {}, onExtras: () => {}, onRefused: () => {}, onRestored: () => {} });
    const r = pasteTrackSettings(D.extras, "m2", copyTrackSettings(D.extras, "m1", nameOf(names))!, ctx(names, "p2")); assert(r.ok);
    if (!r.ok) return;
    D.commit({ extras: r.extras }, { locus: { kind: "studio", label: "粘轨设置" } });
    eq(studioTrack(D.extras, "m2")!.gainDb, -3); eq(D.history.past.length, 1);
    D.undo();
    eq(studioTrack(D.extras, "m2"), studioTrack(x, "m2"));
  });
});
