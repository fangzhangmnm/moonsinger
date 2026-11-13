// 力度怎么变响：每位乐手按值带着自己的表，程序里没有公式、没有深度（第 16 条 16-4，统筹 2026-11-12 夜「v0.17.12 收」四问）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟；9-2 那一版的这份测试整个重写）。
//   按音量走的小月相 / 元音版 = dB 表 dynamicsDb：水平就是表里那一档；渐强渐弱 / 渐到在 dB 上线性；没终点 = 走到表里的下一档（到头不动）；强后即弱压到表里的 p。
//   按力度敲的乐器 = 力度表 dynamicsVel + wedgeStepVel（照旧在力度上线性）。存档按插件报的路分每位写哪张表。
import { describe, it, eq, assert } from "./runner.mjs";
import { gainSegments, dynLevels } from "../src/score/perform.ts";
import { DYNAMICS_VEL, DYNAMICS_DB } from "../src/format/template.ts";
import { gainSpec } from "./fixtures/spec.ts";
import { initState, tr, TPQ, DYNS, type Token, type Dyn, type Song } from "../src/score/song.ts";
import { openBytes, saveMxl, activePerfSpec, perfSpecProblems, templateExtras, type Extras } from "../src/format/project.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

/** 小月相 / 元音版这一路（按音量走）的规格：dB 表 = 模板。 */
const SING = gainSpec();
let id = 9900;
const note = (dur = TPQ, art?: string[]): Token => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric: null, ...(art ? { art } : {}) }) as Token;
const dyn = (value: Dyn): Token => ({ kind: "dyn", id: id++, value }) as Token;
const pin = (dir: "cresc" | "dim"): Token => ({ kind: "hairpin", id: id++, dir }) as Token;
const line = (items: Token[]) => [...tr(initState()).slice(0, 3), ...items];
const map = [{ tick: 0, bpm: 60 }] as never;   // 一拍一秒

