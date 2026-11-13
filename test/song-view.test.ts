// 「这首歌怎么看」存进歌文件（谱面分家第三刀，score minor 5；src/score/song-view.ts + src/format/project.ts）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   施工单第三节「3」：没写的意思冻住（谱种没写 = 五线谱、和弦标级数没写 = 标、按 C 调看没写 = 不按、每轨和弦选项没写 = auto），读写两头都不许「没写就取 app 现在的默认」；
//   第 16 条 16-3 起存的时候每样都写；brokenChords: false（minor 2–4）读成 "stacked"；比这一版新的文件里不认识的值原样带回；新建的歌按 NEW_SONG_LOOK 都写（16-4 A3）；设备上原来那两个键不再读。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string; readdirSync(p: URL, o?: object): string[] };
import { describe, it, eq, assert } from "./runner.mjs";
import { setNotation, setChordTags, setViewInC, setPartChords, setExpressions } from "../src/score/song-view.ts";
import { lookOf, followDefault } from "../src/look/index.ts";
import { NEW_SONG_LOOK } from "../src/score/song.ts";
import { initState, type Song } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { FORMAT_MINOR } from "../src/format/contract.ts";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";

const ROOT = new URL("../", import.meta.url);
const bytesOf = (rel: string) => new Uint8Array(fs.readFileSync(new URL(rel, ROOT)));
const save = (s: Song) => saveMxl({ song: s, extras: emptyExtras(), app: "t", date: "2026-11-11T00:00:00.000Z" });
const scoreJson = (b: Uint8Array) => JSON.parse(strFromU8(unzipSync(b)[".moonsinger/score.json"]!));
/** 改一份 .mxl 里的 score.json（模拟别的版本写的文件）。 */
const withScoreJson = (b: Uint8Array, f: (j: Record<string, any>) => void): Uint8Array => { const z = unzipSync(b), j = JSON.parse(strFromU8(z[".moonsinger/score.json"]!)); f(j); z[".moonsinger/score.json"] = strToU8(JSON.stringify(j)); return zipSync(z); };
const viewOf = (s: Song) => { const v = lookOf(s); return { notation: v.notation, chordTags: v.chordTags, viewInC: v.viewInC, chords: s.parts.map((p) => v.chordsOf(p.id)).join(",") }; };

