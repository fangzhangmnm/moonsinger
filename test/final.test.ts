// 出声内容的指纹 + 老文件里带着的那份 mp3（src/format/final.ts + project.ts）。created 2026-10-16 by Claude Fable 5.1（W-38 定稿 / 改稿的格式层）
//   2026-11-10 Claude Fable 5.2：定稿退役（user 11-07「定稿取消，换修改锁」、11-10「对，以后统一不存mp3，旧的也删掉」）——锁和「记录进出」那几条换成：
//   老文件永远读得开、里面的 mp3 交给宿主（搬进设备缓存）、这一版起再也不往歌里写它。指纹照旧（现在是渲染缓存的钥匙）。
import { describe, it, eq, assert } from "./runner.mjs";
import { sha256HexSync, sha256TextSync } from "../src/format/sha256-sync.ts";
import { contentFingerprint, strippedXml, parseFinalRecord, FINAL_MP3_ENTRY, type FinalRecord } from "../src/format/final.ts";
import { saveMxl, saveMxlWithFingerprint, openBytes, contentFingerprintOf, canonicalIds, withThumbnail, withCalibration, withRoleName, emptyExtras } from "../src/format/project.ts";
import { withArt, swellOf, type NoteTok, type Song } from "../src/score/song.ts";
import { unzipSync, strFromU8, strToU8, zipSync } from "../vendor/fflate/fflate.esm.js";
import { sampleSong, sampleExtras, sampleView } from "./fixtures/format/sample-song.ts";
const nodeCrypto = (await import("node:crypto" as string)) as { createHash(a: string): { update(b: Uint8Array | string): { digest(e: "hex"): string } } };

