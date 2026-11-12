// 「这首歌怎么看」存进歌文件（谱面分家第三刀，score minor 5；src/score/song-view.ts + src/format/project.ts）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   施工单第三节「3」：没写的意思冻住（谱种没写 = 五线谱、和弦标级数没写 = 标、按 C 调看没写 = 不按、每轨和弦选项没写 = auto），读写两头都不许「没写就取 app 现在的默认」；
//   只写不是缺省的；brokenChords: false（minor 2–4）读成 "stacked"；不认识的值原样带回；新建的歌四样都不写；设备上原来那两个键不再读。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string; readdirSync(p: URL, o?: object): string[] };
import { paperOf, DEFAULT_PAPER } from "../src/score/paper.ts";
import { describe, it, eq, assert } from "./runner.mjs";
import { songViewOf, setNotation, setChordTags, setViewInC, setPartChords, setExpressions, UNWRITTEN } from "../src/score/song-view.ts";
import { initState, type Song } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { FORMAT_MINOR } from "../src/format/contract.ts";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";

const ROOT = new URL("../", import.meta.url);
const bytesOf = (rel: string) => new Uint8Array(fs.readFileSync(new URL(rel, ROOT)));
const save = (s: Song) => saveMxl({ song: s, hum: s.hum, extras: emptyExtras(), app: "t", date: "2026-11-11T00:00:00.000Z" });
const scoreJson = (b: Uint8Array) => JSON.parse(strFromU8(unzipSync(b)[".moonsinger/score.json"]!));
/** 改一份 .mxl 里的 score.json（模拟别的版本写的文件）。 */
const withScoreJson = (b: Uint8Array, f: (j: Record<string, any>) => void): Uint8Array => { const z = unzipSync(b), j = JSON.parse(strFromU8(z[".moonsinger/score.json"]!)); f(j); z[".moonsinger/score.json"] = strToU8(JSON.stringify(j)); return zipSync(z); };
const viewOf = (s: Song) => { const v = songViewOf(s); return { notation: v.notation, chordTags: v.chordTags, viewInC: v.viewInC, chords: s.parts.map((p) => v.chordsOf(p.id)).join(",") }; };

