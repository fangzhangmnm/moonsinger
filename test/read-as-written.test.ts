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
import { FORMAT_MINOR } from "../src/format/contract.ts";
import { buildTimeline, LEAD_IN } from "../src/engine/timeline.ts";
import { performerInfoOf } from "../src/core/render.ts";
import { ringFactoryOf } from "../src/format/project.ts";
import "../src/performers/index.ts";
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

// 踏板 11-2（lounge minor 5，2026-11-13 Claude Opus 5.5（MoonSinger小弟））：新键 articulation.softVel（弱音踏板踩着期间起的音加多少 MIDI 力度）。
//   冻结样本 = 上一版（lounge 4）的代码写的那份（`test/fixtures/format/minor/lounge-4/`）：按力度敲的乐手身上没有这个键
describe("老文件（lounge 4，上一版代码写的冻结样本）进门：按力度敲的乐手补 softVel = 模板的值，不说话、不算改过；按音量走的不补；存的时候写", () => {
  const bytes = new Uint8Array((fs as unknown as { readFileSync(u: URL): Uint8Array }).readFileSync(new URL("fixtures/format/minor/lounge-4/sample.mxl", import.meta.url)));
  type C = { instrument: Record<string, any>; articulation: Record<string, any> };
  const all = (o: ReturnType<typeof openBytes>) => o.song.parts.flatMap((p) => (o.extras.lounge[p.role] as { candidates: C[] }).candidates);
  it("SoundFont 的每一位补 softVel = 模板（−16）；小月相 / 元音版不补；没有提示；不算改过", () => {
    const o = openBytes("lounge-4.mxl", bytes), cs = all(o), sf = cs.filter((c) => c.instrument.engine === "soundfont"), other = cs.filter((c) => c.instrument.engine !== "soundfont");
    assert(sf.length > 0 && other.length > 0, `样本里两种都有（${sf.length} / ${other.length}）`);
    eq(sf.map((c) => c.articulation.softVel).join(), sf.map(() => TEMPLATE.lounge.articulation.velocity.softVel).join(), "按力度敲的补成模板的值");
    assert(other.every((c) => !("softVel" in c.articulation)), "按音量走的不认踏板 = 这个键没有定义、不补");
    eq(o.notices.join(" / "), "", "补数不说话");
    const D = createDocument({ st: initState(o.song), extras: o.extras }, { now: () => 0, onState() {}, onExtras() {}, onRefused() {}, onRestored() {} });
    eq(D.dirty(), false);
  });
  it("存一次 = softVel 写进文件、休息室是这一版；再读再存逐字节相同", () => {
    const o = openBytes("lounge-4.mxl", bytes), save = (x: typeof o) => saveMxl({ song: x.song, extras: x.extras, app: "t", date: "2026-11-13T00:00:00.000Z", view: x.view, references: x.references });
    const b1 = save(o), z1 = unzipSync(b1);
    const sfRole = o.song.parts.map((p) => p.role).find((r) => (o.extras.lounge[r] as { candidates: C[] }).candidates.some((c) => c.instrument.engine === "soundfont"))!;
    const j = JSON.parse(strFromU8(z1[`.moonsinger/lounge/${sfRole}.json`]!));
    eq(j.minor, FORMAT_MINOR.lounge); assert(j.candidates.filter((c: C) => c.instrument.engine === "soundfont").every((c: C) => c.articulation.softVel === -16), "写进去了");
    const z2 = unzipSync(save(openBytes("again.mxl", b1)));
    for (const k of Object.keys(z1)) if (k !== ".moonsinger/manifest.json") assert(z1[k]!.length === z2[k]!.length && z1[k]!.every((v, i) => v === z2[k]![i]), `${k} 再存逐字节相同`);
  });
});
// 统筹「踏板 11-2（v0.17.40）审」：更新版本写的怪值（softVel 写成字符串）出声之前那道查（core/render.ts performerInfoOf → perfSpecProblems）拦住：
//   这位进「不出声」清单、写着是哪个键，不进音频线程；别的声部照放；不抛。冻结样本 = lounge-5（v0.17.40 的代码写的）
describe("更新版本的文件、乐手身上写着怪值（softVel = \"y\"）：这位明着不出声、写清哪个键，别的照放，不抛", () => {
  it("performerInfoOf 报缺 softVel（perfSpecProblems 报的是规格里的键名）；时间线把这个声部放进不出声清单、原因里有这个键；别的 SoundFont 声部不报这个键", () => {
    const src = unzipSync(new Uint8Array((fs as unknown as { readFileSync(u: URL): Uint8Array }).readFileSync(new URL("fixtures/format/minor/lounge-5/sample.mxl", import.meta.url))));
    const lounge = Object.keys(src).filter((k) => k.startsWith(".moonsinger/lounge/"));
    const sfFile = lounge.find((k) => strFromU8(src[k]!).includes('"soundfont"'))!, z = { ...src };
    for (const k of lounge) { const j = JSON.parse(strFromU8(src[k]!)); j.minor = 99; if (k === sfFile) for (const c of j.candidates) if (c.instrument.engine === "soundfont") c.articulation.softVel = "y"; z[k] = strToU8(JSON.stringify(j)); }
    const o = openBytes("newer.mxl", zipSync(z)), banks = { presetIndex: () => null, velCurve: () => null } as never;
    const badRole = sfFile.split("/").pop()!.replace(/\.json$/, ""), bad = o.song.parts.find((p) => p.role === badRole)!;
    const infos = new Map(o.song.parts.map((p) => [p.id, performerInfoOf(o.extras, p, banks)]));
    assert((infos.get(bad.id)!.missing ?? []).includes("softVel"), `报缺 softVel：${JSON.stringify(infos.get(bad.id)!.missing)}`);
    for (const p of o.song.parts) if (p.id !== bad.id) assert(!(infos.get(p.id)!.missing ?? []).includes("softVel"), `${p.id} 不报 softVel`);
    let t: ReturnType<typeof buildTimeline> | null = null, threw = "";
    try { t = buildTimeline({ song: o.song, order: o.song.papers.map((p) => p.id), parts: o.song.parts, info: (p) => infos.get(p.id)!, singOpt: { leadIn: LEAD_IN } }); } catch (e) { threw = (e as Error).message; }
    eq(threw, "", "不抛");
    const u = t!.unplayable.find((x) => x.part === bad.id);
    assert(!!u && u.why.includes("softVel"), `这个声部在不出声清单里、写着这个键：${JSON.stringify(u)}`);
    assert(t!.tracks.length > 0, `别的声部照放（${t!.tracks.length} 条轨）`);
  });
});
// 踏板 11-3（lounge minor 6，2026-11-13 Claude Opus 5.5（MoonSinger小弟））：新键 articulation.pedal（没写踏板记号时留不留住音："down" / "up"）。
//   冻结样本 = 上一版（lounge 5，v0.17.40）的代码写的那份（`test/fixtures/format/minor/lounge-5/`，改代码之前写的）
describe("老文件（lounge 5，上一版代码写的冻结样本）进门：按力度敲的乐手补 pedal = 现在的名单，不说话、不算改过；存的时候写；读不懂 = 照名单；更新版本的原样带回", () => {
  const bytes = new Uint8Array((fs as unknown as { readFileSync(u: URL): Uint8Array }).readFileSync(new URL("fixtures/format/minor/lounge-5/sample.mxl", import.meta.url)));
  type C = { instrument: Record<string, any>; articulation: Record<string, any> };
  const all = (o: ReturnType<typeof openBytes>) => o.song.parts.flatMap((p) => (o.extras.lounge[p.role] as { candidates: C[] }).candidates);
  it("SoundFont 的每一位补成名单现在的值（名单在 user 点头之前是空的 = 都 up）、和 ringFactoryOf 一致；按音量走的不补；没有提示；不算改过", () => {
    const o = openBytes("lounge-5.mxl", bytes), cs = all(o), sf = cs.filter((c) => c.instrument.engine === "soundfont"), other = cs.filter((c) => c.instrument.engine !== "soundfont");
    assert(sf.length > 0 && other.length > 0, `样本里两种都有（${sf.length} / ${other.length}）`);
    eq(sf.map((c) => c.articulation.pedal).join(), sf.map((c) => ringFactoryOf(c as never).pedal).join(), "补的 = 名单现在的值");
    assert(sf.every((c) => c.articulation.pedal === "down" || c.articulation.pedal === "up"), "只有两个值");
    assert(other.every((c) => !("pedal" in c.articulation)), "按音量走的不认踏板 = 这个键没有定义、不补");
    eq(o.notices.join(" / "), "", "补数不说话");
    const D = createDocument({ st: initState(o.song), extras: o.extras }, { now: () => 0, onState() {}, onExtras() {}, onRefused() {}, onRestored() {} });
    eq(D.dirty(), false);
  });
  it("存一次 = pedal 写进文件、休息室是这一版；再读再存逐字节相同", () => {
    const o = openBytes("lounge-5.mxl", bytes), save = (x: typeof o) => saveMxl({ song: x.song, extras: x.extras, app: "t", date: "2026-11-13T00:00:00.000Z", view: x.view, references: x.references });
    const b1 = save(o), z1 = unzipSync(b1);
    const sfRole = o.song.parts.map((p) => p.role).find((r) => (o.extras.lounge[r] as { candidates: C[] }).candidates.some((c) => c.instrument.engine === "soundfont"))!;
    const j = JSON.parse(strFromU8(z1[`.moonsinger/lounge/${sfRole}.json`]!));
    eq(j.minor, FORMAT_MINOR.lounge); assert(j.candidates.filter((c: C) => c.instrument.engine === "soundfont").every((c: C) => c.articulation.pedal === "down" || c.articulation.pedal === "up"), "写进去了");
    const z2 = unzipSync(save(openBytes("again.mxl", b1)));
    for (const k of Object.keys(z1)) if (k !== ".moonsinger/manifest.json") assert(z1[k]!.length === z2[k]!.length && z1[k]!.every((v, i) => v === z2[k]![i]), `${k} 再存逐字节相同`);
  });
  it("写着合法的值照读；读不懂（不比这一版新）= 照名单补；比这一版新 = 原样留着、存的时候照写", () => {
    const o0 = openBytes("lounge-5.mxl", bytes), saved = saveMxl({ song: o0.song, extras: o0.extras, app: "t", date: "2026-11-13T00:00:00.000Z", view: o0.view, references: o0.references });
    const z = unzipSync(saved), file = Object.keys(z).filter((k) => k.startsWith(".moonsinger/lounge/")).find((k) => strFromU8(z[k]!).includes('"soundfont"'))!;
    const mut = (f: (j: any) => void) => { const j = JSON.parse(strFromU8(z[file]!)); f(j); return openBytes("m.mxl", zipSync({ ...z, [file]: strToU8(JSON.stringify(j)) })); };
    const sfOf = (o: ReturnType<typeof openBytes>) => all(o).filter((c) => c.instrument.engine === "soundfont").map((c) => c.articulation.pedal);
    const set = (v: unknown) => (j: any) => { for (const c of j.candidates) if (c.instrument.engine === "soundfont") c.articulation.pedal = v; };
    assert(sfOf(mut(set("down"))).includes("down"), "写着 down 照读");
    const bad = mut(set("auto")); assert(!sfOf(bad).includes("auto"), "读不懂（auto）= 照名单补"); eq(bad.notices.join(""), "", "不说");
    const newer = mut((j) => { j.minor = 99; set("auto")(j); }); assert(sfOf(newer).includes("auto"), "更新版本的原样留着");
    const back = unzipSync(saveMxl({ song: newer.song, extras: newer.extras, app: "t", date: "2026-11-13T00:00:00.000Z", view: newer.view, references: newer.references }));
    assert(/"pedal":\s*"auto"/.test(strFromU8(back[file]!)), "存的时候照写");
  });
});
