// ids-guard.test.ts —— 读入边界：文件里当编号用的字段先校验再用（src/format/ids.ts）。created 2026-11-10 by Claude Fable 5.2（总表第 5 条「读文件时的安全」）。
//   守的是：别人给的 .mxl 把编号写成带引号 / 尖括号的串，进不了 app（自家文件 = 拒开；别的软件的谱 = 声部编号换掉）；正常的歌一首都不受影响。
import { describe, it, eq, assert } from "./runner.mjs";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";
import { SAFE_ID, isSafeId, badIds, safePartIds, safeView } from "../src/format/ids.ts";
import { saveMxl, openBytes } from "../src/format/project.ts";
import { sampleSong, sampleExtras, sampleView } from "./fixtures/format/sample-song.ts";

const EVIL = `x" onclick="alert(1)`, EVIL2 = `p1"><img src=x onerror=alert(1)>`;
const bytes = () => { const song = sampleSong(); return saveMxl({ song, hum: song.hum, extras: sampleExtras(song), app: "t", date: "2026-11-10T00:00:00.000Z", view: sampleView() }); };
type J = Record<string, any>;   // eslint-disable-line @typescript-eslint/no-explicit-any
/** 把存出来的歌里某一份 JSON 改一下再包回去。 */
const hack = (path: string, f: (j: J) => void, base: Uint8Array = bytes()): Uint8Array => { const z = unzipSync(base) as Record<string, Uint8Array>; const j = JSON.parse(strFromU8(z[path])) as J; f(j); z[path] = strToU8(JSON.stringify(j)); return zipSync(z); };
const refused = (b: Uint8Array, why: string) => { let msg = ""; try { openBytes("x.mxl", b); } catch (e) { msg = (e as Error).message; } assert(msg.includes("不合规矩的编号"), `${why}：该拒开，实际 ${msg || "打开了"}`); assert(!msg.includes("onclick") && !msg.includes("<img"), `${why}：报错里不许把那个编号本身抄出来`); };
const SCORE = ".moonsinger/score.json", STUDIO = ".moonsinger/studio.json";

describe("编号的规矩", () => {
  it("app 自己铸的都合规矩；带引号 / 尖括号 / 空格 / 空串 / 太长 / 不是字符串的都不合", () => {
    for (const id of ["p1", "P12", "r3", "m1", "b2", "c0", "eq1", "reverb12", "master", "P1.staff-2_x"]) assert(isSafeId(id), id);
    for (const id of [EVIL, EVIL2, "a b", "", "-x", "a/b", "a~lo", "a\nb", "x".repeat(65), 7, null, undefined, {}]) assert(!isSafeId(id), JSON.stringify(id));
    assert(SAFE_ID.test("x".repeat(64)));
  });
  it("样本歌存出来的文件：没有一个编号被判不合规矩（正常的歌不受影响），照常打开", () => {
    const z = unzipSync(bytes()) as Record<string, Uint8Array>, lounge: Record<string, J> = {};
    for (const k of Object.keys(z)) { const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(k); if (m) lounge[m[1]] = JSON.parse(strFromU8(z[k])); }
    eq(JSON.stringify(badIds(JSON.parse(strFromU8(z[SCORE])), lounge, JSON.parse(strFromU8(z[STUDIO])))), "{}");
    assert(openBytes("x.mxl", bytes()).song.papers.length > 0);
  });
});

