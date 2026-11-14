// 设置「音源」「维护」两页的守卫（施工单 13-2；统筹「13 开工前…五件的回话」：红线守卫对一张白名单）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 两页上画出来的每一颗钮按一遍（假的宿主记下碰了哪块存储）：碰到的名字只许在白名单里（声音的库和它们的缓存 + 自己的离线壳）；
//   ② **维护页的规矩：这一页上的每颗钮，按下去都不会让任何一首歌少东西**——维护页的钮一个都不许删库（模型包 / 音源），只许清算出来的缓存和运行状态；
//   ③ 删库先问一句，说「算了」= 什么都不碰；删小月相顺带清它自己的缓存；
//   ④ 两页的处理函数不 import 歌库 / 同步那一层（这个文件只许 import 一张小名单里的模块）；⑤ 画出来的钮都有人接；⑥ 名字：包按种类说人话、自己加的音色文件从字节里读。
import { describe, it, eq, assert } from "./runner.mjs";
import { libAction, voiceColumnHtml, gsColumnHtml, ownColumnHtml, upkeepVoiceHtml, upkeepGsHtml, upkeepRendersHtml, upkeepRestHtml, packLabel, ownLabel, UPKEEP_ACTIONS, type LibsHost, type PackView } from "../src/app/panels/settings-libs.ts";
import { sf2Label, listSf2Presets, sf2Info } from "../src/gm/sf2-subset.ts";
import { packPlan, removedWhy } from "../src/sources/removed.ts";
import { libInstall } from "../src/app/panels/settings-libs.ts";
import { SOUNDS } from "../src/gm/sounds.gen.ts";
import { PACKS } from "../src/singer/packs.gen.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL | string, e?: "utf8"): string & Uint8Array };
const ROOT = new URL("../", import.meta.url);

