// 存档格式（.mxl）测试：自家文件原样复原、mimetype 规矩、不认识的东西原样写回、新版本拒开、别家文件尽量读且不自动选角。
// created 2026-10-07 by Claude Opus 5.5（数据契约草稿 ai-docs/20261007-data-contract-draft.md；无地逃生口）
import { DEFAULT_CONCEPT } from "../src/gm/default-concept.gen.ts";
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, type Song, type Token, firstTrack, songOf } from "../src/score/song.ts";
import { MELISMA_MARK } from "../src/score/lyrics.ts";
import { saveMxl, openBytes, emptyExtras, withActive, activeInstrument, activeHum, CANDIDATE_ID, FORMAT, type Extras } from "../src/format/project.ts";
import { zipSync, unzipSync, strToU8, strFromU8 } from "../vendor/fflate/fflate.esm.js";

const Q = TPQ, E = TPQ / 2, T3 = (TPQ / 2) * 2 / 3;   // 四分 / 八分 / 八分三连音
const p = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
/** 一首把能存的东西都用上的歌。 */
function bigSong(): Song {
  let id = 1;
  const t = (x: Omit<Token, "id"> & Record<string, unknown>) => ({ ...x, id: id++ }) as Token;
  return songOf([
    t({ kind: "key", fifths: 2 }), t({ kind: "time", beats: 3, beatType: 4 }), t({ kind: "tempo", bpm: 96 }),
    t({ kind: "note", pitch: p("F", 4, 1), dur: Q, lyric: "う" }),
    t({ kind: "note", pitch: p("A"), dur: E, lyric: "さ" }),
    t({ kind: "note", pitch: p("A"), dur: E, lyric: null, tie: true }),           // 连着前一个音
    t({ kind: "note", pitch: p("B"), dur: Q, lyric: MELISMA_MARK }),               // 拖腔
    t({ kind: "bar" }),                                                            // 人插的小节线（满）
    t({ kind: "note", pitch: p("D", 5), dur: T3, lyric: "hap", hyph: true }),      // 三连音 + 英文连字符
    t({ kind: "note", pitch: p("C", 5, 1), dur: T3, lyric: "py" }),
    t({ kind: "note", pitch: null, dur: T3, lyric: "爱" }),                        // 还没写音高
    t({ kind: "note", pitch: p("B"), dur: Q * 1.5, lyric: "你" }),                 // 附点四分
    t({ kind: "key", fifths: -1 }),                                                // 小节中间换调号
    t({ kind: "rest", dur: Q }),                                                   // 跨过自动小节线（休止也会拆）
    t({ kind: "note", pitch: p("F"), dur: Q * 3, lyric: "ね" }),                   // 跨过自动小节线 → 存时拆开、读回并回
    t({ kind: "tempo", bpm: 72 }),
    t({ kind: "time", beats: 4, beatType: 4 }),
    t({ kind: "note", pitch: p("G"), dur: Q, lyric: "る" }),
    t({ kind: "rest", dur: Q * 3 }),
    t({ kind: "bar" }),                                                            // 最后一条人插的
  ], { title: "測試"});
}
/** 比较用：小节线 / 记号的 id 是编辑器自己的（文件里不存），去掉；音符 / 休止的 id 要原样。 */
const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;
const norm = (s: Song) => JSON.stringify(canon(firstTrack(s).map((t) => (t.kind === "note" || t.kind === "rest" ? t : { ...t, id: 0 }))));
const save = (song: Song, extras = emptyExtras(), quality: "full" | "light" | "none" = "light") =>   // quality = 上场的：full 月读 / light 元音版 / none 不动 role.active
  saveMxl({ song, extras: quality === "none" ? extras : withActive(extras, "r1", quality === "full" ? CANDIDATE_ID.full : CANDIDATE_ID.light, "u"), app: "v0.0.0-test", date: "2026-10-07" });
const engineOf = (o: { extras: Extras }) => activeInstrument(o.extras, "r1")?.engine ?? "unknown";

