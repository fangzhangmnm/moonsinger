// 声部显示成什么：唯一出口 src/format/part-show.ts + 老文件进门时判一次（施工单 12-4，2026-11-12；user「全部声部里面翻译没有跟，以及好好想一下声部到底要不要自动翻译」→ 「名字和乐器分开」user「同意」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
// 守：① 出口：没起名字 = 乐器的叫法（按传进来的语言，缺了按写死的次序落）；起了 = 原样不翻；重名带号；简写按值（概念里的）/ 名字自己缩，定宽。
//     ② 进门（老文件 minor 0）：名字等于乐器的任一叫法 = 没起、补上谱上的叫法和简写；叫老预设名又没概念 = 补上冻住的预设概念；别的 = 起了的名字。这一版写的文件不判。
//     ③ 存：<part-name> 起了 = 名字；没起 = 乐器谱上的叫法，语言只看歌（钉了一种 = 那一种，跟着界面 = 英文）；读回来以休息室为准。新角色 = 没起 + 目录里的人声。
//     ④ 冻结样本：这一版之前写的两份（一个会被判成没起、一个起了名字的）。
//     ⑤ 守卫：运行时别处不许拼声部名 / 读角色的 name / import 进门用的冻住的表。
import { describe, it, eq, assert } from "./runner.mjs";
import { partShow, partNames, conceptLabel, roleGivenName } from "../src/format/part-show.ts";
import { loungeRoleNames } from "../src/format/migrate/index.ts";
import { saveMxl, openBytes, emptyExtras, withRoleName, withRoleConcept, type Extras } from "../src/format/project.ts";
import { DEFAULT_CONCEPT } from "../src/gm/default-concept.gen.ts";
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
  it("缺那种语言时的次序：谱上的叫法里那种语言的 → 百科名里那种语言的（首字母大写）→ 谱上的叫法里英文的", () => {
    eq(conceptLabel(flute, "zh"), "长笛"); eq(conceptLabel(flute, "en"), "Flute");
    eq(conceptLabel({ ...flute, score: { en: "Flute" } }, "zh"), "长笛", "谱上的叫法没有中文 = 百科中文名");
    eq(conceptLabel({ ...flute, score: { en: "Flute" }, name: { zh: "", en: "Western concert flute" } }, "zh"), "Flute", "都没有中文 = 谱上的英文叫法");
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
  it("新角色（歌里还没有快照）= 没起名字、目录里的人声：中文「人声」、英文 Voice / Vo.", () => {
    eq(partShow(songWith(1), {}, "zh")[0]!.name, "人声");
    const en = partShow(songWith(1), {}, "en")[0]!; eq(en.name, DEFAULT_CONCEPT.score!.en); eq(en.abbr, "Vo.");
  });
});

describe("进门：老文件判一次（12-4，契约 lounge minor 1）", () => {
  const door = (o: Record<string, unknown>, minor = 0) => loungeRoleNames(role(o), minor) as { name?: string; concept?: Concept };
  it("名字等于乐器的任一叫法（不分大小写）= 没起，补上谱上的叫法和简写；英文叫法 = 它原来印的那个（拉丁字母写的名字），中文名对上的 = 冻住的目录表里的", () => {
    for (const [n, en] of [["Flute", "Flute"], ["flute", "flute"], ["Western concert flute", "Western concert flute"], ["长笛", "Flute"]]) {
      const r = door({ concept: FLUTE_OLD, name: n }); eq(r.name, undefined, n); eq(r.concept?.score?.en, en, n); eq(r.concept?.score?.zh, "长笛", n); eq(r.concept?.abbr?.en, "Fl.", n);
    }
  });
  it("候选里记的当初上场叫法（castAs.name）也算", () => {
    const r = door({ concept: FLUTE_OLD, name: "Fluuute", candidates: [{ id: "c9", castAs: { name: "Fluuute", sound: null, concept: FLUTE_OLD } }] });
    eq(r.name, undefined); const ca = (r as unknown as { candidates: { castAs: { concept: Concept } }[] }).candidates[0]!.castAs.concept; eq(ca.score?.en, "Fluuute", "候选里的概念也补上（英文叫法 = 它当初上场时印的）"); eq(ca.abbr?.en, "Fl.");
  });
  it("别的名字 = 起了的名字，原样；概念照样补谱上的叫法", () => {
    const r = door({ concept: FLUTE_OLD, name: "My Flute" }); eq(r.name, "My Flute"); eq(r.concept?.score?.en, "Flute");
  });
  it("没概念、叫老预设名（看官方 id）= 补上冻住的预设概念、没起；没名字 = 人声；别的名字照旧", () => {
    const sop = door({ name: "Soprano", sound: "voice.soprano" }); eq(sop.name, undefined); eq(conceptLabel(sop.concept!, "zh"), "女高音"); eq(conceptLabel(sop.concept!, "en"), "Soprano");
    eq(conceptLabel(door({ name: "Bass", sound: "voice.bass" }).concept!, "zh"), "男低音"); eq(conceptLabel(door({ name: "Bass", sound: "pluck.bass" }).concept!, "zh"), "贝斯");
    eq(conceptLabel(door({ name: "Vocals", sound: "voice.vocals" }).concept!, "en"), "Vocals", "老歌照旧写 Vocals（冻住的预设表），不变成目录的 Voice");
    eq(conceptLabel(door({ sound: "voice.vocals" }).concept!, "zh"), "人声");
    const lead = door({ name: "Lead guitar", sound: "pluck.guitar" }); eq(lead.name, "Lead guitar"); eq(lead.concept, undefined);
  });
  it("这一版写的文件（minor 1）不判：名字在 = 起了的，哪怕等于乐器的叫法；空串 = 没有", () => {
    eq(door({ concept: flute, name: "Flute" }, 1).name, "Flute");
    eq(door({ concept: flute, name: "" }, 1).name, undefined);
  });
});

