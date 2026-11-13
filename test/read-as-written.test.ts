// 读 = 文件上怎么写就怎么读（施工单第 16 条 16-2，2026-11-12）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
// 守：乐手读不到 ≠ 小月相（没人上场、存的时候不替它造一位）；新歌在创建那一刻按模板写了乐手；别家的谱没写速度 / 调号 / 拍号 = 打开时照实说一句；
//   混音轨之间的「出到 / 发送」接没接上只有一个判法（录音房和混音台共用）；升级链整个没了、开歌时不补力度不理顺。
import { describe, it, eq, assert } from "./runner.mjs";
import { openBytes, saveMxl, emptyExtras, templateExtras, activeInstrument, activeId, candidates, type Extras } from "../src/format/project.ts";
import { busLinkStates } from "../src/engine/studio.ts";
import { initState } from "../src/score/song.ts";
import { strToU8, strFromU8, unzipSync, zipSync } from "../vendor/fflate/fflate.esm.js";
import { createDocument } from "../src/app/document.ts";
import { activePerfSpec, activeSingCore } from "../src/format/project.ts";
import { TEMPLATE } from "../src/format/template.ts";
const fs = (await import("node:fs" as string)) as { existsSync(u: URL): boolean; readFileSync(u: URL, e: "utf8"): string; readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };
const ROOT = new URL("../", import.meta.url);

describe("乐手读不到 ≠ 小月相", () => {
  it("歌里没有这个声部的乐手 = 没人上场（不是小月相）；存的时候不替它造一位", () => {
    const song = initState().song, role = song.parts[0]!.role;
    eq(activeInstrument(emptyExtras(), role), null); eq(activeId(emptyExtras(), role), ""); eq(candidates(emptyExtras(), role).length, 0);
    const files = unzipSync(saveMxl({ song, extras: emptyExtras(), app: "t", date: "2026-11-12T00:00:00.000Z" }));
    assert(!Object.keys(files).some((p) => p.startsWith(".moonsinger/lounge/")), "没有乐手的声部存的时候不写休息室");
    eq(activeInstrument(openBytes("x.mxl", saveMxl({ song, extras: emptyExtras(), app: "t", date: "2026-11-12T00:00:00.000Z" })).extras, role), null, "读回来还是没人上场");
  });
  it("新歌按模板把乐手写进去：每个声部都有、上场的是小月相；存了再开一样", () => {
    const song = initState().song, x: Extras = templateExtras(song), role = song.parts[0]!.role;
    eq(activeInstrument(x, role)?.engine, "tsukuyomi");
    eq(activeInstrument(openBytes("x.mxl", saveMxl({ song, extras: x, app: "t", date: "2026-11-12T00:00:00.000Z" })).extras, role)?.engine, "tsukuyomi");
  });
});