const ARGS = (song = sampleSong(), extras = sampleExtras(song)) => ({ song, extras, app: "test", date: "2026-10-16T01:02:03.000Z", view: sampleView() });
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
  it("MusicXML 只剥掉 <encoding>（软件版本 + 日期）；歌名 / 曲段名 / 作者栏 / 许可 / 纸都留着（全冻）", () => {
    const xml = `<?xml?><score-partwise><work><work-title>歌</work-title></work>\n<identification><rights>CC0</rights><encoding><software>x</software><encoding-date>2026</encoding-date></encoding></identification>\n<credit page="1"><credit-words>me</credit-words></credit>\n<part-list/></score-partwise>`;
    eq(strippedXml(xml), `<?xml?><score-partwise><work><work-title>歌</work-title></work>\n<identification><rights>CC0</rights></identification>\n<credit page="1"><credit-words>me</credit-words></credit>\n<part-list/></score-partwise>`);
  });
  it("存两次（日期不同）指纹一样；存了再开再存还是一样（往返稳定）", () => {
    const a = ARGS(), fp1 = contentFingerprintOf(a), fp2 = contentFingerprintOf({ ...a, date: "2027-01-01T00:00:00.000Z", app: "other" });
    eq(fp1, fp2, "日期 / app 版本不进指纹");
    const o = openBytes("s.mxl", saveMxl(a));
    eq(contentFingerprintOf({ song: o.song, extras: o.extras, app: "x", date: "x", view: o.view }), fp1, "开了再存");
  });
  it("写出来的谱只看内容、不看内存里音的编号：编号打乱了指纹不变；按编号挂的两张表（音内起伏 / 还没写音高）跟着对得上（2026-11-10）", () => {
    // 内存里的编号是按这次打开里先写谁后写谁发的，重开一次就整首重编——不重编着写，同样的内容存两次、中间重开过 = 两个指纹，设备上记着的声音认不出「内容没变」
    const base = sampleSong(), p0 = base.papers[0], pid = Object.keys(p0.tracks)[0], toks = p0.tracks[pid];
    const notes = toks.map((t, i) => (t.kind === "note" && t.pitch ? i : -1)).filter((i) => i >= 0);
    assert(notes.length >= 2, "样本里第一条谱至少两个音");
    const [iSwell, iBlank] = notes;
    const marked: Song = { ...base, papers: base.papers.map((p, k) => (k ? p : { ...p, tracks: { ...p.tracks, [pid]: toks.map((t, i) => (i === iSwell ? withArt(t as NoteTok, "swellUp", true) : i === iBlank ? { ...(t as NoteTok), pitch: null } : t)) } })) };
    const scrambled: Song = { ...marked, papers: marked.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).map(([k, ts]) => [k, ts.map((t) => ({ ...t, id: 90000 - t.id * 7 }))])) })) };
    const A = ARGS(marked), B = { ...A, song: scrambled };
    eq(contentFingerprintOf(B), contentFingerprintOf(A), "编号打乱，指纹不变");
    const za = unzipSync(saveMxl(A)), zb = unzipSync(saveMxl(B));
    for (const k of Object.keys(za)) if (/papers\/.*\.musicxml$|score\.json$/.test(k)) eq(strFromU8(zb[k]), strFromU8(za[k]), `${k} 一个字都不差`);
    const o = openBytes("s.mxl", saveMxl(B)), back = o.song.papers[0].tracks[pid];
    eq(swellOf(back[iSwell]), "<", "音内渐强还在那个音上");
    assert(back[iBlank].kind === "note" && (back[iBlank] as NoteTok).pitch === null, "还没写音高的还是那个音");
    const want = marked.papers[0].tracks[pid], at = (ts: typeof want, f: (t: (typeof want)[number]) => boolean) => ts.map((t, i) => (f(t) ? i : -1)).filter((i) => i >= 0).join(",");
    eq(at(back, (t) => !!swellOf(t)), at(want, (t) => !!swellOf(t)), "带音内起伏的还是那几个位置"); eq(at(back, (t) => t.kind === "note" && !t.pitch), at(want, (t) => t.kind === "note" && !t.pitch), "没写音高的还是那几个位置");
    assert(canonicalIds(o.song) === o.song, "读进来的编号就是写的时候编的那一套（已经是了 = 原样返回）");
    eq(contentFingerprintOf({ song: o.song, extras: o.extras, app: "x", date: "x", view: o.view }), contentFingerprintOf(A), "开了再存，指纹还是它");
    assert(scrambled.papers[0].tracks[pid][0].id === 90000 - toks[0].id * 7, "内存里的歌没被动过");
  });
  it("全冻：只有视图态不进指纹；歌名 / 作者栏 / 许可 / 封面 / 音 / 休息室 / 录音房变了都变（user 10-16「都冻同意，封面当然进」）", () => {
    const a = ARGS(), fp = contentFingerprintOf(a);
    eq(contentFingerprintOf({ ...a, view: { scope: "all" } }), fp, "视图态");
    assert(contentFingerprintOf({ ...a, song: { ...a.song, title: "改了" } }) !== fp, "歌名");
    assert(contentFingerprintOf({ ...a, song: { ...a.song, credits: "改了" } }) !== fp, "作者栏");
    assert(contentFingerprintOf({ ...a, song: { ...a.song, rights: "MIT" } }) !== fp, "许可");
    assert(contentFingerprintOf({ ...a, extras: withThumbnail(a.extras, new Uint8Array([1, 2, 3])) }) !== fp, "封面");
    const toks = a.song.papers[0].tracks.P1, i = toks.findIndex((t) => t.kind === "note");
    const song2 = { ...a.song, papers: a.song.papers.map((p, k) => (k ? p : { ...p, tracks: { ...p.tracks, P1: toks.map((t, j) => (j === i ? { ...t, pitch: { step: "B", alter: 0, octave: 5 } } : t)) } })) };
    assert(contentFingerprintOf({ ...a, song: song2 as typeof a.song }) !== fp, "改了一个音");
    assert(contentFingerprintOf({ ...a, extras: withCalibration(a.extras, "r1", 2, "n") }) !== fp, "改了响度校准");
    assert(contentFingerprintOf({ ...a, extras: withRoleName(a.extras, "r1", "别人", "n") }) !== fp, "改了角色名（锁着）");
  });
  it("contentFingerprint 对原料的键顺序 / 排序不敏感", () => {
    const base = { papers: { p2: "<b/>", p1: "<a/>" }, scoreExt: `{"version":2,"view":{"scope":"all"},"papers":[]}`, lounge: { r2: "{}", r1: "{\"a\":1}" }, studio: "{\"tracks\":[]}", sounds: ["b", "a"], thumbnail: null };
    const same = { papers: { p1: "<a/>", p2: "<b/>" }, scoreExt: `{"version":2,"papers":[]}`, lounge: { r1: "{\"a\":1}", r2: "{}" }, studio: "{\"tracks\":[]}", sounds: ["a", "b"], thumbnail: null };
    eq(contentFingerprint(base), contentFingerprint(same));
  });
});

