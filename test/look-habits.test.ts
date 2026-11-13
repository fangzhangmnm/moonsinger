// test/look-habits.test.ts —— 这台设备的习惯（施工单第 18 条第三版）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 三层各管各的（歌里选过 → 照歌；"default" → 习惯；没选 → 软件的默认）② **每样习惯只盖它自己那一项，不从一样推另一样**
//   ③ 都没选 = 和不带情况一模一样（版面底本不变）④ 存文件那一层碰不到习惯（文件一个字节都不跟着变）⑤ 设备上认不出的字 = 没选；不读老的设备键
//   ⑥ 画的地方都带着习惯：src 里 look 模块和存文件那一层之外，lookOf / defaultText 的调用都要传「当时的情况」。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { setNotation, setViewInC, setMiddleC, NOTATIONS, MIDDLE_C_NAMES } from "../src/score/song-view.ts";
import { lookOf, defaultText, BASE_DEFAULTS, HABIT_KEYS, defaultsFor, type Habits } from "../src/look/index.ts";
import { habitsFrom, HABIT_CODEC, HABIT_DEVICE_KEY } from "../src/look/habits.ts";
import { engrave, type PartView } from "../src/render/engrave.ts";
import { printOpts } from "../src/export/score-pdf.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const fs = (await import("node:fs" as string)) as { readdirSync(u: URL): string[]; statSync(u: URL): { isDirectory(): boolean }; readFileSync(u: URL, e: "utf8"): string };
const ROOT = new URL("../", import.meta.url);
const read = (f: string): string => fs.readFileSync(new URL(f, ROOT), "utf8");
/** 每样习惯能取的值（全列：一样一样试）。 */
const VALUES: { [K in (typeof HABIT_KEYS)[number]]: readonly unknown[] } = { notation: NOTATIONS, viewInC: [true, false], middleC: MIDDLE_C_NAMES, chordTagStyle: ["degree", "root"] };

let id = 9100;
function song(): EditorState {
  let st = initState();
  const n = (k: number): Token => ({ kind: "note", id: id++, pitch: { step: "CDEFGAB"[k % 7], alter: k % 5 === 2 ? 1 : 0, octave: 4 }, dur: TPQ, lyric: "la" }) as Token;
  st = { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), ...Array.from({ length: 16 }, (_, k) => n(k))]) };
  return { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: p.tracks[st.at.part]!.map((t) => (t.kind === "key" ? { ...t, fifths: -3 } : t)) } })) } };   // 三个降号：按 C 调看起作用
}
const parts = (st: EditorState): PartView[] => st.song.parts.map((p, k) => ({ id: p.id, name: "Vocals", first: k === 0, clef: "G" }));
const measure = createTextMeasure((s: string) => [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 16 : 9), 0));
const lay = (st: EditorState, habits?: Habits) => JSON.stringify(engrave(st.song, printOpts(st.song, 10, parts(st), measure, true, undefined, habits ? { habits } : undefined)));

describe("这台设备的习惯 · 三层各管各的", () => {
  it("都没选 = 软件的默认；没给情况 = 一样", () => {
    eq(JSON.stringify(defaultsFor({})), JSON.stringify(BASE_DEFAULTS)); eq(JSON.stringify(defaultsFor({ habits: {} })), JSON.stringify(BASE_DEFAULTS));
    const st = song(); eq(lay(st, {}), lay(st));
  });
  it("每样习惯只盖它自己那一项，不从一样推另一样（每样每个值都试）", () => {
    for (const k of HABIT_KEYS) for (const v of VALUES[k]) {
      const d = defaultsFor({ habits: { [k]: v } as Habits });
      for (const q of Object.keys(BASE_DEFAULTS) as (keyof typeof BASE_DEFAULTS)[]) eq(d[q], q === k ? v : BASE_DEFAULTS[q], `${k}=${String(v)} 时 ${q}`);
    }
  });
  it("歌里选过 → 照歌；歌里「跟着软件」→ 照习惯；没选 → 软件的默认", () => {
    const st = song();
    eq(lookOf(st.song).notation, "staff");
    eq(lookOf(st.song, { habits: { notation: "jianpu" } }).notation, "jianpu");
    eq(lookOf(setNotation(st, "staff").song, { habits: { notation: "jianpu" } }).notation, "staff");
    eq(lookOf(st.song, { habits: { viewInC: true } }).viewInC, true);
    eq(lookOf(setViewInC(st, false).song, { habits: { viewInC: true } }).viewInC, false);
    eq(lookOf(st.song, { habits: { middleC: 3 } }).middleC, 3);
    eq(lookOf(setMiddleC(st, 5).song, { habits: { middleC: 3 } }).middleC, 5);
    eq(lookOf(st.song, { habits: { viewInC: true } }).notation, "staff", "移调辅助的习惯不改谱种");
  });
  it("排出来：习惯看简谱 = 「跟着软件」的歌按简谱排、和歌里写明简谱一样；歌里选过五线谱的不变", () => {
    const st = song();
    eq(lay(st, { notation: "jianpu" }), lay(setNotation(st, "jianpu")));
    const staff = setNotation(st, "staff"); eq(lay(staff, { notation: "jianpu" }), lay(staff));
    eq(lay(st, { viewInC: true }), lay(setViewInC(st, true)));
    assert(lay(st, { viewInC: true }) !== lay(st), "按 C 调看真起作用了（这首三个降号）");
  });
  it("页面设置第一格「跟着软件（现在是：X）」的 X 跟着习惯", () => {
    eq(defaultText("notation", { habits: { notation: "jianpu" } }), defaultText("notation", {}) === "五线谱" ? "简谱" : defaultText("notation", { habits: { notation: "jianpu" } }));
    eq(defaultText("middleC", { habits: { middleC: 3 } }), "C3");
    eq(defaultText("viewInC", { habits: { notation: "jianpu" } }), defaultText("viewInC", {}), "谱种的习惯不改移调辅助那一格");
  });
});