describe("存与读（12-4）", () => {
  const extras = (): Extras => ({ ...emptyExtras(), lounge: { r1: role({ id: "r1", concept: flute, sound: "wind.flutes.flute" }) as never } });
  const partNameIn = (b: Uint8Array) => /<part-name>([^<]*)<\/part-name>/.exec(strFromU8(unzipSync(b)["score.musicxml"]!))?.[1];
  const save = (song: Song, x: Extras) => saveMxl({ song, hum: song.hum, extras: x, app: "t", date: "2026-11-12T00:00:00.000Z" });
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

describe("冻结样本：这一版之前写的两份（12-4）", () => {
  const open = (d: string) => openBytes("sample.mxl", fs.readFileSync(new URL(`test/fixtures/format/minor/${d}/sample.mxl`, ROOT)));
  const exp = (d: string) => JSON.parse(fs.readFileSync(new URL(`test/fixtures/format/minor/${d}/expected.json`, ROOT), "utf8")) as { zh: string[]; en: string[]; given: (string | null)[] };
  for (const d of ["lounge-0-unnamed", "lounge-0-named"]) it(`${d}：进门判完的名字、两种语言显示的叫法`, () => {
    const o = open(d), e = exp(d);
    eq(o.song.parts.map((p) => roleGivenName(o.extras.lounge, p.role)).join("|"), e.given.join("|"), "起没起");
    eq(partNames(o.song, o.extras.lounge, "zh").join("|"), e.zh.join("|"), "中文"); eq(partNames(o.song, o.extras.lounge, "en").join("|"), e.en.join("|"), "英文");
  });
});

describe("守卫：声部名只有一个出口、冻住的表只给进门用（12-4）", () => {
  const files: string[] = [];
  const walk = (u: URL) => { for (const e of fs.readdirSync(u, { withFileTypes: true })) { const v = new URL(e.name + (e.isDirectory() ? "/" : ""), u); if (e.isDirectory()) walk(v); else if (/\.ts$/.test(e.name)) files.push(v.href.slice(ROOT.href.length)); } };
  walk(new URL("src/", ROOT));
  const src = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8");
  it("src 里没有 roleName( / partLabels( / presetShowName / localPartName / partAbbr(（老的按名字拼、按名字比的路）", () => {
    const bad = files.filter((f) => /\b(roleName|partLabels|presetShowName|localPartName|partAbbr)\s*\(/.test(src(f)));
    eq(bad.join(", "), "");
  });
  it("读角色的 name（lounge[…].name）只在出口、写入口和进门那几处", () => {
    const ok = new Set(["src/format/part-show.ts", "src/format/project.ts", "src/format/migrate/index.ts"]);
    const bad = files.filter((f) => !ok.has(f) && /lounge\[[^\]]+\]\??\.name\b/.test(src(f)));
    eq(bad.join(", "), "");
  });
  it("冻住的进门表（legacy-role-names.ts）只有 migrate/index.ts import", () => {
    const bad = files.filter((f) => f !== "src/format/migrate/index.ts" && f !== "src/format/migrate/legacy-role-names.ts" && /from\s+["'][^"']*legacy-role-names/.test(src(f)));
    eq(bad.join(", "), "");
  });
});