describe("别家的谱：没写的谱头照实说", () => {
  const xml = (attrs: string, dir = "") => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Flute</part-name></score-part></part-list>` +
    `<part id="P1"><measure number="1"><attributes><divisions>1</divisions>${attrs}</attributes>${dir}<note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`;
  it("没写速度 / 调号 / 拍号 = 打开时那一串话里各一句；都写了 = 不说", () => {
    const o = openBytes("a.musicxml", strToU8(xml("")));
    assert(o.notices.some((n) => /没写速度/.test(n) && /没写调号/.test(n) && /没写拍号/.test(n)), JSON.stringify(o.notices));
    const full = openBytes("b.musicxml", strToU8(xml("<key><fifths>1</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time>", `<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>100</per-minute></metronome></direction-type><sound tempo="100"/></direction>`)));
    assert(!full.notices.some((n) => /没写(速度|调号|拍号)/.test(n)), JSON.stringify(full.notices));
  });
});

describe("混音轨之间接没接上：一个判法（录音房和混音台共用）", () => {
  it("去处不是一条混音轨 = missing；接上会成环的那一条 = cycle（按顺序，先接上的留着）；出到总轨不算连线", () => {
    const has = (id: string) => ["b1", "b2"].includes(id);
    const st = busLinkStates([{ id: "b1", to: "b2", sends: [{ to: "b9" }] }, { id: "b2", to: "master", sends: [{ to: "b1" }] }], has);
    eq(st.get("b1")!.to, "ok"); eq(st.get("b1")!.sends[0], "missing");
    eq(st.get("b2")!.to, null); eq(st.get("b2")!.sends[0], "cycle", "b2 → b1 会接成环（b1 已经出到 b2）");
    eq(busLinkStates([{ id: "b1", to: "b1" }], has).get("b1")!.to, "cycle", "出到自己 = 环");
  });
});

describe("结构：没有升级链；开歌时不补不理顺", () => {
  it("src/format/migrate/ 不存在；src 里没有 migrate( / loungeRoleNames / legacyLooks", () => {
    assert(!fs.existsSync(new URL("src/format/migrate/", ROOT)), "升级链文件夹还在");
    const walk = (u: URL): string[] => fs.readdirSync(u, { withFileTypes: true }).flatMap((e) => { const v = new URL(e.name + (e.isDirectory() ? "/" : ""), u); return e.isDirectory() ? walk(v) : /\.ts$/.test(e.name) ? [v.href] : []; });
    const bad = walk(new URL("src/", ROOT)).filter((f) => { const c = fs.readFileSync(new URL(f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); return /\bmigrate\s*\(|\bloungeRoleNames\b|\blegacyLooks\b/.test(c); });
    eq(bad.map((f) => f.slice(ROOT.href.length)).join(", "), "");
  });
  it("开歌（main.ts loadDocInner）不补力度、不理顺先后：只有人改谱时补（document 的 normalize）", () => {
    const src = fs.readFileSync(new URL("src/app/main.ts", ROOT), "utf8"), i = src.indexOf("function loadDocInner("), body = src.slice(i, src.indexOf("\n}\n", i));
    const code = body.replace(/\/\/.*$/gm, "");
    assert(i > 0 && !/withStartDyns/.test(code) && /D\.load\(st0,/.test(code), "loadDocInner 里又补力度了（只许数：ensureStartDyns(...).added.length）");
  });
});

describe("门口：老歌缺的数按模板补，补完才立基线（16-4 A，统筹 2026-11-12 夜第 1 条）", () => {
  /** 一首「老歌」：新歌存出去，再把乐手身上的几样数拿掉（滚奏密度、几个演奏法、力度表的一档、唱法核心的旋钮）。 */
  const oldSong = (): Uint8Array => {
    const song = initState().song, role = song.parts[0]!.role;
    const z = unzipSync(saveMxl({ song, extras: templateExtras(song), app: "t", date: "2026-11-12T00:00:00.000Z" })), k = `.moonsinger/lounge/${role}.json`;
    const j = JSON.parse(strFromU8(z[k]!));
    for (const c of j.candidates) { delete c.articulation.rollHz; delete c.articulation.gapShare; delete c.articulation.swellDb; if (c.dynamicsDb) delete c.dynamicsDb.ppp; c.defaults = {}; }
    z[k] = strToU8(JSON.stringify(j));
    return zipSync(z);
  };
  it("读进来就是写全的：缺的按模板补成数；不说话（没有提示）", () => {
    const o = openBytes("old.mxl", oldSong()), role = o.song.parts[0]!.role, sp = activePerfSpec(o.extras, role)! as Record<string, any>;
    eq(sp.rollHz, TEMPLATE.lounge.rollHz.pitched); eq(sp.gapShare, TEMPLATE.lounge.articulation.gain.gapShare); eq(sp.swellDb, TEMPLATE.lounge.articulation.gain.swellDb);
    eq(sp.dynamicsDb.ppp, TEMPLATE.lounge.dynamicsDb.ppp);
    eq(activeSingCore(o.extras, role).level, TEMPLATE.lounge.tsukuyomiDefaults.level);
    eq(o.notices.join(" / "), "", "补数不说话");
  });
  it("补完才是「打开时的样子」：不算改过（不自动存）、撤销栈是空的", () => {
    const o = openBytes("old.mxl", oldSong());
    const D = createDocument({ st: initState(o.song), extras: o.extras }, { now: () => 0, onState() {}, onExtras() {}, onRefused() {}, onRestored() {} });
    eq(D.dirty(), false, "门口补的数不算改过"); eq(D.history.past.length, 0, "不进撤销");
    D.load(initState(o.song), o.extras); eq(D.dirty(), false, "换歌那条路（load）一样");
  });
  it("比这一版新的休息室不补（原样带着）", () => {
    const song = initState().song, role = song.parts[0]!.role;
    const z = unzipSync(saveMxl({ song, extras: templateExtras(song), app: "t", date: "2026-11-12T00:00:00.000Z" })), k = `.moonsinger/lounge/${role}.json`;
    const j = JSON.parse(strFromU8(z[k]!)); j.minor = 999; delete j.candidates[0].articulation.rollHz;
    z[k] = strToU8(JSON.stringify(j));
    const o = openBytes("new.mxl", zipSync(z));
    const c = (o.extras.lounge[role] as { candidates: { articulation: Record<string, unknown> }[] }).candidates[0]!;
    assert(!("rollHz" in c.articulation), "没补");
  });
});
describe("老文件（lounge 3，上一版代码写的冻结样本）进门：缺的按模板 / 目录补，不说话、不算改过；存的时候写", () => {
  const bytes = new Uint8Array((fs as unknown as { readFileSync(u: URL): Uint8Array }).readFileSync(new URL("fixtures/format/minor/lounge-3/sample.mxl", import.meta.url)));
  it("小月相补 outputGainDb、滚奏密度 null → 14 / 鼓 12、整套鼓和固定敲一件补着力点表、钢琴不补；没有提示；不算改过", () => {
    const o = openBytes("lounge-3.mxl", bytes), insts = (role: string) => (o.extras.lounge[role] as { candidates: { instrument: Record<string, any>; articulation: Record<string, any> }[] }).candidates;
    const [r1, r2, r3, r4, r5] = o.song.parts.map((p) => p.role) as [string, string, string, string, string];
    eq(insts(r1)[0]!.instrument.outputGainDb, TEMPLATE.lounge.tsukuyomiOutputGainDb); eq(insts(r2)[0]!.instrument.outputGainDb, TEMPLATE.lounge.tsukuyomiOutputGainDb, "没上场的小月相也补");
    eq(insts(r1).map((c) => c.articulation.rollHz).join(), "14,14");
    const sine = insts(r3).at(-1)!, kit = insts(r4).at(-1)!, rev = insts(r5).at(-1)!;
    eq(sine.instrument.hitSecByKey, undefined, "有音高的不补"); eq(sine.articulation.rollHz, 14);
    eq(Object.keys(kit.instrument.hitSecByKey).length, 61); eq(kit.articulation.rollHz, 12);
    eq(JSON.stringify(rev.instrument.hitSecByKey), JSON.stringify({ 60: 1.389 })); eq(rev.articulation.rollHz, 12);
    eq(o.notices.join(" / "), "", "补数不说话");
    const D = createDocument({ st: initState(o.song), extras: o.extras }, { now: () => 0, onState() {}, onExtras() {}, onRefused() {}, onRestored() {} });
    eq(D.dirty(), false);
  });
  it("存一次 = 这几样都写进文件、休息室版本是这一版；再读再存逐字节相同", () => {
    const o = openBytes("lounge-3.mxl", bytes), save = (x: typeof o) => saveMxl({ song: x.song, extras: x.extras, app: "t", date: "2026-11-12T00:00:00.000Z", view: x.view, references: x.references });
    const b1 = save(o), z1 = unzipSync(b1), role = o.song.parts[0]!.role, j = JSON.parse(strFromU8(z1[`.moonsinger/lounge/${role}.json`]!));
    eq(j.candidates[0].instrument.outputGainDb, 6.52); eq(j.candidates[0].articulation.rollHz, 14);
    const z2 = unzipSync(save(openBytes("again.mxl", b1)));
    for (const k of Object.keys(z1)) if (k !== ".moonsinger/manifest.json") assert(z1[k]!.length === z2[k]!.length && z1[k]!.every((v, i) => v === z2[k]![i]), `${k} 再存逐字节相同`);
  });
});

