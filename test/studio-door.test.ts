// 录音房这一块的门口 + 缺数在送进录音房之前查（16-4 A2 / C，统筹 2026-11-12 夜「v0.17.16 收」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：老文件缺的（轨的旁通、效果的开关和参数、总轨和限幅器四个数、声部没有混音轨）按模板补，不说话、不算改过；不认识的效果种类原样；比这一版新的不补；
//   新建的歌 / 新加的声部按模板建好混音轨；缺数 = 用到它的声部明着不出声（自己的轨、一路经过的混音轨、总轨），没用到的照样出声；缺数的不交给录音房。
import { describe, it, eq, assert } from "./runner.mjs";
import { saveMxl, openBytes, templateExtras, withTrack, newBusId, studioTrack, activeMaster, type Extras } from "../src/format/project.ts";
import { performerInfoOf, mixParamsOf, mixProblemsFor } from "../src/core/render.ts";
import { createDocument } from "../src/app/document.ts";
import { TEMPLATE } from "../src/format/template.ts";
import { initState, addPart } from "../src/score/song.ts";
import { strToU8, strFromU8, unzipSync, zipSync } from "../vendor/fflate/fflate.esm.js";
import { fx } from "./fixtures/fx.ts";

const banks = { presetIndex: () => null, velCurve: () => null } as never;
/** 两个声部的歌（第二个声部按 app 加声部那一路建：templateExtras 之后 withTrack 它的麦克风）。 */
function twoParts(): { song: ReturnType<typeof initState>["song"]; x: Extras } {
  let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" });
  return { song: st.song, x: templateExtras(st.song) };
}
const save = (song: unknown, x: Extras) => saveMxl({ song: song as never, extras: x, app: "t", date: "2026-11-12T00:00:00.000Z" });
const K = ".moonsinger/studio.json";