describe("这台设备的习惯 · 设备上记的", () => {
  it("认不出的字 = 没选（不猜、不换成别的）；能来回", () => {
    const kv = new Map<string, string>([[HABIT_DEVICE_KEY.notation, "tablature"], [HABIT_DEVICE_KEY.viewInC, "1"], [HABIT_DEVICE_KEY.middleC, "6"]]);
    eq(JSON.stringify(habitsFrom((k) => kv.get(k) ?? null)), "{}");
    for (const k of HABIT_KEYS) for (const v of VALUES[k]) eq(HABIT_CODEC[k].parse(HABIT_CODEC[k].write(v as never)), v, `${k}=${String(v)}`);
  });
  it("不用老的设备键名（view-in-c / chord-tags：意思不一样，不读、不转换）；键名各不相同", () => {
    const names = Object.values(HABIT_DEVICE_KEY);
    for (const old of ["view-in-c", "chord-tags"]) assert(!names.includes(old), old);
    eq(new Set(names).size, names.length);
    const src = read("src/app/main.ts");
    assert(!/"view-in-c"|"chord-tags"/.test(src), "main.ts 里不再出现老的键名");
  });
});

describe("「初始设置」卡上摆着的那几样（v0.17.30 收跟进第 1 条）", () => {
  it("名单只有一份：画卡、「好」写设备都从 CARD_HABITS 来；都是习惯、不重复", async () => {
    const { cardHabitKeys, CARD_HABITS } = await import("../src/app/panels/habits-card.ts");
    const keys = cardHabitKeys();
    eq(new Set(keys).size, keys.length); for (const k of keys) assert((HABIT_KEYS as readonly string[]).includes(k), k);
    eq(CARD_HABITS.rows.join(","), "middleC,chordTagStyle");
    const card = read("src/app/panels/habits-card.ts"), main = read("src/app/main.ts");
    assert(!/data-h="(notation|viewInC|middleC|chordTagStyle)"/.test(card), "卡上的格子 / 钮从 CARD_HABITS 拿 data-h，不写死");
    assert(/done: \(c\) => \{ gone\(\); for \(const k of cardHabitKeys\(\)\) writeHabit\(k, c\[k\]\)/.test(main), "「好」只写 cardHabitKeys()（不在卡上的那一样值不变）");
    assert(!/done: \(c\) => \{ gone\(\); for \(const k of HABIT_KEYS\)/.test(main), "「好」不许照 HABIT_KEYS 全写");
  });
});

describe("这台设备的习惯 · 结构", () => {
  function* walk(dir: string): Generator<string> { for (const f of fs.readdirSync(new URL(`${dir}/`, ROOT))) { const p = `${dir}/${f}`; if (fs.statSync(new URL(p, ROOT)).isDirectory()) yield* walk(p); else if (/\.ts$/.test(f)) yield p; } }
  const code = (f: string) => read(f).replace(/(^|\s)\/\*[\s\S]*?\*\//g, "$1").split("\n").map((l: string) => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");
  it("存文件那一层碰不到习惯（project.ts 不认识「当时的情况」）：习惯怎么换，存出来的文件一个字节都不变", () => {
    assert(!/LookContext|habits|lookCtx/.test(code("src/format/project.ts")), "project.ts 里不许出现习惯");
  });
  it("look 模块和存文件那一层之外，lookOf( / defaultText( 都带第二个参数（画的地方拿同一份）", () => {
    const bad: string[] = [];
    for (const f of walk("src")) {
      if (f.startsWith("src/look/") || f === "src/format/project.ts") continue;
      for (const l of code(f).split("\n")) for (const m of l.matchAll(/\b(lookOf|defaultText)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)) if (!m[2]!.includes(",")) bad.push(`${f}: ${m[0]}`);
    }
    eq(bad.join("\n"), "");
  });
});