describe("自家的文件里编号被改坏 = 拒开、明说", () => {
  it("曲段的编号", () => { refused(hack(SCORE, (j) => { j.papers[0].id = EVIL2; }), "papers[].id"); });
  it("声部的编号 / 它的角色 / 麦克风 / 合租的主人", () => {
    refused(hack(SCORE, (j) => { j.parts[0].id = EVIL; }), "parts[].id");
    refused(hack(SCORE, (j) => { j.parts[0].role = EVIL; }), "parts[].role");
    refused(hack(SCORE, (j) => { j.parts[0].mic = EVIL; }), "parts[].mic");
    refused(hack(SCORE, (j) => { j.parts[1].host = EVIL; }), "parts[].host");
  });
  it("每段里按声部挂的表的键（人插的小节线 / 音内起伏 / 关自动八度线）", () => {
    refused(hack(SCORE, (j) => { j.papers[0].manualBars = { [EVIL]: [1] }; }), "manualBars 的键");
    refused(hack(SCORE, (j) => { j.papers[0].autoOttava = { [EVIL]: false }; }), "autoOttava 的键");
  });
  it("休息室：角色文件的名字、上场的是谁、演奏者的编号、跟着演奏者的效果格", () => {
    const z = unzipSync(bytes()) as Record<string, Uint8Array>, k = Object.keys(z).find((x) => /lounge\/[^/]+\.json$/.test(x))!;
    const moved = { ...z, [`.moonsinger/lounge/${EVIL}.json`]: z[k] }; delete (moved as Record<string, Uint8Array>)[k];
    refused(zipSync(moved), "lounge/<编号>.json");
    refused(hack(k, (j) => { j.active = EVIL; }), "active");
    refused(hack(k, (j) => { j.candidates[0].id = EVIL; }), "candidates[].id");
    refused(hack(k, (j) => { j.candidates[0].chain = [{ id: EVIL, kind: "eq", params: {} }]; }), "演奏者链上的效果格");
  });
  it("录音房：轨的编号 / 出到 / 发送 / 效果格的编号和种类 / 被谁压 / 总轨的链", () => {
    refused(hack(STUDIO, (j) => { j.tracks[0].id = EVIL; }), "tracks[].id");
    refused(hack(STUDIO, (j) => { j.tracks[0].to = EVIL; }), "tracks[].to");
    refused(hack(STUDIO, (j) => { j.tracks[0].sends = [{ to: EVIL, gainDb: -12 }]; }), "sends[].to");
    refused(hack(STUDIO, (j) => { j.tracks[0].chain = [{ id: EVIL, kind: "eq", params: {} }]; }), "chain[].id");
    refused(hack(STUDIO, (j) => { j.tracks[0].chain = [{ id: "eq1", kind: EVIL, params: {} }]; }), "chain[].kind");
    refused(hack(STUDIO, (j) => { j.tracks[0].chain = [{ id: "comp1", kind: "comp", params: {}, key: EVIL }]; }), "chain[].key");
    refused(hack(STUDIO, (j) => { j.master.chain = [{ id: EVIL, kind: "gain", params: {} }]; }), "master.chain[].id");
  });
  it("每张纸的谱里的声部编号（<score-part id> / <part id>）", () => {
    const z = unzipSync(bytes()) as Record<string, Uint8Array>, k = Object.keys(z).find((x) => /papers\/.*\.musicxml$/.test(x))!;
    z[k] = strToU8(strFromU8(z[k]).replace(/id="P1"/g, `id="x&quot; onclick=&quot;alert(1)"`));
    refused(zipSync(z), "MusicXML 里的声部编号");
  });
  it("不认识的效果种类只要长得像编号照样能开（原样带着、界面画灰）", () => {
    const o = openBytes("x.mxl", hack(STUDIO, (j) => { j.tracks[0].chain = [{ id: "shimmer1", kind: "shimmer", params: { x: 1 } }]; }));
    eq((o.extras.studio as J).tracks[0].chain[0].kind, "shimmer");
  });
});

describe("别的软件存的谱 / 视图态", () => {
  const xml = (pid: string) => `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="${pid}"><part-name>Flute</part-name></score-part><score-part id="P1"><part-name>Oboe</part-name></score-part></part-list>` +
    [pid, "P1"].map((id) => `<part id="${id}"><measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part>`).join("") + `</score-partwise>`;
  it("声部编号不合规矩的换成没用过的 P<n>，音照样读进来；合规矩的原样留着", () => {
    const o = openBytes("x.musicxml", strToU8(xml(`x&quot; onclick=&quot;alert(1)`)));
    eq(o.song.parts.map((p) => p.id).sort().join(" "), "P1 P2");
    for (const p of o.song.parts) assert(o.song.papers[0].tracks[p.id].some((t) => t.kind === "note"), p.id);
    eq(openBytes("x.musicxml", strToU8(xml("Flute_1"))).song.parts.map((p) => p.id).sort().join(" "), "Flute_1 P1");
  });
  it("safePartIds：不撞已有的编号", () => { eq(safePartIds([{ info: { id: "P1" } }, { info: { id: "a b" } }, { info: { id: "P2" } }, { info: { id: "<" } }]).map((p) => p.info.id).join(" "), "P1 P3 P2 P4"); });
  it("视图态里按编号挂的：不合规矩的那几条丢掉，别的留着", () => {
    eq(JSON.stringify(safeView({ scope: "all", paper: EVIL, parts: { P1: { hidden: true }, [EVIL]: { muted: true } } })), JSON.stringify({ scope: "all", parts: { P1: { hidden: true } } }));
    const o = openBytes("x.mxl", hack(SCORE, (j) => { j.view = { ...(j.view ?? {}), paper: EVIL2, parts: { [EVIL]: { hidden: true } } }; }));
    eq(o.view?.paper, undefined); eq(JSON.stringify(o.view?.parts), "{}");
  });
});
