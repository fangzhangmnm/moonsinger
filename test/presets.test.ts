// 乐器预设的规矩（v0.16.38，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §5 R1–R7、§8 验收）。
// user 11-09（施工单 §9 转述）：换乐器时没调过的预设不留、调过的留着；整首歌共用（别的声部的预设看得见、拷一份过来）；能复制。
// 守的是数据：指纹和键的先后 / id / castAs 无关；刚换上 = 没调过、调任何一样 = 调过；换下台删 / 留；旧歌的候选一个都不删；旧版 app 改了设置、asCast 原样留着 = 判成调过；内置的按出厂判。
import { describe, it, eq, assert } from "./runner.mjs";
import { emptyExtras, withNewRole, withSf2Candidate, withSwap, withActive, withCastAs, withCandidateCopy, isUntouched, settingsPrint, songPresets, candidates, candidateJson, activeId,
  withCalibration, withGapSec, withVelocity, withTranspose, withSfxFixed, withSfxAlign, withSingCore, withSingChunk, activeSingCore, activeCalibrationDb, CANDIDATE_ID, saveMxl, openBytes, type Extras } from "../src/format/project.ts";
import { initState } from "../src/score/song.ts";
import { roleShowName } from "../src/format/part-show.ts";

const hum = "n" as const;
const sub = (k: number) => new Uint8Array([1, 2, 3, k]);
const sf = (name: string, program: number, sfx = false) => ({ name, bank: 0, program, calibrationDb: -6, subset: sub(program), sha256: `sha${program}`.padEnd(64, "0"), embed: false as const,
  ...(sfx ? { note: 60, sfx: { key: 60, midi: 61 } } : {}),
  origin: { name: "GeneralUser GS 2.0.3", fileSha256: "f".repeat(64), bytes: 1000, library: "generaluser-gs-2.0.3" }, credit: { attribution: ["x"], license: { name: "y" } } });
const concept = (n: string) => ({ name: n, sound: `wind.${n}`, concept: { ids: { wikidata: `Q${n}`, local: null, musicxml: null, gm: [], hs: null }, name: { zh: n, en: n } } });
/** 照 main.ts castPick 那一路换上一件 GS 乐器：造 → 记 castAs → 换上台（R2 / R3）。 */
function cast(ex: Extras, role: string, name: string, program: number, o: { sfx?: boolean } = {}): Extras {
  const prev = activeId(ex, role);
  let next = withSf2Candidate(ex, role, sf(name, program, o.sfx), hum);
  const id = activeId(next, role);
  next = withCastAs(next, role, id, concept(name), hum);
  return withSwap(next, role, id, hum, { prev, fresh: true, before: ex });
}
const base = () => withNewRole(withNewRole(emptyExtras(), "r1", hum), "r2", hum);
const ids = (ex: Extras, role: string) => candidates(ex, role).map((c) => c.id).join(",");
const names = (ex: Extras, role: string) => candidates(ex, role).map((c) => c.name).join(",");

describe("R1 设置指纹", () => {
  it("和键的先后无关、和 id / castAs / asCast 无关", () => {
    const a = { id: "c3", name: "Flute", calibrationDb: -6, instrument: { engine: "soundfont", bank: 0, program: 73 } };
    const b = { instrument: { program: 73, engine: "soundfont", bank: 0 }, calibrationDb: -6, name: "Flute", id: "c9", castAs: concept("x"), asCast: "whatever" };
    eq(settingsPrint(a), settingsPrint(b));
    eq(settingsPrint(a).length, 16);
  });
  it("任何一个设置变了 = 指纹变了（含以后才有的不认识的键）", () => {
    const a = { id: "c3", name: "Flute", calibrationDb: -6 };
    assert(settingsPrint(a) !== settingsPrint({ ...a, calibrationDb: -5.9 }), "响度");
    assert(settingsPrint(a) !== settingsPrint({ ...a, name: "Flute 2" }), "名字");
    assert(settingsPrint(a) !== settingsPrint({ ...a, futureKey: 1 }), "不认识的键");
  });
});