describe("存档 .mxl", () => {
  it("自家文件：存了再开，每个 token 原样复原（连音、附点、连音线、人插 / 自动的小节线、跨小节的音、中途换记号、连字符、拖腔、没写音高）", () => {
    const song = bigSong(), bytes = save(song), o = openBytes("x.mxl", bytes);
    eq(norm(o.song), norm(song), "tokens");
    eq(activeHum(o.extras, "r1"), "u", "哼的字（只在乐手身上，第 16 条 16-3）"); eq(engineOf(o), "vowel-sampler", "上场的是元音版"); eq(o.song.title, "測試", "歌名"); eq(o.stem, "x", "文件名主干"); eq(o.ours, true, "认得是自家文件");
    eq(o.notices.length, 0, "自家文件没有提示");
    eq(norm(openBytes("x.mxl", save(o.song, o.extras)).song), norm(song), "再存一遍还一样");
  });
  it("mimetype 是第一个文件、不压缩（.mxl 规矩）", () => {
    const b = save(bigSong());
    eq(String.fromCharCode(...b.slice(0, 4)), "PK\x03\x04", "zip 本地文件头");
    eq(b[8] | (b[9] << 8), 0, "压缩方式 = 不压缩");
    eq(strFromU8(b.slice(30, 38)), "mimetype", "第一个文件名");
    eq(strFromU8(b.slice(38, 38 + 34)), "application/vnd.recordare.musicxml", "内容紧跟在文件名后");
  });
  it("主乐谱是标准 MusicXML：声部名 = 角色、乐器 = 上场的候选（GM 55 + 变体）、歌词每个音节写明唱的语言", () => {
    const xml = strFromU8(unzipSync(save(bigSong()))["score.musicxml"]);
    assert(xml.includes("<score-partwise version=\"4.0\">"), "partwise 4.0");
    assert(xml.includes(`<part-name>${DEFAULT_CONCEPT.score!.en}</part-name>`) && xml.includes("<instrument-sound>voice.vocals</instrument-sound>"), "声部名 = 显示的叫法（没起名字 = 乐器谱上的英文叫法，12-4）、乐器语义 = 官方 id");
    assert(xml.includes("<instrument-name>小月相（元音）</instrument-name>") && xml.includes("<midi-program>55</midi-program>") && xml.includes("<virtual-name>tsukuyomi-vowels</virtual-name>"), "乐器");
    for (const w of ["う", "さ", "hap", "py", "爱", "你", "ね", "る"]) assert(xml.includes(`xml:lang="ja">${w}</text>`), `xml:lang = 唱的那一段的语言（一段里有假名 = 日；第 16 条 16-3，和唱同一条规矩）：${w}`);
    assert(xml.includes("<syllabic>begin</syllabic><text xml:lang=\"ja\">hap</text>") && xml.includes("<syllabic>end</syllabic><text xml:lang=\"ja\">py</text>"), "syllabic");
    assert(xml.includes("<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>"), "三连音显示");
    assert(xml.includes(`<note id="n15">`) && xml.includes(`<note id="n15-2">`) && xml.includes(`<note id="r14-2">`), "跨小节的音 / 休止拆成两段");
  });
  it("同一版本的文件：现行格式里没有定义的（包里不认识的文件、角色 / 候选上不认识的键）存的时候不写；有定义的 engines（这台设备用不了的引擎配置）照写（第 16 条 16-3）", () => {
    const o = openBytes("x.mxl", save(bigSong()));
    o.extras.unknown["attachments/cover.png"] = new Uint8Array([1, 2, 3]);
    (o.extras.lounge.r1.candidates as Record<string, unknown>[])[0].engines = { ewql: { patch: "Soprano Legato", reverb: 0.3 } };
    (o.extras.lounge.r1.candidates as Record<string, unknown>[])[0].future = 1;
    o.extras.lounge.r1.future = { anything: true };
    const again = openBytes("x.mxl", save(o.song, o.extras));
    eq(again.extras.unknown["attachments/cover.png"], undefined, "挂件不写");
    eq(JSON.stringify((again.extras.lounge.r1.candidates as Record<string, unknown>[])[0].engines), JSON.stringify({ ewql: { patch: "Soprano Legato", reverb: 0.3 } }), "引擎配置（有定义的键）照写");
    eq((again.extras.lounge.r1.candidates as Record<string, unknown>[])[0].future, undefined, "候选上不认识的键不写");
    eq(again.extras.lounge.r1.future, undefined, "角色上不认识的键不写");
  });
  it("比这一版新（小版本更大）的那一份：不认识的原样带回，版本记号也照原样留；再开再存还在（统筹 2026-11-12 夜第一件）", () => {
    const files = unzipSync(save(bigSong()));
    const man = JSON.parse(strFromU8(files[".moonsinger/manifest.json"])); man.minor = (man.minor ?? 0) + 1; man.futureKey = 7;
    files[".moonsinger/manifest.json"] = strToU8(JSON.stringify(man)); files["attachments/cover.png"] = new Uint8Array([1, 2, 3]);
    const lp = Object.keys(files).find((k) => k.startsWith(".moonsinger/lounge/"))!;
    const role = JSON.parse(strFromU8(files[lp])); role.minor = (role.minor ?? 0) + 1; role.future = { anything: true }; role.candidates[0].future = 1;
    files[lp] = strToU8(JSON.stringify(role));
    const o = openBytes("x.mxl", zipSync(files)), out = unzipSync(save(o.song, o.extras, "none"));
    const man2 = JSON.parse(strFromU8(out[".moonsinger/manifest.json"])), role2 = JSON.parse(strFromU8(out[lp]));
    eq(`${man2.minor},${man2.futureKey},${Array.from(out["attachments/cover.png"] ?? []).join("")}`, `${man.minor},7,123`, "总目录：版本记号、不认识的键、包里不认识的文件");
    eq(`${role2.minor},${JSON.stringify(role2.future)},${role2.candidates[0].future}`, `${role.minor},{"anything":true},1`, "休息室：版本记号、角色 / 候选上不认识的键");
    const o2 = openBytes("x.mxl", zipSync(out)), out2 = unzipSync(save(o2.song, o2.extras, "none"));
    const man3 = JSON.parse(strFromU8(out2[".moonsinger/manifest.json"])), role3 = JSON.parse(strFromU8(out2[lp]));
    eq(`${man3.minor},${man3.futureKey},${out2["attachments/cover.png"]?.length},${role3.minor},${role3.candidates[0].future}`, `${man.minor},7,3,${role.minor},1`, "再开再存：都还在");
  });
  it("音符上不记语言（统筹 2026-11-12 夜第三件）：文件里每个音节的 xml:lang 读的时候不看——写成别的语言读进来也一样", () => {
    const files = unzipSync(save(bigSong())), x = strFromU8(files["score.musicxml"]).replace(/xml:lang="ja"/g, 'xml:lang="zh"');
    files["score.musicxml"] = strToU8(x);
    for (const p of Object.keys(files)) if (p.startsWith(".moonsinger/papers/")) files[p] = strToU8(strFromU8(files[p]).replace(/xml:lang="ja"/g, 'xml:lang="zh"'));
    const o = openBytes("x.mxl", zipSync(files));
    eq(norm(o.song), norm(bigSong())); assert(firstTrack(o.song).every((t) => !("lang" in t)), "没有一个音记着 lang");
  });
  it("比这一版新的文件：拒开、明说（打开再存会丢东西）", () => {
    const files = unzipSync(save(bigSong()));
    const man = JSON.parse(strFromU8(files[".moonsinger/manifest.json"])); man.version = FORMAT.manifest + 1;
    files[".moonsinger/manifest.json"] = strToU8(JSON.stringify(man));
    let msg = "";
    try { openBytes("x.mxl", zipSync(files)); } catch (e) { msg = (e as Error).message; }
    assert(msg.includes("更新版本") && msg.includes("没有打开"), `报错：${msg}`);
  });
});