describe("力度 → 响度：每位乐手自己的表（16-4）", () => {
  it("模板 = 9-4 那条公式在标准力度表上算出的八个数、两位小数（和公式差不到 0.005 dB）；从此是数据", () => {
    for (const d of DYNS) {
      const f = (800 / 960) * 40 * Math.log10(DYNAMICS_VEL[d] / 127);   // 只在测试里核一次来历
      assert(Math.abs(DYNAMICS_DB[d] - f) < 0.005 && Math.abs(Math.round(DYNAMICS_DB[d] * 100) - DYNAMICS_DB[d] * 100) < 1e-9, `${d}：${DYNAMICS_DB[d]} vs ${f.toFixed(4)}`);
    }
    for (let k = 1; k < DYNS.length; k++) assert(DYNAMICS_DB[DYNS[k]!] > DYNAMICS_DB[DYNS[k - 1]!], "模板从轻到响");
  });
  it("小月相 / 元音版：每个力度记号下的水平 = 她身上那张表的那一档（换一张表 = 跟着换，不经过任何公式）", () => {
    const own = { ppp: -24, pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12, fff: 18 } as Record<Dyn, number>;
    for (const tab of [DYNAMICS_DB, own]) for (const d of DYNS) {
      const g = gainSegments(line([dyn(d), note()]), map, { ...SING, dynamicsDb: tab }) ?? [{ dB: 0 }];   // 全程 0 dB = null（不碰声音）
      assert(g.every((s) => Math.abs(s.dB - tab[d]) < 1e-9), `${d}：${g.map((s) => s.dB).join(" ")}，应该 ${tab[d]}`);
    }
  });
  it("p 渐强到 f：一个长音里每一小段在 dB 上线性（表的单位是什么就在什么上线性）", () => {
    const toks = line([dyn("p"), pin("cresc"), note(4 * TPQ), dyn("f"), note()]);
    const g = gainSegments(toks, map, SING)!, inA = g.filter((s) => s.t1 <= 4 + 1e-9);
    assert(inA.length > 4, "切成了小段");
    for (const s of inA) { const fr = (s.t0 + s.t1) / 2 / 4, want = DYNAMICS_DB.p + (DYNAMICS_DB.f - DYNAMICS_DB.p) * fr; assert(Math.abs(s.dB - want) < 1e-9, `${s.t0.toFixed(2)} 秒：${s.dB.toFixed(3)} vs ${want.toFixed(3)}`); }
  });
  it("没终点的渐强渐弱 = 走到表里的下一档（ppp → pp → … → fff），到头不动；不要另一个数", () => {
    const end = (start: Dyn, dir: "cresc" | "dim") => { const toks = line([dyn(start), pin(dir), note(), note()]), L = dynLevels(toks, map, DYNAMICS_DB, DYNAMICS_DB.mf, "table"); return L.get(toks.length - 1)!.at1; };
    for (let k = 0; k < DYNS.length; k++) {
      const near = (a: number, b: number, m: string) => assert(Math.abs(a - b) < 1e-9, `${m}：${a} vs ${b}`);
      near(end(DYNS[k]!, "cresc"), DYNAMICS_DB[DYNS[Math.min(DYNS.length - 1, k + 1)]!], `${DYNS[k]} <`);
      near(end(DYNS[k]!, "dim"), DYNAMICS_DB[DYNS[Math.max(0, k - 1)]!], `${DYNS[k]} >`);
    }
    // 走了一档之后再来一个没终点的 < = 再往上一档（按「现在在哪一档」走，不是按数）
    const toks = line([dyn("p"), pin("cresc"), note(), pin("cresc"), note(), note()]), L = dynLevels(toks, map, DYNAMICS_DB, DYNAMICS_DB.mf, "table");
    assert(Math.abs(L.get(toks.length - 1)!.at1 - DYNAMICS_DB.mf) < 1e-9, "p < < = 两档：mp 再到 mf");
  });
  it("强后即弱压到表里的 p；之后的音都是 p", () => {
    const toks = line([dyn("mf"), note(TPQ, ["fp"]), note()]), g = gainSegments(toks, map, SING)!;
    assert(Math.abs(g[0]!.dB - DYNAMICS_DB.f) < 1.5, `音头按 f：${g[0]!.dB}`);
    assert(Math.abs(g[g.length - 1]!.dB - DYNAMICS_DB.p) < 1e-9, `之后 = 表里的 p：${g[g.length - 1]!.dB}`);
  });
  it("按音量走的这位缺 dB 表 / 缺数 = 送进录音房之前查出来、写清缺哪几个（不在出声的代码里替她补一个数；统筹第 5 条）", () => {
    eq(perfSpecProblems(SING, 1).join(","), "", "写全的 = 没毛病");
    const bad = perfSpecProblems({ ...SING, dynamicsDb: {} as never, accentDb: undefined as never }, 1);
    assert(bad.includes("dynamicsDb.ppp") && bad.includes("dynamicsDb.fff") && bad.includes("accentDb"), bad.join(","));
  });
  it("带老表的照文件读：写了的档原样，缺的档（老的六档表没有 ppp / fff）= 读文件的门口用模板补", () => {
    const song = initState().song, x: Extras = templateExtras(song), role = song.parts[0]!.role;
    const r = structuredClone(x.lounge[role]) as { candidates: Record<string, unknown>[] };
    r.candidates[0]!.dynamicsDb = { pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12 };
    const o = openBytes("x.mxl", saveMxl({ song, extras: { ...x, lounge: { ...x.lounge, [role]: r as never } }, app: "t", date: "2026-11-12T00:00:00.000Z" }));
    const sp = activePerfSpec(o.extras, role)!; if (sp.path !== "gain") throw new Error("应该是音量那一路");
    const t = sp.dynamicsDb;
    eq(JSON.stringify(t), JSON.stringify({ ppp: DYNAMICS_DB.ppp, pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12, fff: DYNAMICS_DB.fff }));
  });
  it("存档按插件报的力度路分（不按引擎名）：小月相写 dynamicsDb、不写 dynamicsVel / wedgeStepVel；SoundFont 写 dynamicsVel / wedgeStepVel、不写 dynamicsDb / wedgeStepDb；读不懂的引擎整份原样", () => {
    const song: Song = initState().song, x: Extras = templateExtras(song), role = song.parts[0]!.role;
    const r = structuredClone(x.lounge[role]) as { candidates: Record<string, any>[] };
    const both = (c: Record<string, any>) => ({ ...c, dynamicsDb: { mf: 1 }, dynamicsVel: { mf: 70 }, articulation: { ...c.articulation, wedgeStepVel: 9, wedgeStepDb: 6 } });
    r.candidates = [...r.candidates.map(both), both({ id: "c7", name: "sf", instrument: { engine: "soundfont", bank: 0, program: 0, subsetSha256: "0".repeat(64), source: { embedded: null }, origin: {} }, articulation: {} }),
      { id: "c8", name: "far", instrument: { engine: "ewql" }, dynamicsDb: { mf: 2 }, dynamicsVel: { mf: 3 }, oddKey: 1 }];
    const once = saveMxl({ song, extras: { ...x, lounge: { ...x.lounge, [role]: r as never } }, app: "t", date: "2026-11-12T00:00:00.000Z" }), o = openBytes("x.mxl", once);   // 存的时候只筛键；缺的数在读文件的门口补（16-4 A）
    const z = unzipSync(saveMxl({ song: o.song, extras: o.extras, app: "t", date: "2026-11-12T00:00:00.000Z" }));
    const out = JSON.parse(strFromU8(z[`.moonsinger/lounge/${role}.json`]!)).candidates as Record<string, any>[], by = (cid: string) => out.find((c) => c.id === cid)!;
    for (const cid of ["c1", "c2"]) {
      const c = by(cid); assert("dynamicsDb" in c && !("dynamicsVel" in c) && !("wedgeStepVel" in c.articulation) && !("wedgeStepDb" in c.articulation), `${cid}：${Object.keys(c).join(",")} / ${Object.keys(c.articulation).join(",")}`);
      eq(c.dynamicsDb.mf, 1, `${cid}：写着的档照写`); eq(c.dynamicsDb.ppp, DYNAMICS_DB.ppp, `${cid}：缺的档按模板写全`);
    }
    const sf = by("c7"); assert("dynamicsVel" in sf && !("dynamicsDb" in sf) && sf.articulation.wedgeStepVel === 9 && !("wedgeStepDb" in sf.articulation), `SoundFont：${Object.keys(sf).join(",")}`);
    eq(JSON.stringify(by("c8")), JSON.stringify(r.candidates.find((c) => c.id === "c8")), "读不懂的引擎那一位：整份原样");
  });
  it("结构：src 里没有力度的公式和深度（按音量走的力度就是表；按力度敲的响度跟着库写的深度——SF2 规范那条公式只住在 gm/）", () => {
    const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    const code = (f: string) => (fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8") as string).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const bad = walk("").filter((f) => f !== "i18n/strings.ts").flatMap((f) => { const c = code(f); return [/\bvelocityDepth\b/, /\bdepthCurve\b/, /\bvelocityDb\b/, /\bSF2_VEL_DEPTH\b/, ...(f.startsWith("gm/") ? [] : [/40\s*\*\s*Math\.log10\(/])].filter((re) => re.test(c)).map((re) => `${f}：${re.source}`); });
    assert(!bad.length, `还在：${bad.join("、")}`);
  });
  it("老文件照写的读（第 16 条，没有迁移）：第 2 版的三个样本读得开、门口补全之后每位乐手这一路的数都写全；第 1 版的两个样本谱的扩展没有纸的表 = 读不懂、明说", () => {
    for (const dir of ["v2-2-2-1", "v2-2-2-2", "v2-2-3-2"]) {
      const o = openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL(`fixtures/format/${dir}/sample.mxl`, import.meta.url))));
      for (const role of Object.keys(o.extras.lounge)) { const sp = activePerfSpec(o.extras, role); if (!sp) continue; assert(perfSpecProblems(sp, 1).length === 0 && DYNS.every((d) => Number.isFinite(sp.path === "gain" ? sp.dynamicsDb[d] : sp.dynamicsVel[d])), `${dir} ${role}：这一路的表八档都在、数都写全`); }
    }
    for (const dir of ["v1-1-1-1", "v1-1-2-1"]) {
      let threw = ""; try { openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL(`fixtures/format/${dir}/sample.mxl`, import.meta.url)))); } catch (e) { threw = (e as Error).message; }
      assert(/读不懂/.test(threw), `${dir}：${threw}`);
    }
  });
});
