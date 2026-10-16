// 定稿 / 改稿的格式层（src/format/final.ts + project.ts）：指纹、记录进出、锁、作废。created 2026-10-16 by Claude Fable 5.1（W-38）
import { describe, it, eq, assert } from "./runner.mjs";
import { sha256HexSync, sha256TextSync } from "../src/format/sha256-sync.ts";
import { contentFingerprint, strippedXml, onlyMetaChanged, parseFinalRecord, FINAL_MP3_ENTRY, type FinalRecord } from "../src/format/final.ts";
import { saveMxl, openBytes, contentFingerprintOf, withFinal, withoutFinal, isFinal, withThumbnail, withCalibration, withRoleName, emptyExtras } from "../src/format/project.ts";
import { unzipSync, strFromU8, zipSync } from "../vendor/fflate/fflate.esm.js";
import { sampleSong, sampleExtras, sampleView } from "./fixtures/format/sample-song.ts";
const nodeCrypto = (await import("node:crypto" as string)) as { createHash(a: string): { update(b: Uint8Array | string): { digest(e: "hex"): string } } };

const ARGS = (song = sampleSong(), extras = sampleExtras(song)) => ({ song, hum: song.hum, extras, app: "test", date: "2026-10-16T01:02:03.000Z", view: sampleView() });
const record = (fingerprint: string, mp3: Uint8Array, rev = 1): FinalRecord => ({ at: "2026-10-16T00:00:00.000Z", rev, app: "test", core: { version: "0.1.0", hash: "abc" }, fingerprint,
  mp3: { path: FINAL_MP3_ENTRY, bytes: mp3.length, sha256: nodeCrypto.createHash("sha256").update(mp3).digest("hex"), secs: 1, sr: 44100, kbps: 128, stereo: true }, parts: ["P1"] });
const MP3 = new Uint8Array(1000).map((_, i) => (i * 7) & 0xff);

describe("同步 sha256", () => {
  it("和 node:crypto 一样（空、短、跨块、长）", () => {
    for (const n of [0, 1, 55, 56, 63, 64, 65, 1000, 70000]) {
      const b = new Uint8Array(n).map((_, i) => (i * 31 + 7) & 0xff);
      eq(sha256HexSync(b), nodeCrypto.createHash("sha256").update(b).digest("hex"), `n=${n}`);
    }
    eq(sha256TextSync("定稿"), nodeCrypto.createHash("sha256").update("定稿").digest("hex"));
  });
});

describe("出声内容的指纹", () => {
  it("MusicXML 头上的歌名 / 曲段名 / 作者栏 / 许可 / 编码日期 / 纸剥掉，别的留着", () => {
    const xml = `<?xml?><score-partwise><work><work-title>歌</work-title></work>\n<movement-title>A</movement-title>\n<identification><rights>CC0</rights><encoding><software>x</software><encoding-date>2026</encoding-date></encoding></identification>\n<defaults><scaling/></defaults>\n<credit page="1"><credit-words>me</credit-words></credit>\n<part-list/><part id="P1"/></score-partwise>`;
    eq(strippedXml(xml), `<?xml?><score-partwise><part-list/><part id="P1"/></score-partwise>`);
  });
  it("存两次（日期不同）指纹一样；存了再开再存还是一样（往返稳定）", () => {
    const a = ARGS(), fp1 = contentFingerprintOf(a), fp2 = contentFingerprintOf({ ...a, date: "2027-01-01T00:00:00.000Z", app: "other" });
    eq(fp1, fp2, "日期 / app 版本不进指纹");
    const o = openBytes("s.mxl", saveMxl(a));
    eq(contentFingerprintOf({ song: o.song, hum: o.hum, extras: o.extras, app: "x", date: "x", view: o.view }), fp1, "开了再存");
  });
  it("歌名 / 作者栏 / 许可 / 封面 / 视图态变了指纹不变；音 / 休息室 / 录音房变了就变", () => {
    const a = ARGS(), fp = contentFingerprintOf(a);
    eq(contentFingerprintOf({ ...a, song: { ...a.song, title: "改了", credits: "改了", rights: "MIT" } }), fp, "元信息");
    eq(contentFingerprintOf({ ...a, extras: withThumbnail(a.extras, new Uint8Array([1, 2, 3])) }), fp, "封面");
    eq(contentFingerprintOf({ ...a, view: { scope: "all" } }), fp, "视图态");
    const toks = a.song.papers[0].tracks.P1, i = toks.findIndex((t) => t.kind === "note");
    const song2 = { ...a.song, papers: a.song.papers.map((p, k) => (k ? p : { ...p, tracks: { ...p.tracks, P1: toks.map((t, j) => (j === i ? { ...t, pitch: { step: "B", alter: 0, octave: 5 } } : t)) } })) };
    assert(contentFingerprintOf({ ...a, song: song2 as typeof a.song }) !== fp, "改了一个音");
    assert(contentFingerprintOf({ ...a, extras: withCalibration(a.extras, "r1", 2, a.hum) }) !== fp, "改了响度校准");
    assert(contentFingerprintOf({ ...a, extras: withRoleName(a.extras, "r1", "别人", a.hum) }) !== fp, "改了角色名（锁着）");
  });
  it("contentFingerprint 对原料的键顺序 / 排序不敏感", () => {
    const base = { papers: { p2: "<b/>", p1: "<a/>" }, scoreExt: `{"version":2,"view":{"scope":"all"},"papers":[]}`, lounge: { r2: "{}", r1: "{\"a\":1}" }, studio: "{\"tracks\":[]}", sounds: ["b", "a"] };
    const same = { papers: { p1: "<a/>", p2: "<b/>" }, scoreExt: `{"version":2,"papers":[]}`, lounge: { r1: "{\"a\":1}", r2: "{}" }, studio: "{\"tracks\":[]}", sounds: ["a", "b"] };
    eq(contentFingerprint(base), contentFingerprint(same));
  });
});