const FOREIGN = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <movement-title>Twinkle</movement-title>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name><score-instrument id="P1-I1"><instrument-name>Piano</instrument-name></score-instrument>
      <midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>1</midi-program></midi-instrument></score-part>
    <score-part id="P2"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>100</per-minute></metronome></direction-type><sound tempo="100"/></direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><lyric number="1"><syllabic>single</syllabic><text>Twin</text></lyric></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>eighth</type></note>
      <note><rest/><duration>1</duration><voice>1</voice><type>eighth</type></note>
      <note><pitch><step>A</step><alter>-1</alter><octave>4</octave></pitch><duration>4</duration><voice>1</voice><type>half</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>8</duration><voice>1</voice><type>whole</type></note>
    </measure>
  </part>
  <part id="P2"><measure number="1"><note><rest/><duration>8</duration></note></measure></part>
</score-partwise>`;

describe("打开别的软件存的 MusicXML", () => {
  it("每个声部一串；小节都当人插的；读不了的数出来报给人", () => {
    const o = openBytes("twinkle.musicxml", strToU8(FOREIGN));
    const body = firstTrack(o.song).slice(3).map((t) => t.kind === "note" ? `${t.pitch!.step}${t.pitch!.alter || ""}${t.pitch!.octave}:${t.dur / TPQ}${t.lyric ? `:${t.lyric}` : ""}` : t.kind === "rest" ? `0:${t.dur / TPQ}` : t.kind).join(" ");
    eq(body, "clef E4:1:Twin G4:0.5 0:0.5 A-14:2 bar G4:4", "音符（叠音读进来：最高的 E4 当旋律线，C4 在 chord 里）；纸头的 <clef> 写什么就是什么 = 一个纸头谱号记号（第 16 条，不猜手选还是自动）");
    const first = firstTrack(o.song).find((t) => t.kind === "note")!; eq(first.kind === "note" && JSON.stringify(first.chord), '[{"step":"C","alter":0,"octave":4}]', "叠音的下面那个音在 chord 里");
    const tempo = firstTrack(o.song)[2]; eq(tempo.kind === "tempo" && tempo.bpm, 100, "速度进谱头");
    eq(o.song.title, "Twinkle", "歌名"); eq(o.stem, "twinkle", "文件名主干");
    assert(!o.notices.some((n) => n.includes("叠音")), `叠音现在读进来，不再报丢：${o.notices.join(" / ")}`);
    eq(o.song.parts.map((p) => p.id).join(","), "P1,P2", "两个声部都读了"); eq(o.song.papers.length, 1, "一张纸");
    eq(o.extras.lounge.r2.name, "Bass", "第二个声部的角色");
  });
  it("不自动选角：原来的乐器记成候选、没人上场，人来选（user「不出声，报错，人类手动换」）", () => {
    const o = openBytes("twinkle.musicxml", strToU8(FOREIGN));
    eq(engineOf(o), "unknown", "没人上场");
    eq(o.extras.lounge.r1.active, "c0", "上场的还是原来那件");
    assert(o.notices.some((n) => n.includes("Piano") && n.includes("GM 1 号") && n.includes("还没人上场")), `提示：${o.notices.join(" / ")}`);
    // 存了再开：原来那件还在、还是它上场（这一版没有 = 原样写回）
    const again = openBytes("t.mxl", save(o.song, o.extras, "none"));
    eq(engineOf(again), "unknown", "存了再开仍然没人上场");
    // 人选了月读 → 存了再开就是月读完整版
    eq(engineOf(openBytes("t.mxl", save(o.song, o.extras, "full"))), "tsukuyomi", "选了月读");
  });
});

import { defaultStem, fileSafe } from "../src/app/names.ts";
import { initState, setTitle } from "../src/score/song.ts";
describe("歌名与默认文件名", () => {
  it("没填歌名的默认名 = 家族约定 yyyymmdd-hex4（本地日期）", () => {
    const n = defaultStem(new Date(2026, 9, 7, 23, 59));
    assert(/^20261007-[0-9a-f]{4}$/.test(n), n);
  });
  it("歌名：空 = 不填（字段拿掉）；文件名去掉文件系统不认的字符", () => {
    let st = setTitle(initState(), "  うさぎ  ");
    eq(st.song.title, "うさぎ", "去首尾空白");
    st = setTitle(st, "   ");
    eq("title" in st.song, false, "清空 = 不填");
    eq(fileSafe('a/b:c*?"<>|d'), "abcd", "文件名");
  });
});
