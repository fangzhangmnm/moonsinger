// 鼓的着力点按值进乐手（16-4 E，统筹 2026-11-12 夜「v0.17.13 收」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：上场 / 开关「固定原速」那一刻从目录抄（整套鼓 = 目录里这套鼓的每个键、0 也写；固定敲一件 = 那一个键；有音高的没有）；
//   老歌没写 = 读文件的门口补；出声只读乐手身上这一份（改了这份 = 出声跟着变；鼓却没有这一份 = 报缺数、不回头查目录）。
import { describe, it, eq, assert } from "./runner.mjs";
import { emptyExtras, withNewRole, withSf2Candidate, withSfxFixed, activeGm, saveMxl, openBytes, completeRole, type Extras } from "../src/format/project.ts";
import { hitSecByKeyOf, percOf } from "../src/gm/percussion.ts";
import { performerOf } from "../src/performers/index.ts";
import { initState } from "../src/score/song.ts";

const origin = { library: "t", file: "t.sf2", sha256: "0".repeat(64) }, credit = { attribution: [], license: { name: "unknown" } };
const put = (x: Extras, bank: number, program: number, more: Record<string, unknown> = {}) =>
  withSf2Candidate(x, "r1", { name: "x", bank, program, subset: new Uint8Array(4), sha256: "1".repeat(64), embed: false, origin, credit, calibrationDb: 0, ...more } as never, "n");
const inst = (x: Extras) => ((x.lounge.r1 as { candidates: { id: string; instrument: Record<string, any> }[]; active: string }).candidates.find((c) => c.id === (x.lounge.r1 as { active: string }).active)!.instrument);
const hitFn = (x: Extras) => performerOf("soundfont")!.info({ extras: x, role: "r1", presetIndex: () => 0, velCurve: () => null } as never) as { hitSec?: (k: number) => number; missing?: string[] };

describe("鼓的着力点（instrument.hitSecByKey）", () => {
  it("上场那一刻从目录抄：整套鼓 = 每个键（目录 61 个，实测没有的写 0）；固定敲一件 = 那一个键；有音高的没有", () => {
    const base = withNewRole(emptyExtras(), "r1", "n");
    const kit = inst(put(base, 128, 0)).hitSecByKey as Record<string, number>;
    eq(Object.keys(kit).length, 61); eq(kit["84"], 0, "实测没有 = 写 0"); eq(kit["36"], percOf(128, 0, 36)!.hitSec);
    eq(JSON.stringify(inst(put(base, 128, 0, { note: 49 })).hitSecByKey), JSON.stringify({ 49: percOf(128, 0, 49)!.hitSec }), "鼓件 = 那一个键");
    eq(JSON.stringify(inst(put(base, 0, 119, { note: 60, sfx: { key: 60 } })).hitSecByKey), JSON.stringify({ 60: 1.389 }), "反向镲（固定原速）= 那一个键");
    eq(inst(put(base, 0, 0)).hitSecByKey, undefined, "钢琴没有这个键");
  });
  it("开关「固定原速」跟着重抄：关 = 按写的音变调（有音高）= 拿掉；再开 = 那一个键", () => {
    let x = put(withNewRole(emptyExtras(), "r1", "n"), 0, 119, { note: 60, sfx: { key: 60 } });
    x = withSfxFixed(x, "r1", false, "n"); eq(inst(x).hitSecByKey, undefined);
    x = withSfxFixed(x, "r1", true, "n"); eq(JSON.stringify(inst(x).hitSecByKey), JSON.stringify({ 60: 1.389 }));
  });
  it("出声只读乐手身上这一份：改了表 = 提前量跟着变；表里全是 0 = 不挪；鼓没有这张表 = 报缺数（不回头查目录）", () => {
    let x = put(withNewRole(emptyExtras(), "r1", "n"), 128, 0);
    eq(hitFn(x).hitSec!(36), percOf(128, 0, 36)!.hitSec);
    inst(x).hitSecByKey["36"] = 0.5; eq(hitFn(x).hitSec!(36), 0.5, "照表");
    eq(hitFn(x).hitSec!(20), 0, "表里没列的键 = 不提前");
    for (const k of Object.keys(inst(x).hitSecByKey)) inst(x).hitSecByKey[k] = 0;
    eq(hitFn(x).hitSec, undefined, "全是 0 = 不挪");
    delete inst(x).hitSecByKey; eq(hitFn(x).hitSec, undefined); eq((hitFn(x).missing ?? []).join(), "instrument.hitSecByKey");
    x = put(withNewRole(emptyExtras(), "r1", "n"), 0, 0); eq(hitFn(x).missing, undefined, "有音高的不缺");
  });
  it("老歌没写 = 读文件的门口按目录补（缺几个键也补），存的时候写；有音高的不补", () => {
    const x = put(withNewRole(emptyExtras(), "r1", "n"), 128, 0), r = structuredClone(x.lounge.r1) as Record<string, any>;
    const c = r.candidates.find((k: { id: string }) => k.id === r.active); delete c.instrument.hitSecByKey; completeRole(r);
    eq(JSON.stringify(r.candidates.find((k: { id: string }) => k.id === r.active).instrument.hitSecByKey), JSON.stringify(hitSecByKeyOf({ bank: 128, program: 0 })));
    const r2 = structuredClone(x.lounge.r1) as Record<string, any>, c2 = r2.candidates.find((k: { id: string }) => k.id === r2.active);
    c2.instrument.hitSecByKey = { 36: 0.3 }; completeRole(r2);
    const t2 = r2.candidates.find((k: { id: string }) => k.id === r2.active).instrument.hitSecByKey;
    eq(t2["36"], 0.3, "写了的原样留"); eq(Object.keys(t2).length, 61, "缺的补上");
    const song = initState().song, role = song.parts[0]!.role, y = put(withNewRole(emptyExtras(), role, "n") as Extras, 128, 0);
    const moved = { ...y, lounge: { [role]: y.lounge.r1 } } as Extras;
    const back = openBytes("k.mxl", saveMxl({ song, extras: moved, app: "t", date: "2026-11-12T00:00:00.000Z" }));
    eq(Object.keys(activeGm(back.extras, role)!.hitSecByKey ?? {}).length, 61, "存了再读还在");
  });
});