describe("这首歌怎么看：没写的意思冻住", () => {
  it("没写 = 五线谱 / 标和弦级数 / 不按 C 调看 / 也认拆开弹的（写死的值，不随 app 的新文档默认变）；新建的歌四样都不写，存出去也不写", () => {
    eq(JSON.stringify(UNWRITTEN), JSON.stringify({ notation: "staff", chordTags: true, viewInC: false, chords: "auto", density: "cozy", lyricFit: "rhythm", barNumbers: true, middleC: 4, expressions: true }), "改了这些值 = 改了所有旧歌的样子（后三样第四刀 4-5 收进来，是原来就有的意思）");
    { const v = songViewOf(initState().song); eq([v.density, v.lyricFit, v.barNumbers].join(","), "cozy,rhythm,true", "版式 / 歌词排法 / 小节号没写 = 舒适 / 按节奏 / 每行开头印");
      const w = songViewOf({ ...initState().song, lyricFit: "lyrics", barNumbers: "off", paper: { ...initState().song.paper ?? paperOf(DEFAULT_PAPER), density: "compact" } });
      eq([w.density, w.lyricFit, w.barNumbers].join(","), "compact,lyrics,false", "写了 = 照写的读"); }
    { const st = setViewInC(initState(), true);
      eq([songViewOf(st.song).viewInC, songViewOf(st.song).inCActive].join(","), "true,true", "五线谱：按 C 调看起作用");
      const j = setNotation(st, "jianpu");
      eq([songViewOf(j.song).viewInC, songViewOf(j.song).inCActive].join(","), "true,false", "简谱（首调）：存着的值不动，但不起作用"); }
    const st = initState();
    for (const k of ["notation", "chordTags", "viewInC"]) assert(!(k in st.song), `新建的歌不写 ${k}`);
    assert(st.song.parts.every((p) => !("chords" in p)), "新建的歌不写声部的 chords");
    eq(JSON.stringify(viewOf(st.song)), JSON.stringify({ notation: "staff", chordTags: true, viewInC: false, chords: "auto" }));
    const j = scoreJson(save(st.song));
    for (const k of ["notation", "chordTags", "viewInC"]) assert(!(k in j), `存出去不写 ${k}`);
    assert(j.parts.every((p: object) => !("chords" in p) && !("brokenChords" in p)), "存出去不写声部的 chords / brokenChords");
  });
  it("这一刀之前存的歌（冻结样本 v2-2-2-2、真歌 Once upon a Tale，都没有这四样）读出来 = 没写的意思", () => {
    for (const f of ["test/fixtures/format/v2-2-2-2/sample.mxl", "test/fixtures/songs/once-upon-a-tale.mxl"]) {
      const o = openBytes("x.mxl", bytesOf(f)), v = viewOf(o.song);
      eq(`${v.notation},${v.chordTags},${v.viewInC}`, "staff,true,false", f);
      assert(v.chords.split(",").every((c) => c === "auto"), `${f}：${v.chords}`);
    }
  });
  it("不读设备上原来那两个键（device-kv view-in-c / chord-tags）：src 里的代码不再出现它们", () => {
    const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const walk = (d: string): string[] => fs.readdirSync(new URL(d, ROOT), { withFileTypes: true } as object).flatMap((e: any) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    for (const f of walk("src/")) { const c = code(fs.readFileSync(new URL(f, ROOT), "utf8")); assert(!/["']view-in-c["']|["']chord-tags["']/.test(c), `${f} 还在读设备上的旧键`); }
  });
});

describe("这首歌怎么看：读写", () => {
  it("只写不是缺省的：四样各切成非缺省 → score.json 里有、读回来一样；切回缺省 → 键没了（不写 \"staff\" / true / false / \"auto\"）", () => {
    let st = initState(); const part = st.song.parts[0]!.id;
    st = setPartChords(setViewInC(setChordTags(setNotation(st, "jianpu"), false), true), part, "stacked");
    const j = scoreJson(save(st.song));
    eq(`${j.notation},${j.chordTags},${j.viewInC},${j.parts[0].chords}`, "jianpu,false,true,stacked");
    const back = openBytes("x.mxl", save(st.song)).song;
    eq(JSON.stringify(viewOf(back)), JSON.stringify(viewOf(st.song)));
    const def = setPartChords(setViewInC(setChordTags(setNotation(st, "staff"), true), false), part, "auto");
    const j2 = scoreJson(save(def.song));
    for (const k of ["notation", "chordTags", "viewInC"]) assert(!(k in j2), `切回缺省 = 不写 ${k}`);
    assert(!("chords" in j2.parts[0]));
    const s0 = initState(); eq(setChordTags(s0, true), s0, "本来就是缺省 = 原样（同一个引用）"); eq(setViewInC(s0, false), s0); eq(setNotation(s0, "staff"), s0); eq(setPartChords(s0, part, "auto"), s0);
  });
  it("演奏法和表情（7-G，score minor 8）：只写 false = 不显示；切回显示 = 键没了；别的值（true / 字符串）= 没写 = 显示、不写回；读回来一样", () => {
    const st = setExpressions(initState(), false);
    eq(scoreJson(save(st.song)).expressions, false); eq(songViewOf(st.song).expressions, false);
    eq(songViewOf(openBytes("x.mxl", save(st.song)).song).expressions, false, "读回来还是不显示");
    assert(!("expressions" in scoreJson(save(setExpressions(st, true).song))), "切回显示 = 不写");
    const s0 = initState(); eq(setExpressions(s0, true), s0, "本来就是显示 = 原样（同一个引用）");
    for (const odd of [true, "off", 0]) {
      const o = openBytes("x.mxl", withScoreJson(save(s0.song), (j) => { j.expressions = odd; }));
      eq(songViewOf(o.song).expressions, true, `写成 ${JSON.stringify(odd)} = 没写 = 显示`); assert(!("expressions" in scoreJson(save(o.song))), "不写回");
    }
  });
  it("冻结样本 score minor 8（7-G）：演奏法和表情不显示读得出来；再存一遍还一样；旧样本（score-7）读出来 = 显示", () => {
    const exp = JSON.parse(fs.readFileSync(new URL("test/fixtures/format/minor/score-8/expected.json", ROOT), "utf8"));
    const b = bytesOf("test/fixtures/format/minor/score-8/sample.mxl"), o = openBytes("sample.mxl", b), v = songViewOf(o.song);
    eq(scoreJson(b).minor, 8); assert(FORMAT_MINOR.score >= 8);
    eq(exp.songView.expressions, false); eq(v.expressions, false); eq(scoreJson(b).expressions, false);
    const again = openBytes("x.mxl", saveMxl({ song: o.song, hum: o.song.hum, extras: o.extras, app: "t", date: "2026-11-12T00:00:00.000Z" })).song;
    eq(songViewOf(again).expressions, false);
    eq(songViewOf(openBytes("sample.mxl", bytesOf("test/fixtures/format/minor/score-7/sample.mxl")).song).expressions, true, "minor 7 写的：没有这个键 = 显示");
  });
  it("老写法 brokenChords: false（score minor 2–4）读成 \"stacked\"；再存 = 写新键、老键不再写", () => {
    const st = initState(), part = st.song.parts[0]!.id;
    const old = withScoreJson(save(st.song), (j) => { j.minor = 4; j.parts[0].brokenChords = false; });
    const o = openBytes("x.mxl", old);
    eq(songViewOf(o.song).chordsOf(part), "stacked");
    const j = scoreJson(save(o.song));
    eq(j.parts[0].chords, "stacked"); assert(!("brokenChords" in j.parts[0]), "老键不再写");
  });
  it("不认识的值（更新的版本写的）原样带回，画的时候按没写的意思；写坏了的值（类型不对）当没写", () => {
    const st = initState(), part = st.song.parts[0]!.id;
    const newer = withScoreJson(save(st.song), (j) => { j.notation = "figures"; j.parts[0].chords = "tabs"; });
    const o = openBytes("x.mxl", newer);
    eq(`${songViewOf(o.song).notation},${songViewOf(o.song).chordsOf(part)}`, "staff,auto", "画法按没写的意思");
    const j = scoreJson(save(o.song)); eq(`${j.notation},${j.parts[0].chords}`, "figures,tabs", "原样带回");
    const bad = openBytes("x.mxl", withScoreJson(save(st.song), (j) => { j.chordTags = "no"; j.viewInC = 1; j.notation = ""; }));
    eq(JSON.stringify(viewOf(bad.song)), JSON.stringify({ notation: "staff", chordTags: true, viewInC: false, chords: "auto" }));
    const jb = scoreJson(save(bad.song)); for (const k of ["notation", "chordTags", "viewInC"]) assert(!(k in jb), `写坏的 ${k} 不写回`);
  });
  it("冻结样本 score minor 6（7-B 字母谱）：notation = letters、中央 C 叫 C3 读得出来；再存一遍还一样；按 C 调看存着开、在字母谱下不起作用", () => {
    const exp = JSON.parse(fs.readFileSync(new URL("test/fixtures/format/minor/score-6/expected.json", ROOT), "utf8"));
    const b = bytesOf("test/fixtures/format/minor/score-6/sample.mxl"), o = openBytes("sample.mxl", b), v = songViewOf(o.song);
    eq(scoreJson(b).minor, 6); assert(FORMAT_MINOR.score >= 6);
    eq(exp.songView.notation, "letters"); eq(v.notation, "letters");
    eq(JSON.stringify({ notation: v.notation, chordTags: v.chordTags, viewInC: v.viewInC, chords: Object.fromEntries(o.song.parts.map((p) => [p.id, v.chordsOf(p.id)])) }), JSON.stringify(exp.songView));
    eq(v.viewInC, true); eq(v.inCActive, false, "字母谱写的是实际的音：按 C 调看不起作用（存着的值不动）");
    eq(v.middleC, 3, "中央 C 叫 C3（样本存的）"); eq(scoreJson(b).middleC, 3);
    const again = openBytes("x.mxl", saveMxl({ song: o.song, hum: o.song.hum, extras: o.extras, app: "t", date: "2026-11-11T00:00:00.000Z" })).song;
    eq(JSON.stringify(viewOf(again)), JSON.stringify(viewOf(o.song)));
  });
  it("冻结样本 score minor 5（这一刀写的，四样都用上）：读出来和冻的时候一样；再存一遍还是这四样", () => {
    const exp = JSON.parse(fs.readFileSync(new URL("test/fixtures/format/minor/score-5/expected.json", ROOT), "utf8"));
    const b = bytesOf("test/fixtures/format/minor/score-5/sample.mxl"), o = openBytes("sample.mxl", b), v = songViewOf(o.song);
    eq(scoreJson(b).minor, 5); assert(FORMAT_MINOR.score >= 5);
    eq(JSON.stringify({ notation: v.notation, chordTags: v.chordTags, viewInC: v.viewInC, chords: Object.fromEntries(o.song.parts.map((p) => [p.id, v.chordsOf(p.id)])) }), JSON.stringify(exp.songView));
    const again = openBytes("x.mxl", saveMxl({ song: o.song, hum: o.song.hum, extras: o.extras, app: "t", date: "2026-11-11T00:00:00.000Z" })).song;
    eq(JSON.stringify(viewOf(again)), JSON.stringify(viewOf(o.song)));
  });
});