describe("刚换上 = 没调过；调任何一样 = 调过", () => {
  const ex = cast(base(), "r1", "Flute", 73, { sfx: true }), id = activeId(ex, "r1");
  it("刚换上的那位记了 asCast、判成没调过", () => {
    eq(typeof candidateJson(ex, "r1", id)?.asCast, "string");
    eq(isUntouched(ex, "r1", id, hum), true);
  });
  const tweaks: [string, (e: Extras) => Extras][] = [
    ["响度", (e) => withCalibration(e, "r1", -3, hum)], ["音和音之间", (e) => withGapSec(e, "r1", 0.05, hum)], ["力度", (e) => withVelocity(e, "r1", 0.5, hum)],
    ["修八度", (e) => withTranspose(e, "r1", 12, hum)], ["固定原速", (e) => withSfxFixed(e, "r1", false, hum)], ["音高对齐", (e) => withSfxAlign(e, "r1", true, hum)],
  ];
  for (const [what, f] of tweaks) it(`调了${what} = 调过`, () => { const t = f(ex); assert(t !== ex, "真改了"); eq(isUntouched(t, "r1", id, hum), false); });
  it("小月相的两个旋钮（内置那位：和出厂比）", () => {
    const e0 = base();
    eq(isUntouched(e0, "r1", CANDIDATE_ID.full, hum), true, "出厂 = 没调过");
    eq(isUntouched(withSingCore(e0, "r1", "breath", 0.5, hum), "r1", CANDIDATE_ID.full, hum), false, "唱法旋钮");
    eq(isUntouched(withSingChunk(e0, "r1", "whole", hum), "r1", CANDIDATE_ID.full, hum), false, "分段唱");
    eq(isUntouched(withCalibration(e0, "r1", -1, hum), "r1", CANDIDATE_ID.full, hum), false, "响度");
  });
  it("内置那位：换了哼的字、记了 castAs 不算调过", () => {
    let e0 = base(); e0 = withCastAs(e0, "r1", CANDIDATE_ID.full, concept("Voice"), hum);
    eq(isUntouched(e0, "r1", CANDIDATE_ID.full, "a"), true);
  });
});

describe("R2 换乐器时下台的那位", () => {
  it("没调过 = 同一次提交里删掉；撤销（拿回换之前的 extras）两样一起回来", () => {
    const a = cast(base(), "r1", "Flute", 73), idA = activeId(a, "r1");
    const b = cast(a, "r1", "Oboe", 68);
    eq(names(b, "r1"), "小月相,小月相（元音）,Oboe", "Flute 没了");
    assert(!candidateJson(b, "r1", idA), "Flute 那一位不在了");
    eq(names(a, "r1"), "小月相,小月相（元音）,Flute", "换之前那份没被改（撤销 = 回到它）");
  });
  it("调过 = 留着", () => {
    const a = withCalibration(cast(base(), "r1", "Flute", 73), "r1", -2, hum);
    const b = cast(a, "r1", "Oboe", 68);
    eq(names(b, "r1"), "小月相,小月相（元音）,Flute,Oboe");
  });
  it("内置的从来不删（没调过也不删）", () => {
    const b = cast(base(), "r1", "Flute", 73);   // 下台的是小月相
    eq(names(b, "r1"), "小月相,小月相（元音）,Flute");
  });
  it("点预设换上（不是新造）：下台那位没调过 = 删；新上来的不重新记 asCast", () => {
    const a = withCalibration(cast(base(), "r1", "Flute", 73), "r1", -2, hum), idF = activeId(a, "r1");
    const b = cast(a, "r1", "Oboe", 68), idO = activeId(b, "r1");
    const c = withSwap(b, "r1", idF, hum);   // 点回调过的 Flute
    eq(activeId(c, "r1"), idF); assert(!candidateJson(c, "r1", idO), "没调过的 Oboe 下台 = 删");
    eq(isUntouched(c, "r1", idF, hum), false, "Flute 还是调过的");
  });
  it("没别人引用的嵌入字节一起丢", () => {
    const emb = (ex: Extras, name: string, program: number) => { const prev = activeId(ex, "r1"); let n = withSf2Candidate(ex, "r1", { ...sf(name, program), embed: true }, hum); const id = activeId(n, "r1"); return withSwap(n, "r1", id, hum, { prev, fresh: true, before: ex }); };
    const a = emb(base(), "Flute", 73); eq(Object.keys(a.sounds).length, 1);
    const b = emb(a, "Oboe", 68); eq(Object.keys(b.sounds).length, 1, "Flute 的字节跟着走了，只剩 Oboe 的");
  });
});

describe("旧歌 / 旧版 app", () => {
  it("没有 asCast 的候选全部当作调过：换乐器不自动删任何旧东西", () => {
    let a = withSf2Candidate(base(), "r1", sf("Flute", 73), hum);   // 旧版 app 造的：没有 asCast
    const idF = activeId(a, "r1"); eq(isUntouched(a, "r1", idF, hum), false);
    a = cast(a, "r1", "Oboe", 68);
    assert(!!candidateJson(a, "r1", idF), "旧的 Flute 留着");
  });
  it("旧版 app 改了设置、asCast 原样写回 = 判成调过", () => {
    const a = cast(base(), "r1", "Flute", 73), id = activeId(a, "r1");
    const old = structuredClone(a.lounge.r1) as { candidates: { id: string; calibrationDb: number }[] };   // 旧 app 不认 asCast、原样带着，只改了响度
    old.candidates.find((c) => c.id === id)!.calibrationDb = -1;
    const b: Extras = { ...a, lounge: { ...a.lounge, r1: old as never } };
    eq(isUntouched(b, "r1", id, hum), false);
  });
  it("存档再打开：没调过照样是没调过", () => {
    const ex = cast(base(), "r1", "Flute", 73), id = activeId(ex, "r1");
    let st = initState(); st = { ...st, song: { ...st.song, parts: [{ ...st.song.parts[0], role: "r1" }] } };
    const bytes = saveMxl({ song: st.song, hum, extras: ex, app: "t", date: "2026-11-09" });
    const back = openBytes("x.mxl", bytes);
    eq(isUntouched(back.extras, "r1", id, hum), true);
  });
});