describe("老文件里带着的那份 mp3（退役的定稿）", () => {
  /** 造一份「旧版本定稿过」的文件：把这一版存出来的歌拆开，score.json 按 edit 改成老写法，再按文件原文算指纹，把定稿记录和 mp3 放进去（旧版 app 就是这么写的）。 */
  const oldFile = (edit: (sj: Record<string, unknown>) => void = () => {}, editXml: (xml: string) => string = (x) => x, rev = 3): Uint8Array => {
    const z = unzipSync(saveMxl(ARGS())) as Record<string, Uint8Array>, sjPath = ".moonsinger/score.json", sj = JSON.parse(strFromU8(z[sjPath])) as Record<string, unknown>;
    edit(sj); z[sjPath] = strToU8(JSON.stringify(sj, null, 2) + "\n");
    const papers: Record<string, string> = {}, lounge: Record<string, string> = {};
    for (const p of sj.papers as { id: string; file: string }[]) { z[p.file] = strToU8(editXml(strFromU8(z[p.file]))); papers[p.id] = strFromU8(z[p.file]); }
    const noStamp = (t: string) => { const { minor: _m, patch: _p, ...rest } = JSON.parse(t) as Record<string, unknown>; return JSON.stringify(rest, null, 2) + "\n"; };
    for (const k of Object.keys(z)) { const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(k); if (m) lounge[m[1]] = noStamp(strFromU8(z[k])); }
    const fp = contentFingerprint({ papers, scoreExt: noStamp(strFromU8(z[sjPath])), lounge, studio: noStamp(strFromU8(z[".moonsinger/studio.json"])), sounds: Object.keys(z).filter((k) => k.startsWith(".moonsinger/sounds/")), thumbnail: z["Thumbnails/thumbnail.png"] ?? null });
    const mf = JSON.parse(strFromU8(z[".moonsinger/manifest.json"])) as Record<string, unknown>;
    mf.final = record(fp, MP3, rev); mf.finalRev = rev; z[".moonsinger/manifest.json"] = strToU8(JSON.stringify(mf, null, 2) + "\n"); z[FINAL_MP3_ENTRY] = MP3;
    return zipSync(z);
  };
  const resave = (o: ReturnType<typeof openBytes>) => saveMxl({ song: o.song, extras: o.extras, app: "test", date: "2026-11-10T00:00:00.000Z", view: o.view ?? undefined });
  it("读得开：那份 mp3 和它的记录都不读（第 16 条 16-3，user「MP3 也不要」）——不交给宿主、不进「不认识的文件」，歌本身照常，不报任何话", () => {
    const o = openBytes("x.mxl", oldFile());
    eq(o.notices.length, 0, o.notices.join(" | ")); assert(o.ours, "还是自家的文件");
    assert(!("legacyMp3" in o), "不交给宿主");
    for (const k of ["final", "finalMp3", "finalRev"]) assert(!(k in o.extras), `Extras 里不再有 ${k}`);
    assert(!Object.keys(o.extras.unknown).includes(FINAL_MP3_ENTRY), "mp3 不进「不认识的文件」（不然会原样写回去）");
  });
  it("再存：歌文件里不再有那份 mp3，总目录里不再有 final / finalRev（user 11-10「以后统一不存mp3，旧的也删掉」）", () => {
    const o = openBytes("x.mxl", oldFile()), z = unzipSync(resave(o)), m = JSON.parse(strFromU8(z[".moonsinger/manifest.json"]));
    eq(z[FINAL_MP3_ENTRY], undefined, "entry 没了"); eq(m.final, undefined); eq(m.finalRev, undefined);
    eq(openBytes("x.mxl", zipSync(z as Record<string, Uint8Array>)).notices.length, 0);
  });
  it("这一版存的歌：总目录里没有 final / finalRev、zip 里没有 mp3；Extras 的空壳里也没有这三样", () => {
    const files = unzipSync(saveMxl(ARGS())), m = JSON.parse(strFromU8(files[".moonsinger/manifest.json"]));
    eq(m.final, undefined); eq(m.finalRev, undefined); eq(files[FINAL_MP3_ENTRY], undefined);
    eq(Object.keys(emptyExtras()).sort().join(), "lounge,rootfiles,sounds,thumbnail,unknown");
  });
  it("存盘那一趟顺手带回指纹：和 contentFingerprintOf 一样，字节和 saveMxl 一样", () => {
    const a = ARGS(), r = saveMxlWithFingerprint(a);
    eq(r.fingerprint, contentFingerprintOf(a)); eq(sha256HexSync(r.bytes), sha256HexSync(saveMxl(a)));
  });
});
