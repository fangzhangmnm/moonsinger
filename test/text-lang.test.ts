// 谱上的字用哪种语言（施工单 12-4；user「页面设置是不是也应该有一个语言，影响打印？还是打印的时候自己调语言？think critically about it」，统筹定 = 歌里一项）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
// 守：① 进门那一处定没写的意思（兼容老文件的规矩）：老文件 / 别家的谱 / 新歌 = "ui"（跟着界面），歌里永远有值；写了的原样留着、不认识的写回去；跟着界面写 "ui"（第 16 条 16-3 起每样都写）。
//     ② 排版：印出来的字（「编排」、换气后面的「吸 / 深吸」）按这一项；不印的提示照旧按界面语言（opts.locale）。跟着界面 = 和原来一模一样。
//     ③ 修改锁：改这一项算「看法」（songLook 的核验认它；顺手动了别的 = 不认）。
import { describe, it, eq, assert } from "./runner.mjs";
import { setTextLang, textLangIn } from "../src/score/song-view.ts";
import { lookOf } from "../src/look/index.ts";
import { emptySong, initState, type Song } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { sameExceptSongView } from "../src/app/edit-lock-table.ts";
import { engrave } from "../src/render/engrave.ts";
import { editorBase, asFrozen } from "./fixtures/layout/cases.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";

const fs = (await import("node:fs" as string)) as { readFileSync(p: URL): Uint8Array };
const ROOT = new URL("../", import.meta.url);
const bytesOf = (rel: string) => new Uint8Array(fs.readFileSync(new URL(rel, ROOT)));
const save = (s: Song) => saveMxl({ song: s, extras: emptyExtras(), app: "t", date: "2026-11-12T00:00:00.000Z" });
const scoreJson = (b: Uint8Array) => JSON.parse(strFromU8(unzipSync(b)[".moonsinger/score.json"]!));
const withScoreJson = (b: Uint8Array, f: (j: Record<string, any>) => void): Uint8Array => { const z = unzipSync(b), j = JSON.parse(strFromU8(z[".moonsinger/score.json"]!)); f(j); z[".moonsinger/score.json"] = strToU8(JSON.stringify(j)); return zipSync(z); };

describe("谱上的字：进门那一处定没写的意思（12-4）", () => {
  it("新歌明着写「跟着界面」", () => { eq(emptySong().textLang, "ui"); eq(initState().song.textLang, "ui"); });
  it("老文件（minor 9 写的，没有这个键）= 跟着界面，歌里有值", () => {
    const o = openBytes("sample.mxl", bytesOf("test/fixtures/format/minor/score-9/sample.mxl"));
    eq(o.song.textLang, "ui"); eq(lookOf(o.song).textLang, "ui");
  });
  it("冻结样本 minor 10（写的 en）读回来 = en", () => {
    const o = openBytes("sample.mxl", bytesOf("test/fixtures/format/minor/score-10/sample.mxl"));
    eq(o.song.textLang, "en"); eq(lookOf(o.song).textLang, "en");
  });
  it("跟着界面也明写 \"ui\"（第 16 条 16-3）；写了一种语言 = 原样写、原样读回", () => {
    const s = emptySong();
    eq(scoreJson(save(s)).textLang, "ui", "跟着界面 = 写 ui");
    const b = save({ ...s, textLang: "zh" });
    eq(scoreJson(b).textLang, "zh"); eq(openBytes("x.mxl", b).song.textLang, "zh");
  });
  it("别家的 MusicXML（没有 score.json）= 跟着界面", () => {
    const xml = strFromU8(unzipSync(save(emptySong()))["score.musicxml"]!);
    eq(openBytes("x.musicxml", strToU8(xml)).song.textLang, "ui");
  });
  it("不认识的值（更新的版本写的）：原样留在歌里、存回去，画的时候当跟着界面；空串 / 不是字 = 跟着界面", () => {
    const b = withScoreJson(save(emptySong()), (j) => { j.textLang = "ja"; j.minor = 999; }), o = openBytes("x.mxl", b);   // 比这一版新的那一份（16-4 A3：只有它的怪值原样留）
    eq(openBytes("x.mxl", withScoreJson(save(emptySong()), (j) => { j.textLang = "ja"; })).song.textLang, "ui", "不比这一版新的 = 读成新建的那一个");
    eq(o.song.textLang, "ja"); eq(lookOf(o.song).textLang, "ui");
    eq(scoreJson(save(o.song)).textLang, "ja", "写回去");
    for (const bad of ["", 3, null]) eq(openBytes("x.mxl", withScoreJson(save(emptySong()), (j) => { j.textLang = bad; })).song.textLang, "ui", `textLang = ${JSON.stringify(bad)}`);
  });
  it("textLangIn：写了一种 = 那一种；跟着界面 = 交进来的界面语言", () => {
    eq(textLangIn({ textLang: "en" }, "zh"), "en"); eq(textLangIn({ textLang: "ui" }, "zh"), "zh"); eq(textLangIn({ textLang: "ui" }, "en"), "en");
  });
});

describe("谱上的字：排版只让印出来的字跟它（12-4）", () => {
  const texts = (song: Song, cls: RegExp) => engrave(song, editorBase(song, song.parts.map((p) => p.id))).prims.filter((p) => p.t === "text" && cls.test(p.cls ?? "")).map((p) => (p as { s?: string }).s);
  const base = asFrozen(fullSong());
  it("跟着界面（界面 = 中文）：「编排」「吸」「深吸」都是中文——和这一项出来之前一样", () => {
    assert(texts(base, /arr-label/).some((s) => /编排/.test(s ?? "")), "编排标签是中文");
    const br = texts(base, /breath-label/); assert(br.includes("吸") && br.includes("深吸"), `换气的字：${br.join(",")}`);
  });
  it("谱上的字 = English（界面还是中文）：印出来的字换成英文", () => {
    const s = { ...base, textLang: "en" };
    assert(texts(s, /arr-label/).some((x) => /Arrangement/.test(x ?? "")), `编排标签：${texts(s, /arr-label/).join(",")}`);
    const br = texts(s, /breath-label/); assert(br.includes("in") && br.includes("deep in") && !br.includes("吸"), `换气的字：${br.join(",")}`);
  });
  it("不印的提示照旧跟界面：谱上的字 = English 时，「演奏法和表情：不显示」那行淡字还是中文", () => {
    const s = { ...base, textLang: "en", expressions: false as const }, L = engrave(s, editorBase(s, s.parts.map((p) => p.id)));
    const st = L.statusHints.flatMap((h) => h.items.map((i) => i.s)).join(" | ");
    assert(/演奏法和表情：不显示/.test(st), `提示：${st}`);
  });
});

describe("谱上的字：修改锁算「看法」（12-4）", () => {
  it("只改这一项 = 看法的核验认；顺手改了歌名 = 不认", () => {
    const st = initState(), next = setTextLang(st, "en");
    assert(next.song !== st.song && sameExceptSongView(st.song, next.song), "只改谱上的字");
    assert(!sameExceptSongView(st.song, { ...next.song, title: "x" }), "顺手改歌名不算看法");
    eq(setTextLang(st, "ui"), st, "没变 = 原样返回");
  });
});
