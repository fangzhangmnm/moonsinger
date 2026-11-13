// 声部显示成什么：唯一出口 src/format/part-show.ts + 老文件进门时判一次（施工单 12-4，2026-11-12；user「全部声部里面翻译没有跟，以及好好想一下声部到底要不要自动翻译」→ 「名字和乐器分开」user「同意」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
// 守：① 出口：没起名字 = 乐器的叫法（按传进来的语言，缺了按写死的次序落）；起了 = 原样不翻；重名带号；简写按值（概念里的）/ 名字自己缩，定宽。
//     ② 老文件（minor 0）照文件读（第 16 条，user 定的甲「照文件显示」）：存着的名字就是起了的名字、原样显示；没概念的照名字显示。不再判、不再补。
//     ③ 存：<part-name> 起了 = 名字；没起 = 乐器谱上的叫法，语言只看歌（钉了一种 = 那一种，跟着界面 = 英文）；读回来以休息室为准。新角色 = 没起 + 目录里的人声。
//     ④ 冻结样本：这一版之前写的两份（一个会被判成没起、一个起了名字的）。
//     ⑤ 守卫：运行时别处不许拼声部名 / 读角色的 name。
import { describe, it, eq, assert } from "./runner.mjs";
import { partShow, partNames, conceptLabel, roleGivenName } from "../src/format/part-show.ts";
import { saveMxl, openBytes, emptyExtras, withRoleName, withRoleConcept, templateExtras, type Extras } from "../src/format/project.ts";
import { DEFAULT_CONCEPT } from "../src/gm/default-concept.gen.ts";
import { CONCEPT_LABELS } from "../src/gm/concept-labels.gen.ts";
import { initState, type Song } from "../src/score/song.ts";
import { dispWidth, ABBR_W } from "../src/ui/part-colors.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";

const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string; readdirSync(p: URL, o?: object): { name: string; isDirectory(): boolean }[] };
const ROOT = new URL("../", import.meta.url);
type Concept = NonNullable<Parameters<typeof conceptLabel>[0]>;
const FLUTE_OLD = { ids: { wikidata: "Q209554", local: null, musicxml: "wind.flutes.flute", gm: [{ program: 73, bank: 0 }], hs: "421.121.12" }, name: { zh: "长笛", en: "Western concert flute", ja: "フルート" } };   // 这一版之前上场时按值存的样子（没有 score / abbr）
const flute: Concept = { ...FLUTE_OLD, score: { zh: "长笛", en: "Flute" }, abbr: { en: "Fl." } };   // 这一版上场时抄的样子
const santoor: Concept = { ids: { wikidata: "Q2912399", local: null, musicxml: "pluck.santoor", gm: [], hs: null }, name: { zh: "桑图尔琴", en: "santoor" }, score: { zh: "桑图尔琴", en: "Santoor" } };
const role = (o: Record<string, unknown>) => ({ version: 3, id: "r", active: "c1", candidates: [], sound: "voice.vocals", ...o });
const songWith = (n: number): Song => { const st = initState(); return { ...st.song, parts: Array.from({ length: n }, (_, k) => ({ id: `P${k + 1}`, role: `r${k + 1}`, mic: `m${k + 1}` })) }; };