describe("录音房的门口", () => {
  it("新建 = 每个声部一条混音轨 + 总轨，都按模板（推子 0、声像中、没有效果、出到总轨、不旁通；限幅开、四个数）", () => {
    const { song, x } = twoParts();
    for (const p of song.parts) { const t = studioTrack(x, p.mic)!; eq(JSON.stringify([t.gainDb, t.pan, t.chain, t.sends, t.to, t.bypass]), JSON.stringify([0, 0, [], [], "master", false]), p.id); }
    eq(JSON.stringify(activeMaster(x).limiterParams), JSON.stringify(TEMPLATE.studio.master.limiterParams));
  });
  it("老文件缺的按模板补：轨的旁通、效果的开关 / 参数（按在不在混音轨上取那一份）、总轨、四个数、声部没有混音轨的建一条；不认识的效果原样；不说话、不算改过", () => {
    const { song, x: x0 } = twoParts(), bus = newBusId(x0);
    let x = withTrack(x0, bus, { kind: "bus", name: "空间", chain: [fx("r", "reverb")] });
    x = withTrack(x, "m1", { chain: [fx("c", "comp"), { id: "w", kind: "wah", params: { q: 3 } } as never], sends: [{ to: bus, gainDb: -6 }] });
    const z = unzipSync(save(song, x)), j = JSON.parse(strFromU8(z[K]!));
    for (const t of j.tracks) delete t.bypass;
    const m1 = j.tracks.find((t: { id: string }) => t.id === "m1"); delete m1.chain[0].on; delete m1.chain[0].params.kneeDb; delete m1.sends[0].gainDb;
    const b = j.tracks.find((t: { id: string }) => t.id === bus); b.chain[0].params = {};
    j.tracks = j.tracks.filter((t: { id: string }) => t.id !== "m2");
    delete j.master.limiterParams; delete j.master.limiter;
    z[K] = strToU8(JSON.stringify(j));
    const o = openBytes("old.mxl", zipSync(z)), s = o.extras.studio as { tracks: Record<string, any>[]; master: Record<string, any> };
    eq(s.tracks.map((t) => t.bypass).join(), "false,false,false", "旁通没写 = 不旁通");
    const c = s.tracks.find((t) => t.id === "m1")!;
    eq(c.chain[0].on, true, "开关没写 = 开"); eq(c.chain[0].params.kneeDb, TEMPLATE.studio.fx.comp!.kneeDb, "缺的参数 = 模板");
    eq(JSON.stringify(c.chain[1]), JSON.stringify({ id: "w", kind: "wah", params: { q: 3 } }), "不认识的种类原样");
    eq(c.sends[0].gainDb, TEMPLATE.studio.sendGainDb, "发送没写量 = 模板");
    eq(JSON.stringify(s.tracks.find((t) => t.id === bus)!.chain[0].params), JSON.stringify(TEMPLATE.studio.fxOnBus.reverb), "混音轨上的混响 = 混音轨那一份（全湿）");
    const m2 = s.tracks.find((t) => t.id === "m2")!; eq(JSON.stringify([m2.kind, m2.gainDb, m2.pan, m2.to, m2.bypass]), JSON.stringify(["mic", 0, 0, "master", false]), "没有混音轨的声部：建一条");
    eq(s.master.limiter, true); eq(JSON.stringify(s.master.limiterParams), JSON.stringify(TEMPLATE.studio.master.limiterParams));
    eq(o.notices.join(" / "), "", "不说话");
    const D = createDocument({ st: initState(o.song), extras: o.extras }, { now: () => 0, onState() {}, onExtras() {}, onRefused() {}, onRestored() {} });
    eq(D.dirty(), false, "不算改过");
    for (const p of o.song.parts) eq(performerInfoOf(o.extras, p, banks).mixMissing, undefined, `${p.id} 补完不缺数`);
  });
  it("比这一版新的录音房不补（原样带着）", () => {
    const { song, x } = twoParts(), z = unzipSync(save(song, x)), j = JSON.parse(strFromU8(z[K]!));
    j.minor = 999; delete j.master.limiterParams; z[K] = strToU8(JSON.stringify(j));
    const o = openBytes("new.mxl", zipSync(z));
    assert(!("limiterParams" in (o.extras.studio as { master: object }).master), "没补");
  });
});
describe("录音房缺数：在送进录音房之前查，用到它的声部明着不出声", () => {
  it("自己的轨缺 = 只有它不出声；经过的混音轨缺 = 发 / 出到那条的声部不出声；总轨缺 = 都不出声；缺数的不交给录音房", () => {
    const { song, x: x0 } = twoParts(), bus = newBusId(x0), [p1, p2] = song.parts as [typeof song.parts[0], typeof song.parts[0]];
    let x = withTrack(x0, bus, { kind: "bus", name: "空间", chain: [fx("r", "reverb")] });
    x = withTrack(x, "m1", { sends: [{ to: bus, gainDb: -6 }] });
    const miss = (e: Extras, p: typeof p1) => performerInfoOf(e, p, banks).mixMissing ?? [];
    eq(miss(x, p1).length + miss(x, p2).length, 0, "写全 = 不缺");
    const own = structuredClone(x); (own.studio as any).tracks.find((t: { id: string }) => t.id === "m2").pan = null;
    assert(miss(own, p2).join().includes("pan") && !miss(own, p1).length, `自己的轨：${miss(own, p2)}`);
    eq(mixParamsOf({ song, extras: own, parts: song.parts }, () => ({ muted: false, solo: false })).channels.map((c) => c.id).join(), "P1", "缺数的轨不送");
    const viaBus = structuredClone(x); delete (viaBus.studio as any).tracks.find((t: { id: string }) => t.id === bus).chain[0].params.room;
    assert(miss(viaBus, p1).join().includes("room") && !miss(viaBus, p2).length, `经过的混音轨：${miss(viaBus, p1)}`);
    const master = structuredClone(x); delete (master.studio as any).master.limiterParams;
    assert(miss(master, p1).join().includes("limiterParams") && miss(master, p2).join().includes("limiterParams"), "总轨缺 = 都报");
    eq(mixParamsOf({ song, extras: master, parts: song.parts }, () => ({ muted: false, solo: false })).master, null, "总轨缺数 = 不推总轨");
    eq(mixProblemsFor(x, { id: "P9", role: "r9", mic: "m9" } as never).join(), "这个声部的轨（没有）");
  });
});