describe("这首歌怎么看：新建的歌跟着软件（第 17 条 17-1）", () => {
  it("新建的歌每一项都是 \"default\"（跟着软件），现在画成五线谱 / 标和弦级数 / 不按 C 调看 / 也认拆开弹的（\"default\" 现在等于什么在 src/look）；存出去明写 \"default\"", () => {
    eq(JSON.stringify(NEW_SONG_LOOK), JSON.stringify({ arrangement: "", lyricFit: "default", barNumbers: "default", notation: "default", chordTags: "default", viewInC: "default", middleC: "default", expressions: "default", textLang: "ui", paper: "default", density: "default", staffMm: "default", marginMm: "default" }), "改了这些值 = 改了所有旧歌的样子（后三样第四刀 4-5 收进来，是原来就有的意思）");
    { const v = lookOf(initState().song); eq([v.density, v.lyricFit, v.barNumbers].join(","), "cozy,rhythm,true", "版式 / 歌词排法 / 小节号没写 = 舒适 / 按节奏 / 每行开头印");
      const w = lookOf({ ...initState().song, lyricFit: "lyrics", barNumbers: "off", density: "compact" });
      eq([w.density, w.lyricFit, w.barNumbers].join(","), "compact,lyrics,false", "写了 = 照写的读"); }
    { const st = setViewInC(initState(), true);
      eq([lookOf(st.song).viewInC, lookOf(st.song).inCActive].join(","), "true,true", "五线谱：按 C 调看起作用");
      const j = setNotation(st, "jianpu");
      eq([lookOf(j.song).viewInC, lookOf(j.song).inCActive].join(","), "true,false", "简谱（首调）：存着的值不动，但不起作用"); }
    const st = initState();
    for (const k of ["notation", "chordTags", "viewInC"] as const) eq(st.song[k], "default", `新建的歌 ${k} 跟着软件（17-1）`);
    assert(st.song.parts.every((p) => !("chords" in p)), "新建的歌不写声部的 chords");
    eq(JSON.stringify(viewOf(st.song)), JSON.stringify({ notation: "staff", chordTags: true, viewInC: false, chords: "auto" }));
    const j = scoreJson(save(st.song));
    eq(`${j.notation},${j.chordTags},${j.viewInC}`, "default,default,default", "存出去明写跟着软件");
    assert(j.parts.every((p: Record<string, unknown>) => p.chords === "auto" && !("brokenChords" in p)), "存出去每个声部写 chords: auto、不写退役的 brokenChords");
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
  it("四样各切成非缺省 → score.json 里有、读回来一样；切回缺省 → 照样写（staff / true / false / auto；第 16 条 16-3）", () => {
    let st = initState(); const part = st.song.parts[0]!.id;
    st = setPartChords(setViewInC(setChordTags(setNotation(st, "jianpu"), false), true), part, "stacked");
    const j = scoreJson(save(st.song));
    eq(`${j.notation},${j.chordTags},${j.viewInC},${j.parts[0].chords}`, "jianpu,false,true,stacked");
    const back = openBytes("x.mxl", save(st.song)).song;
    eq(JSON.stringify(viewOf(back)), JSON.stringify(viewOf(st.song)));
    const def = setPartChords(setViewInC(setChordTags(setNotation(st, "staff"), true), false), part, "auto");
    const j2 = scoreJson(save(def.song));
    eq(`${j2.notation},${j2.chordTags},${j2.viewInC},${j2.parts[0].chords}`, "staff,true,false,auto", "切回缺省 = 写缺省值");
    const s0 = initState(); eq(setChordTags(s0, true).song.chordTags, true, "17-1：选了现在的默认那一个也是选过的（写具体的值）"); eq(setNotation(s0, "staff").song.notation, "staff"); eq(setPartChords(s0, part, "auto"), s0, "和弦选项照旧：auto = 不存");
    eq(followDefault(setChordTags(s0, false).song, "chordTags").chordTags, "default", "选「跟着软件」= 写回 default");
  });
  it("演奏法和表情（7-G，score minor 8）：false = 不显示、true = 显示，都写；别的值（字符串 / 数）读成显示、存时写 true；读回来一样", () => {
    const st = setExpressions(initState(), false);
    eq(scoreJson(save(st.song)).expressions, false); eq(lookOf(st.song).expressions, false);
    eq(lookOf(openBytes("x.mxl", save(st.song)).song).expressions, false, "读回来还是不显示");
    eq(scoreJson(save(setExpressions(st, true).song)).expressions, true, "切回显示 = 写 true");
    const s0 = initState(); eq(setExpressions(s0, true).song.expressions, true, "17-1：选了显示 = 写 true（选过的）");
    for (const odd of [true, "off", 0]) {
      const o = openBytes("x.mxl", withScoreJson(save(s0.song), (j) => { j.expressions = odd; }));
      eq(lookOf(o.song).expressions, true, `写成 ${JSON.stringify(odd)} = 显示`); eq(scoreJson(save(o.song)).expressions, odd === true ? true : "default", "写坏的读成跟着软件、存的时候明写 default");
    }
  });
  it("冻结样本 score minor 8（7-G）：演奏法和表情不显示读得出来；再存一遍还一样；旧样本（score-7）读出来 = 显示", () => {
    const exp = JSON.parse(fs.readFileSync(new URL("test/fixtures/format/minor/score-8/expected.json", ROOT), "utf8"));
    const b = bytesOf("test/fixtures/format/minor/score-8/sample.mxl"), o = openBytes("sample.mxl", b), v = lookOf(o.song);
    eq(scoreJson(b).minor, 8); assert(FORMAT_MINOR.score >= 8);
    eq(exp.songView.expressions, false); eq(v.expressions, false); eq(scoreJson(b).expressions, false);
    const again = openBytes("x.mxl", saveMxl({ song: o.song, extras: o.extras, app: "t", date: "2026-11-12T00:00:00.000Z" })).song;
    eq(lookOf(again).expressions, false);
    eq(lookOf(openBytes("sample.mxl", bytesOf("test/fixtures/format/minor/score-7/sample.mxl")).song).expressions, true, "minor 7 写的：没有这个键 = 显示");
  });
  it("老写法 brokenChords: false（score minor 2–4）：退役的键读的时候不理（第 16 条：不再换成 \"stacked\"）= 自动；再存不写这个老键", () => {
    const st = initState(), part = st.song.parts[0]!.id;
    const old = withScoreJson(save(st.song), (j) => { j.minor = 4; j.parts[0].brokenChords = false; });
    const o = openBytes("x.mxl", old);
    eq(lookOf(o.song).chordsOf(part), "auto");
    const j = scoreJson(save(o.song));
    assert(!("brokenChords" in j.parts[0]), "老键不再写");
  });
  it("不认识的值（更新的版本写的）原样带回，画的时候按没写的意思；写坏了的值（类型不对）当没写", () => {
    const st = initState(), part = st.song.parts[0]!.id;
    const newer = withScoreJson(save(st.song), (j) => { j.notation = "figures"; j.parts[0].chords = "tabs"; j.minor = 999; });   // 比这一版新的那一份（统筹「A3 的三问」：只有它的怪值原样留）
    const o = openBytes("x.mxl", newer);
    eq(`${lookOf(o.song).notation},${lookOf(o.song).chordsOf(part)}`, "staff,auto", "画法按最基本的那一档");
    assert(o.notices.some((x) => x.includes("谱种")), "打开时说一句");
    { const same = openBytes("x.mxl", withScoreJson(save(st.song), (j) => { j.notation = "figures"; })); eq(same.song.notation, "default", "不比这一版新的怪值 = 读成跟着软件（17-1：补的是 default 这个字）、不说"); eq(same.notices.length, 0); }
    const j = scoreJson(save(o.song)); eq(`${j.notation},${j.parts[0].chords}`, "figures,tabs", "原样带回");
    const bad = openBytes("x.mxl", withScoreJson(save(st.song), (j) => { j.chordTags = "no"; j.viewInC = 1; j.notation = ""; }));
    eq(JSON.stringify(viewOf(bad.song)), JSON.stringify({ notation: "staff", chordTags: true, viewInC: false, chords: "auto" }));
    const jb = scoreJson(save(bad.song)); eq(`${jb.notation},${jb.chordTags},${jb.viewInC}`, "default,default,default", "写坏的读成跟着软件、存时写 default");
  });
  it("冻结样本 score minor 6（7-B 字母谱）：notation = letters、中央 C 叫 C3 读得出来；再存一遍还一样；按 C 调看存着开、在字母谱下不起作用", () => {
    const exp = JSON.parse(fs.readFileSync(new URL("test/fixtures/format/minor/score-6/expected.json", ROOT), "utf8"));
    const b = bytesOf("test/fixtures/format/minor/score-6/sample.mxl"), o = openBytes("sample.mxl", b), v = lookOf(o.song);
    eq(scoreJson(b).minor, 6); assert(FORMAT_MINOR.score >= 6);
    eq(exp.songView.notation, "letters"); eq(v.notation, "letters");
    eq(JSON.stringify({ notation: v.notation, chordTags: v.chordTags, viewInC: v.viewInC, chords: Object.fromEntries(o.song.parts.map((p) => [p.id, v.chordsOf(p.id)])) }), JSON.stringify(exp.songView));
    eq(v.viewInC, true); eq(v.inCActive, false, "字母谱写的是实际的音：按 C 调看不起作用（存着的值不动）");
    eq(v.middleC, 3, "中央 C 叫 C3（样本存的）"); eq(scoreJson(b).middleC, 3);
    const again = openBytes("x.mxl", saveMxl({ song: o.song, extras: o.extras, app: "t", date: "2026-11-11T00:00:00.000Z" })).song;
    eq(JSON.stringify(viewOf(again)), JSON.stringify(viewOf(o.song)));
  });
  it("冻结样本 score minor 5（这一刀写的，四样都用上）：读出来和冻的时候一样；再存一遍还是这四样", () => {
    const exp = JSON.parse(fs.readFileSync(new URL("test/fixtures/format/minor/score-5/expected.json", ROOT), "utf8"));
    const b = bytesOf("test/fixtures/format/minor/score-5/sample.mxl"), o = openBytes("sample.mxl", b), v = lookOf(o.song);
    eq(scoreJson(b).minor, 5); assert(FORMAT_MINOR.score >= 5);
    eq(JSON.stringify({ notation: v.notation, chordTags: v.chordTags, viewInC: v.viewInC, chords: Object.fromEntries(o.song.parts.map((p) => [p.id, v.chordsOf(p.id)])) }), JSON.stringify(exp.songView));
    const again = openBytes("x.mxl", saveMxl({ song: o.song, extras: o.extras, app: "t", date: "2026-11-11T00:00:00.000Z" })).song;
    eq(JSON.stringify(viewOf(again)), JSON.stringify(viewOf(o.song)));
  });
});