describe("出口：显示成什么（12-4）", () => {
  it("次序：现行的表里有这个概念 = 表里的（按值存的不看）；表里没有 = 按值存的那种语言的 → 百科名里那种语言的（首字母大写）→ 按值存的英文的", () => {
    eq(conceptLabel(flute, "zh"), "长笛"); eq(conceptLabel(flute, "en"), "Flute");
    eq(conceptLabel({ ...flute, score: { zh: "旧叫法", en: "Old name" } }, "en"), "Flute", "表里有 = 按值存的旧叫法不算数");
    const off = { ...flute, ids: { ...flute.ids, wikidata: "Q-not-in-catalog" } };   // 目录外的（老预设补的 / 自己的 .sf2 那种）
    eq(conceptLabel(off, "zh"), "长笛"); eq(conceptLabel({ ...off, score: { en: "Flute" } }, "zh"), "长笛", "按值存的没有中文 = 百科中文名");
    eq(conceptLabel({ ...off, score: { en: "Flute" }, name: { zh: "", en: "Western concert flute" } }, "zh"), "Flute", "都没有中文 = 按值存的英文叫法");
  });
  it("没起名字 = 乐器的叫法（按语言）；起了 = 原样不翻；重名同种的带号", () => {
    const lounge = { r1: role({ concept: flute, sound: "wind.flutes.flute" }), r2: role({ concept: flute, sound: "wind.flutes.flute" }), r3: role({ concept: flute, name: "My Flute", sound: "wind.flutes.flute" }) };
    eq(partNames(songWith(3), lounge, "zh").join("|"), "长笛 1|长笛 2|My Flute");
    eq(partNames(songWith(3), lounge, "en").join("|"), "Flute 1|Flute 2|My Flute");
  });
  it("简写：没起 = 概念里那种语言的简写（带号）；中文没有简写 = 叫法本身照定宽缩；起了名字 = 名字自己缩，不套乐器的简写", () => {
    const ab = (lounge: Record<string, unknown>, n: number, l: "zh" | "en") => partShow(songWith(n), lounge, l).map((x) => x.abbr).join("|");
    const two = { r1: role({ concept: flute }), r2: role({ concept: flute }) };
    eq(ab(two, 2, "en"), "Fl. 1|Fl. 2"); eq(ab(two, 2, "zh"), "长笛 1|长笛 2");
    eq(ab({ r1: role({ concept: santoor }), r2: role({ concept: santoor }) }, 2, "zh"), "桑图 1|桑图 2", "放不下截到那一栏的宽（号算在宽里）");
    eq(ab({ r1: role({ concept: santoor }) }, 1, "en"), "San.", "目录没有简写 = 从叫法缩");
    eq(ab({ r1: role({ concept: flute, name: "My Flute" }) }, 1, "en"), "MF.");
    eq(ab({ r1: role({ concept: flute, name: "我的提琴" }) }, 1, "en"), "我的");
    eq(ab({ r1: role({ name: "Helicopter" }) }, 1, "en"), "Hel.");
    assert(dispWidth(partShow(songWith(1), { r1: role({ name: "Supercalifragilistic Expialidocious Orchestra Hit" }) }, "en")[0]!.abbr) <= ABBR_W, "定宽");
  });
  it("新歌按模板写了乐手 = 没起名字、目录里的人声：中文「人声」、英文 Voice / Vo.；歌里没有这个角色（乐手读不到）= 照实写「（没有乐手）」，不当成人声（第 16 条）", () => {
    const x = templateExtras(songWith(1));
    eq(partShow(songWith(1), x.lounge, "zh")[0]!.name, "人声");
    const en = partShow(songWith(1), x.lounge, "en")[0]!; eq(en.name, DEFAULT_CONCEPT.score!.en); eq(en.abbr, "Vo.");
    eq(partShow(songWith(1), {}, "zh")[0]!.name, "（没有乐手）");
  });
});

describe("老文件照文件读（第 16 条，user 定的甲：「照文件显示」）", () => {
  const show = (o: Record<string, unknown>) => { const lounge = { r1: role({ id: "r1", ...o }) }; return { given: roleGivenName(lounge, "r1"), zh: partNames(songWith(1), lounge, "zh")[0], en: partNames(songWith(1), lounge, "en")[0] }; };
  it("名字等于乐器的叫法也照样是起了的名字、原样显示（不再判「软件当年抄的」）；概念缺的叫法 / 简写不补", () => {
    for (const n of ["Flute", "flute", "Western concert flute", "长笛"]) { const r = show({ concept: FLUTE_OLD, name: n }); eq(r.given, n, n); eq(r.zh, n, n); eq(r.en, n, n); }
  });
  it("没概念、叫老预设名（Soprano / Vocals）= 照名字显示，不认成预设", () => {
    const sop = show({ name: "Soprano", sound: "voice.soprano" }); eq(sop.given, "Soprano"); eq(sop.zh, "Soprano");
    eq(show({ name: "Vocals", sound: "voice.vocals" }).en, "Vocals");
  });
  it("名字是空串 = 没有名字（照乐器的叫法）", () => { eq(show({ concept: flute, name: "" }).given, null); eq(show({ concept: flute, name: "" }).en, "Flute"); });
});

describe("存与读（12-4）", () => {
  const extras = (): Extras => ({ ...emptyExtras(), lounge: { r1: role({ id: "r1", concept: flute, sound: "wind.flutes.flute" }) as never } });
  const partNameIn = (b: Uint8Array) => /<part-name>([^<]*)<\/part-name>/.exec(strFromU8(unzipSync(b)["score.musicxml"]!))?.[1];
  const save = (song: Song, x: Extras) => saveMxl({ song, extras: x, app: "t", date: "2026-11-12T00:00:00.000Z" });
  it("<part-name>：没起 + 跟着界面 = 英文叫法；钉了中文 = 中文；起了 = 名字", () => {
    const song = songWith(1);
    eq(partNameIn(save(song, extras())), "Flute");
    eq(partNameIn(save({ ...song, textLang: "zh" }, extras())), "长笛");
    eq(partNameIn(save(song, withRoleName(extras(), "r1", "My Flute", "n"))), "My Flute");
  });
  it("自己的文件读回来以休息室为准：没起的还是没起（不拿 <part-name> 当名字）；清掉名字 = 回到没起", () => {
    const o = openBytes("x.mxl", save(songWith(1), extras()));
    eq(roleGivenName(o.extras.lounge, "r1"), null);
    const named = withRoleName(extras(), "r1", "My Flute", "n"); eq(roleGivenName(withRoleName(named, "r1", "  ", "n").lounge, "r1"), null);
  });
  it("换乐器不动名字：没起的跟着换叫法，起了的照旧", () => {
    const x = withRoleConcept(extras(), "r1", { name: "Santoor", sound: "pluck.santoor", concept: santoor }, "n");
    eq(partNames(songWith(1), x.lounge, "zh")[0], "桑图尔琴");
    eq(partNames(songWith(1), withRoleConcept(withRoleName(extras(), "r1", "Lead", "n"), "r1", { name: "Santoor", sound: "pluck.santoor", concept: santoor }, "n").lounge, "zh")[0], "Lead");
  });
});