describe("R4 这首歌的乐器预设一行", () => {
  const parts = [{ role: "r1", label: "Vo." }, { role: "r2", label: "Fl." }];
  it("本声部：台上那位 + 调过的；内置两位没调过 = 不列", () => {
    const a = withCalibration(cast(base(), "r1", "Flute", 73), "r1", -2, hum);
    const b = cast(a, "r1", "Oboe", 68);
    const l = songPresets(b, parts, "r1", hum);
    eq(l.map((x) => `${x.name}${x.on ? "*" : ""}`).join(","), "Flute,Oboe*");
    eq(l.every((x) => x.here), true);
  });
  it("新声部什么都没动：只有台上的小月相", () => {
    eq(songPresets(base(), parts, "r1", hum).map((x) => x.name).join(","), "小月相");
  });
  it("别的声部：调过的，写着在哪个声部上；没调过的不列", () => {
    let e = withCalibration(cast(base(), "r2", "Flute", 73), "r2", -2, hum);
    e = cast(e, "r2", "Oboe", 68);
    const l = songPresets(e, parts, "r1", hum);
    eq(l.map((x) => `${x.name}@${x.from}`).join(","), "小月相@Vo.,Flute@Fl.");
    eq(l.find((x) => x.name === "Flute")?.removable, false, "别的声部的不能在这里删");
  });
  it("同一套设置在好几个声部上 = 一格", () => {
    let e = withCalibration(base(), "r1", -1, hum); e = withCalibration(e, "r2", -1, hum);   // 两个声部的小月相都调成一样
    const l = songPresets(e, [...parts, { role: "r3", label: "S." }], "r1", hum);
    eq(l.map((x) => x.from).join(","), "Vo.");
  });
});

describe("R5 / R6 拷一份", () => {
  it("别的声部的预设拷过来换上：原声部不动；新加一位、不覆盖；castAs 一起拷、声部名字跟着换；不带 asCast", () => {
    const a = withCalibration(cast(base(), "r2", "Flute", 73), "r2", -2, hum), idF = activeId(a, "r2");
    const before = JSON.stringify(a.lounge.r2);
    const b = withCandidateCopy(a, "r2", idF, "r1", hum), idNew = activeId(b, "r1");
    eq(JSON.stringify(b.lounge.r2), before, "原声部一个字节不动");
    eq(ids(b, "r1"), `c1,c2,${idNew}`, "新加一位（内置的还在）");
    eq(candidateJson(b, "r1", idNew)?.calibrationDb, -2, "设置跟着拷过来");
    eq(candidateJson(b, "r1", idNew)?.asCast, undefined, "拷来的不带 asCast（= 调过，留着）");
    eq(roleShowName(b.lounge, "r1", "en"), "Flute", "声部显示的名字跟着换（12-4：没起名字 = 乐器的叫法，名字本身不写）");
  });
  it("拷过来时本声部台上那位没调过 = 照 R2 删", () => {
    const a = withCalibration(cast(base(), "r2", "Flute", 73), "r2", -2, hum), idF = activeId(a, "r2");
    const b = cast(a, "r1", "Oboe", 68), idO = activeId(b, "r1");
    const c = withCandidateCopy(b, "r2", idF, "r1", hum);
    assert(!candidateJson(c, "r1", idO), "没调过的 Oboe 下台 = 删");
  });
  it("同一个声部里复制一份：名字加「 2」、复制出来的上台、原来那位留着（没调过也留）", () => {
    const a = cast(base(), "r1", "Flute", 73), idF = activeId(a, "r1");
    const b = withCandidateCopy(a, "r1", idF, "r1", hum);
    eq(names(b, "r1"), "小月相,小月相（元音）,Flute,Flute 2");
    assert(activeId(b, "r1") !== idF, "复制出来的那份上台");
    assert(!!candidateJson(b, "r1", idF), "原来那位留着");
  });
});

describe("§7 第 3 条：一个声部里两位同一种引擎的候选", () => {
  it("两位小月相、设置不同、台上是后一位 = 出声用后一位的设置", () => {
    let e = withSingCore(base(), "r1", "breath", 0.25, hum); e = withCalibration(e, "r1", -2, hum);
    e = withCandidateCopy(e, "r1", CANDIDATE_ID.full, "r1", hum);
    e = withSingCore(e, "r1", "breath", 0.75, hum); e = withCalibration(e, "r1", -4, hum);
    eq(activeSingCore(e, "r1").breath, 0.75); eq(activeCalibrationDb(e, "r1"), -4);
    eq(candidateJson(e, "r1", CANDIDATE_ID.full)?.calibrationDb, -2, "前一位没被改");
    e = withActive(e, "r1", CANDIDATE_ID.full, hum);
    eq(activeSingCore(e, "r1").breath, 0.25, "换回前一位 = 前一位的设置");
  });
});