describe("定稿记录进出 .mxl", () => {
  it("定稿 = manifest.final + 不压缩的 final.mp3 entry（排在总目录 / 封面前面）；开回来记录和字节都在", () => {
    const a = ARGS(), fp = contentFingerprintOf(a), ex = withFinal(withoutFinal(a.extras), record(fp, MP3, 3), MP3);
    const bytes = saveMxl({ ...a, extras: ex, core: { version: "0.1.0", hash: "deadbeef" } });
    const files = unzipSync(bytes), names = Object.keys(files);
    const m = JSON.parse(strFromU8(files[".moonsinger/manifest.json"]));
    eq(m.final.rev, 3); eq(m.final.fingerprint, fp); eq(m.finalRev, 3); eq(m.core.hash, "deadbeef");
    eq(files[FINAL_MP3_ENTRY].length, MP3.length);
    assert(names.indexOf(FINAL_MP3_ENTRY) < names.indexOf(".moonsinger/manifest.json"), "mp3 在总目录前面");
    eq(names[names.length - 1], ".moonsinger/manifest.json", "总目录最后（样本没封面；有封面时封面在它后面）——尾读一次命中");
    { const withCover = Object.keys(unzipSync(saveMxl({ ...a, extras: withThumbnail(ex, new Uint8Array([1, 2, 3])) }))); eq(withCover.slice(-2).join(","), ".moonsinger/manifest.json,Thumbnails/thumbnail.png", "有封面：总目录倒数第二、封面最后"); }
    const o = openBytes("s.mxl", bytes);
    eq(o.notices.length, 0, o.notices.join(" | "));
    assert(isFinal(o.extras) && o.extras.final!.rev === 3 && o.extras.finalMp3!.length === MP3.length, "开回来是定稿的");
    eq(o.extras.finalRev, 3);
  });
  it("改稿 = 记录和 entry 一起消失（读进来的总目录里的 final 不许留着）；finalRev 留着", () => {
    const a = ARGS(), fp = contentFingerprintOf(a);
    const o = openBytes("s.mxl", saveMxl({ ...a, extras: withFinal(withoutFinal(a.extras), record(fp, MP3, 2), MP3) }));
    const ex = withoutFinal(o.extras);
    const files = unzipSync(saveMxl({ ...a, song: o.song, extras: ex }));
    const m = JSON.parse(strFromU8(files[".moonsinger/manifest.json"]));
    eq(m.final, undefined, "final 没了"); eq(m.finalRev, 2, "次数留着"); eq(files[FINAL_MP3_ENTRY], undefined, "entry 没了");
    eq(isFinal(ex), false);
  });
  it("格式层的锁：定稿着改了出声的内容 = saveMxl 抛；只改歌名 / 作者栏 / 封面 = 照存", () => {
    const a = ARGS(), fp = contentFingerprintOf(a), ex = withFinal(withoutFinal(a.extras), record(fp, MP3), MP3);
    saveMxl({ ...a, extras: ex, song: { ...a.song, title: "新名字", credits: "新作者" } });
    saveMxl({ ...a, extras: withThumbnail(ex, new Uint8Array([9, 9])) });
    let threw = "";
    try { saveMxl({ ...a, extras: withCalibration(ex, "r1", 1, a.hum) }); } catch (e) { threw = (e as Error).message; }
    assert(/定稿/.test(threw), `改了响度校准要抛：${threw}`);
  });
  it("定稿后被别的东西改过（指纹对不上）/ mp3 丢了 / 记录读不懂 = 定稿作废 + 说一声，entry 不带着走", () => {
    const a = ARGS(), fp = contentFingerprintOf(a), good = saveMxl({ ...a, extras: withFinal(withoutFinal(a.extras), record(fp, MP3), MP3) });
    const files = unzipSync(good);
    const rezip = (patch: (f: Record<string, Uint8Array>) => void) => { const f = { ...files }; patch(f); const e: Record<string, [Uint8Array, { level: 0 }]> = {}; for (const [k, v] of Object.entries(f)) e[k] = [v, { level: 0 }]; return zipSync(e); };
    const tampered = rezip((f) => { f[".moonsinger/studio.json"] = new TextEncoder().encode(strFromU8(f[".moonsinger/studio.json"]).replace('"gainDb": -1', '"gainDb": -5')); });
    const o1 = openBytes("s.mxl", tampered);
    assert(!isFinal(o1.extras) && o1.notices.some((n) => /定稿后被改过/.test(n)), o1.notices.join(" | "));
    eq(Object.keys(o1.extras.unknown).includes(FINAL_MP3_ENTRY), false, "作废的 mp3 不进 unknown");
    const o2 = openBytes("s.mxl", rezip((f) => { delete f[FINAL_MP3_ENTRY]; }));
    assert(!isFinal(o2.extras) && o2.notices.some((n) => /mp3 不在/.test(n)), o2.notices.join(" | "));
    const o3 = openBytes("s.mxl", rezip((f) => { const m = JSON.parse(strFromU8(f[".moonsinger/manifest.json"])); m.final = { nonsense: 1 }; f[".moonsinger/manifest.json"] = new TextEncoder().encode(JSON.stringify(m)); }));
    assert(!isFinal(o3.extras) && o3.notices.some((n) => /读不懂/.test(n)), o3.notices.join(" | "));
    eq(parseFinalRecord({ nonsense: 1 }), null);
  });
  it("没定稿的歌照旧：没有 final / finalRev 键、没有 entry", () => {
    const a = ARGS(), files = unzipSync(saveMxl({ ...a, extras: { ...withoutFinal(a.extras), finalRev: 0 } }));
    const m = JSON.parse(strFromU8(files[".moonsinger/manifest.json"]));
    eq(m.final, undefined); eq(m.finalRev, undefined); eq(files[FINAL_MP3_ENTRY], undefined);
    const ex = emptyExtras(); eq(ex.final, null); eq(ex.finalRev, 0);
  });
});

describe("定稿后哪些改动算元信息", () => {
  it("只换 title / credits / rights / paper = true；换了谱 / 声部 / 哼 / 编排 = false", () => {
    const s = sampleSong();
    assert(onlyMetaChanged(s, { ...s, title: "x", credits: "y", rights: "z", paper: undefined }));
    assert(!onlyMetaChanged(s, { ...s, papers: [...s.papers] }));
    assert(!onlyMetaChanged(s, { ...s, parts: [...s.parts] }));
    assert(!onlyMetaChanged(s, { ...s, hum: "a" }));
    assert(!onlyMetaChanged(s, { ...s, arrangement: "2 1" }));
    assert(!onlyMetaChanged(s, { ...s, lyricFit: undefined }));
  });
});