/** 假的宿主：每一样碰存储的操作记一个名字。ask 的回答由测试给。 */
function fakeHost(answer = true, fail: string | null = null): { host: LibsHost; touched: string[]; marks: string[]; said: string[] } {
  const touched: string[] = [], marks: string[] = [], said: string[] = [], t = (n: string) => { if (fail && n.startsWith(fail)) throw new Error("boom"); touched.push(n); };
  const host: LibsHost = {
    ask: async () => answer, info: (m) => said.push(`info:${m}`), error: (m) => said.push(`error:${m}`), removed: { set: (lib, on) => marks.push(`${lib}:${on ? "on" : "off"}`) }, silencedBy: () => ["人声"], sizeOf: () => 1e6, progress: () => {},
    voice: { delete: async () => t("pwa-models:delete"), install: async () => t("pwa-models:download") },
    sounds: { gsSha: "g".repeat(64), delete: async (sha) => t(`pwa-sounds:delete:${sha === "g".repeat(64) ? "gs" : "own"}`), installGs: async () => t("pwa-sounds:download"), releaseMemory: () => t("memory") },
    speech: { clear: async () => t("speech") },
    lanes: { restart: () => t("lanes") },
    renders: { clearAll: async () => t("renders"), clearOld: async () => { t("renders"); return { count: 1, bytes: 1 }; }, clear: async () => { t("renders"); return true; } },
    audio: { revive: async () => { t("audio"); return true; } },
    shell: { check: async () => t("shell:check"), reset: async () => t("shell:own") },
    diag: { view: () => t("diag"), copy: () => t("diag"), download: () => t("diag"), share: () => t("diag"), clear: () => t("diag") },
    refresh: () => {}, goto: () => {}, doc: () => {},
  };
  return { host, touched, marks, said };
}
const packs = (ready: boolean): PackView[] => Object.entries(PACKS).map(([slug, p]) => ({ slug, ready, bytesTotal: p.manifest.totalBytes, bytesCached: ready ? p.manifest.totalBytes : 0 }));
const GS = SOUNDS["generaluser-gs-2.0.3"]!;
const gsView = (cached: boolean, removed = false) => ({ name: GS.name, bytes: GS.bytes, cached, removed, license: GS.license, attribution: GS.attribution, folder: null, source: "x" });
const own = [{ sha256: "a".repeat(64), bytes: 1000, label: { preset: "Sine Wave", library: "GeneralUser GS 2.0.3 BETA", presets: 1 }, users: ["钢琴"], packed: false }];
const renders = { rows: [{ key: "k", title: "t", secs: 3, size: 1000, at: 0, old: true, coreVersion: "0.2.1", links: [] }], bytes: 1000, oldCount: 1, oldBytes: 1000, coreNow: "0.3.0" };
/** 两页在各种状态下画出来的全部钮（data-v）。 */
const soundPage = [voiceColumnHtml({ packs: packs(true), folder: null, source: "x", removed: false }), voiceColumnHtml({ packs: packs(false), folder: null, source: "x", removed: false }), gsColumnHtml(gsView(true)), gsColumnHtml(gsView(false)), ownColumnHtml(own, null)].join("");
const upkeepPage = [upkeepVoiceHtml({ speech: { bytes: 1, budget: 2, entries: 3 }, speechNote: null, engineBytes: 5e8 }), upkeepGsHtml(3e7), upkeepRendersHtml(renders, 8), upkeepRestHtml({ canShare: true, diagText: "" })].join("");
const buttons = (html: string) => [...new Set([...html.matchAll(/data-v="([^"]+)"/g)].map((m) => m[1]!))];
/** 白名单：声音的库和它们的缓存、运行状态、自己的离线壳、诊断日志（device-kv 里 app 自己的那一条）。 */
const ALLOWED = new Set(["pwa-models:delete", "pwa-models:download", "pwa-sounds:delete:gs", "pwa-sounds:delete:own", "pwa-sounds:download", "memory", "speech", "lanes", "renders", "audio", "shell:check", "shell:own", "diag"]);
/** 维护页只许碰这些（清算出来的东西；什么都不让歌少）。 */
const UPKEEP_OK = new Set(["memory", "speech", "lanes", "renders", "audio", "shell:check", "shell:own", "diag"]);
/** 宿主自己接的（不进 libAction）：来源框的「恢复默认」。 */
const HOST_OWN = new Set(["src:default:voice", "src:default:gs"]);

describe("设置的音源 / 维护两页（13-2）", () => {
  it("① 两页上每一颗钮按一遍：碰到的存储都在白名单里", async () => {
    const bad: string[] = [];
    for (const v of buttons(soundPage + upkeepPage).filter((v) => !HOST_OWN.has(v))) {
      const { host, touched } = fakeHost(); await libAction(host, v);
      for (const n of touched) if (!ALLOWED.has(n)) bad.push(`${v} → ${n}`);
    }
    eq(bad.join("、"), "");
  });
  it("② 维护页的每颗钮都不删库（不让任何一首歌少东西）：只清缓存和运行状态", async () => {
    const bad: string[] = [], vs = buttons(upkeepPage);
    assert(vs.length >= 10, `维护页画出来的钮太少：${vs.join(",")}`);
    for (const v of vs) { const { host, touched } = fakeHost(); await libAction(host, v); for (const n of touched) if (!UPKEEP_OK.has(n)) bad.push(`${v} → ${n}`); }
    eq(bad.join("、"), "");
    for (const v of vs) assert(UPKEEP_ACTIONS.some((a) => (a.endsWith(":") ? v.startsWith(a) : v === a)), `维护页的钮 ${v} 没登记在 UPKEEP_ACTIONS 里`);
  });
  it("③ 删库先问：「算了」= 什么都不碰；删小月相 = 删包 + 清念过的句子 + 重开引擎；删乐器音色库 = 删文件 + 清内存", async () => {
    for (const v of ["lib:del:voice", "lib:del:gs", `lib:del:own:${"a".repeat(64)}`]) { const { host, touched } = fakeHost(false); await libAction(host, v); eq(touched.join(","), "", `${v} 说「算了」`); }
    { const { host, touched } = fakeHost(); await libAction(host, "lib:del:voice"); eq(touched.join(","), "pwa-models:delete,speech,lanes"); }
    { const { host, touched } = fakeHost(); await libAction(host, "lib:del:gs"); eq(touched.join(","), "pwa-sounds:delete:gs,memory"); }
    { const { host, touched } = fakeHost(); await libAction(host, `lib:del:own:${"a".repeat(64)}`); eq(touched.join(","), "pwa-sounds:delete:own"); }
  });
  it("④ 两页的处理函数不 import 歌库 / 同步那一层：只许 import 一张小名单", () => {
    const src = fs.readFileSync(new URL("src/app/panels/settings-libs.ts", ROOT), "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");   // 注释里提到的路径不算
    const specs = [...code.matchAll(/^\s*(?:import|export)\b[^;"'`]*?\bfrom\s+["']([^"']+)["']/gm), ...code.matchAll(/^\s*import\s+["']([^"']+)["']/gm), ...code.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]!);   // import / export … from、裸 import、import()
    const OK = new Set(["@internal/workbench-elements", "../../i18n/index.ts", "../../singer/credit-translations.ts", "../../ui/md-lite.ts", "../../ui/size-text.ts", "../follow-badge.ts"]);   // follow-badge = 只拼一枚小图标的 HTML（20-4），不碰存储
    eq(specs.filter((s) => !OK.has(s)).join("、"), "");
  });
  it("⑤ 两页上画出来的钮都有人接（libAction 认得，或者是宿主自己接的那两颗）", async () => {
    const lost: string[] = [];
    for (const v of buttons(soundPage + upkeepPage)) { if (HOST_OWN.has(v)) continue; const { host } = fakeHost(); if (!(await libAction(host, v))) lost.push(v); }
    eq(lost.join("、"), "");
  });
  it("⑥ 名字：模型包按种类说人话；自己加的音色文件 =「预设名 · 音色库名」，几件写「等 n 件」，读不出写 sha256 前 8 位", () => {
    eq(Object.keys(PACKS).map(packLabel).join(","), "小月相的声音,运行引擎,日语读音,中文读音,英文读音");
    eq(ownLabel(own[0]!), "Sine Wave · GeneralUser GS 2.0.3 BETA");
    eq(ownLabel({ sha256: "b".repeat(64), label: { preset: "Square Lead", presets: 2 } }), "Square Lead 等 2 件");
    eq(ownLabel({ sha256: "c1d2e3f4".padEnd(64, "0"), label: null }), "c1d2e3f4");
    eq(ownLabel({ sha256: "c".repeat(64), label: undefined }), "…");
  });
  it("⑥ 从字节里读名字只读开头的 INFO 和结尾的预设表：和整块解析一样，不碰采样那一大段", async () => {
    for (const f of ["gu-sine-wave", "gu-square-castanets", "gu-tonewheel-novel"]) {
      const b = new Uint8Array(fs.readFileSync(new URL(`test/fixtures/sf2/${f}.sf2`, ROOT)));
      let read = 0; const r = await sf2Label(async (s, e) => { read += e - s; return b.slice(s, e); }, b.length);
      eq(r?.preset, listSf2Presets(b)[0]!.name.trim()); eq(r?.library, sf2Info(b).name); eq(r?.presets, listSf2Presets(b).length);
      assert(read < b.length / 2, `${f}：读了 ${read} / ${b.length} 字节`);
    }
    eq(await sf2Label(async (s, e) => new Uint8Array(e - s), 4096), null, "不是 sf2 = null");
  });
  it("「版权和使用规则」= 名字后面的「©」，问号只解释这是什么；自己加的文件没有规则可说就不放 ©", () => {
    assert(/data-note="1"[^>]*aria-label="版权和使用规则"/.test(voiceColumnHtml({ packs: packs(true), folder: null, source: "x", removed: false })), "小月相那一栏有 ©");
    assert(/aria-label="版权和使用规则"/.test(gsColumnHtml(gsView(true))), "乐器音色库那一栏有 ©");
    assert(!/版权和使用规则/.test(ownColumnHtml(own, null)), "自己加的音色文件那一栏没有 ©");
  });
});

describe("删掉的库不自己下回来（v0.17.25）", () => {
  it("删成功才记「你删了」；删没成 = 不记、说一句；「算了」= 不记", async () => {
    { const { host, marks } = fakeHost(); await libAction(host, "lib:del:voice"); eq(marks.join(","), "voice:on"); }
    { const { host, marks } = fakeHost(); await libAction(host, "lib:del:gs"); eq(marks.join(","), "gs:on"); }
    { const { host, marks, said } = fakeHost(true, "pwa-models:delete"); await libAction(host, "lib:del:voice"); eq(marks.join(","), ""); assert(said.some((x) => x.startsWith("error:")), `删没成要说一句：${said.join("|")}`); }
    { const { host, marks } = fakeHost(false); await libAction(host, "lib:del:voice"); eq(marks.join(","), ""); }
  });
  it("装成功才去掉记号（音源页和清单里的「装回来」同一个 libInstall）；装没成 = 记号还在", async () => {
    { const { host, marks } = fakeHost(); await libAction(host, "lib:add:voice"); eq(marks.join(","), "voice:off"); }
    { const { host, marks } = fakeHost(); eq(await libInstall(host, "gs"), true); eq(marks.join(","), "gs:off"); }
    { const { host, marks, said } = fakeHost(true, "pwa-sounds:download"); eq(await libInstall(host, "gs"), false); eq(marks.join(","), ""); assert(said.some((x) => x.startsWith("error:")), said.join("|")); }
  });
  it("维护页的「清」没成也说一句", async () => {
    const { host, said } = fakeHost(true, "speech"); await libAction(host, "sp:clear"); assert(said.some((x) => x.startsWith("error:")), said.join("|"));
  });
  it("三种状态三种说法：装着 = 删；没装 = 用到时会自己下载 +「现在下载」；你删了 = 不会自己下载 +「装回来」", () => {
    const off = voiceColumnHtml({ packs: packs(false), folder: null, source: "x", removed: false }), del = voiceColumnHtml({ packs: packs(false), folder: null, source: "x", removed: true });
    assert(/没装 · 用到时会自己下载/.test(off) && /data-v="lib:add:voice"[^>]*>现在下载/.test(off), "没装：用到时会自己下载 +「现在下载」");
    assert(/你删了 · 不会自己下载/.test(del) && /data-v="lib:add:voice"[^>]*>装回来/.test(del), "你删了：不会自己下载 +「装回来」");
    assert(/你删了 · 不会自己下载/.test(gsColumnHtml(gsView(false, true))) && /没装 · 用到时会自己下载/.test(gsColumnHtml(gsView(false))), "乐器音色库同样");
    assert(/你删了 = 不会自己下载/.test(off) && /你删了 = 不会自己下载/.test(gsColumnHtml(gsView(true))), "「?」里三种状态各一句");
  });
  it("缺包怎么办：在 = 用；不在、没删 = 自己下载（照原来）；不在、你删了 = 不下载、报「被删了」", () => {
    eq([packPlan(true, true), packPlan(false, false), packPlan(false, true)].join(","), "use,download,removed");
  });
  it("小月相：每个 warm / sing 请求都带着记号，worker 的 ensurePacks 按 packPlan 走、被删了就报「被删了」不下载", () => {
    const client = fs.readFileSync(new URL("src/singer/client.ts", ROOT), "utf8"), worker = fs.readFileSync(new URL("src/singer/worker.ts", ROOT), "utf8");
    eq((client.match(/\.\.\.\(this\.noDownload\(\) \? \{ blocked: true \} : \{\}\)/g) ?? []).length, 2, "warm 和 sing 两处");
    const ensure = worker.slice(worker.indexOf("async function ensurePacks("), worker.indexOf("async function ensurePacks(") + 1500);
    assert(ensure.includes("packPlan(") && /, blocked\);/.test(ensure) && /plan === "removed"\) throw new Error\(removedWhy\("voice"\)\)/.test(ensure) && ensure.indexOf("packPlan") < ensure.indexOf("store.download"), "ensurePacks 先问 packPlan、被删了在下载之前就报错");
    eq((worker.match(/blocked = !!q\.blocked/g) ?? []).length, 2, "warm 和 sing 都从请求里取记号");
  });
  it("乐器音色库：解析链自动去拿整包那一步，有记号 = 不下载、报「被删了」；没记号 = 照原来去下载", async () => {
    const g = globalThis as unknown as { location?: unknown; fetch: unknown }, keep = { location: g.location, fetch: g.fetch };
    let fetched = 0; g.location = { href: "http://127.0.0.1/", origin: "http://127.0.0.1" }; g.fetch = async () => { fetched++; throw new Error("offline"); };
    try {
      const { createSoundSources } = await import("../src/sources/sounds.ts");
      const cand = { id: "c", name: "Piano", bank: 0, program: 0, subsetSha256: "s".repeat(64), origin: { name: GS.name, fileSha256: GS.sha256, bytes: GS.bytes, library: GS.id } } as unknown as Parameters<ReturnType<typeof createSoundSources>["resolveGmBytes"]>[0];
      let removed = true; const src = createSoundSources({ progress: () => {}, roleLabel: () => "x", removed: () => removed });
      const err = await src.resolveGmBytes(cand).then(() => null, (e: Error) => e);
      eq(err?.message, removedWhy("gs"), "有记号：报「被删了」"); eq((err as unknown as { removedLib?: string })?.removedLib, "gs", "错上带着是哪个库（认种类靠它，不比字）"); eq(fetched, 0, "有记号：一次都没去下载");
      removed = false; await src.resolveGmBytes(cand).catch(() => {}); assert(fetched > 0, "没记号：照原来去下载");
    } finally { g.location = keep.location; g.fetch = keep.fetch; }
  });
});

describe("「被删了」认种类、不比那句话（统筹「v0.17.25 收」第 1 条）", () => {
  it("没有哪个文件拿 removedWhy(…) 的字去比：准备那一步认错上带的 lib", () => {
    const files = ["src/app/performance.ts", "src/app/main.ts", "src/core/render.ts", "src/sources/sounds.ts"];
    eq(files.filter((f) => /===\s*removedWhy\(|removedWhy\([^)]*\)\s*===/.test(fs.readFileSync(new URL(f, ROOT), "utf8"))).join("、"), "");
    assert(/const lib = \(e as \{ removedLib\?: BuiltinLib \}\)\.removedLib/.test(fs.readFileSync(new URL("src/core/render.ts", ROOT), "utf8")), "core 的准备那一步把错上带的 lib 抄到 PrepareError 上");
  });
});