describe("同一个概念老歌新歌一个叫法（12-4 改口，统筹守卫）", () => {
  it("老歌里存着的名字照文件显示（第 16 条，user 定的甲）；没起名字的新歌跟着现行的表——改掉现行表里的叫法，新歌跟着变、老歌不变", () => {
    const old = openBytes("old.mxl", fs.readFileSync(new URL("test/fixtures/format/minor/lounge-0-unnamed/sample.mxl", ROOT)));
    const fresh = withRoleConcept(emptyExtras(), "r1", { name: "Flute", sound: "wind.flutes.flute", concept: flute }, "n");
    const a = (l: "zh" | "en") => partShow(old.song, old.extras.lounge, l)[0]!, bNew = (l: "zh" | "en") => partShow(songWith(1), fresh.lounge, l)[0]!;
    eq(roleGivenName(old.extras.lounge, "r1"), a("en").name, "老歌显示的就是存着的名字");
    const row = CONCEPT_LABELS.byWikidata["Q209554"] as { score: { en: string } }, was = row.score.en, oldName = a("en").name;
    try { row.score.en = "Flauto"; eq(a("en").name, oldName, "老歌不跟着现行的表（名字是文件里写的）"); eq(bNew("en").name, "Flauto", "新歌跟着现行的表"); } finally { row.score.en = was; }
  });
  it("存的时候按值写现行的叫法（不沿用旧的）", () => {
    const old = openBytes("old.mxl", fs.readFileSync(new URL("test/fixtures/format/minor/lounge-0-unnamed/sample.mxl", ROOT)));
    const back = openBytes("x.mxl", saveMxl({ song: old.song, extras: old.extras, app: "t", date: "2026-11-12T00:00:00.000Z" }));
    const c = (back.extras.lounge.r1 as { concept: Concept }).concept; eq(c.score?.en, CONCEPT_LABELS.byWikidata["Q209554"]!.score.en); eq(c.abbr?.en, "Fl.");
  });
});

describe("冻结样本：这一版之前写的两份（12-4）", () => {
  const open = (d: string) => openBytes("sample.mxl", fs.readFileSync(new URL(`test/fixtures/format/minor/${d}/sample.mxl`, ROOT)));
  const exp = (d: string) => JSON.parse(fs.readFileSync(new URL(`test/fixtures/format/minor/${d}/expected.json`, ROOT), "utf8")) as { zh: string[]; en: string[]; given: (string | null)[] };
  for (const d of ["lounge-0-unnamed", "lounge-0-named"]) it(`${d}：照文件读出来的名字、两种语言显示的叫法（第 16 条重冻）`, () => {
    const o = open(d), e = exp(d);
    eq(o.song.parts.map((p) => roleGivenName(o.extras.lounge, p.role)).join("|"), e.given.join("|"), "起没起");
    eq(partNames(o.song, o.extras.lounge, "zh").join("|"), e.zh.join("|"), "中文"); eq(partNames(o.song, o.extras.lounge, "en").join("|"), e.en.join("|"), "英文");
  });
});

describe("守卫：声部名只有一个出口（12-4）", () => {
  const files: string[] = [];
  const walk = (u: URL) => { for (const e of fs.readdirSync(u, { withFileTypes: true })) { const v = new URL(e.name + (e.isDirectory() ? "/" : ""), u); if (e.isDirectory()) walk(v); else if (/\.ts$/.test(e.name)) files.push(v.href.slice(ROOT.href.length)); } };
  walk(new URL("src/", ROOT));
  const src = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8");
  it("src 里没有 roleName( / partLabels( / presetShowName / localPartName / partAbbr(（老的按名字拼、按名字比的路）", () => {
    const bad = files.filter((f) => /\b(roleName|partLabels|presetShowName|localPartName|partAbbr)\s*\(/.test(src(f)));
    eq(bad.join(", "), "");
  });
  it("读角色的 name（lounge[…].name）只在出口和写入口那几处", () => {
    const ok = new Set(["src/format/part-show.ts", "src/format/project.ts"]);
    const bad = files.filter((f) => !ok.has(f) && /lounge\[[^\]]+\]\??\.name\b/.test(src(f)));
    eq(bad.join(", "), "");
  });
});
