// 每个库的校准归它自己带；库和库之间只在乐手的「响度」那一个数上对齐（施工单 9-3，2026-11-12；user「小月相有自己的normalization，normalization应该是乐器自己可以带的。
//   是不同库之间需要调，这个应该怎么办」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。数这一次都不变（块乘 0.89 / 0.42、新乐手 −6），只换住处：
//   块乘多少 = 插件报（chunkGain）；新上场的默认响度 = 插件 / 库报（defaultCalibrationDb）；公共的出声代码不认识任何一个引擎的音量数。
import { describe, it, eq, assert } from "./runner.mjs";
import { performers, performerOf } from "../src/performers/index.ts";
import { CALIBRATION_DEFAULT_DB } from "../src/format/performance.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
const code = (f: string) => (fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8") as string).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
/** 名字里同时有一个引擎 / 库和一个音量词的（SUNG_GAIN、SOUNDFONT_CALIBRATION_DB、tsukuyomiGainDb…）。 */
const ENGINE_VOLUME = /\b[A-Za-z_]*(?:sung|tsukuyomi|vowel|soundfont|sf2|gm|gs|tsf)[A-Za-z_]*(?:gain|db|calibration|loud|volume)[A-Za-z_0-9]*\b/i;

describe("校准归库（9-3）", () => {
  it("插件报：按块出声的报块乘多少（小月相 = 0.89 / 0.42，数没变）；按音符表的不报；每位都报新上场的默认响度（第 14 条起都是现行的那一个默认 0）", () => {
    for (const p of performers()) {
      if (p.sound === "chunks") assert(typeof p.chunkGain === "number" && p.chunkGain > 0, `${p.name} 块乘多少`); else eq(p.chunkGain, undefined, `${p.name} 不按块出声`);
      for (const lib of [null, "generaluser-gs-2.0.3", "别的库"]) { const d = p.defaultCalibrationDb(lib); assert(Number.isFinite(d) && d <= 0 && d >= -30, `${p.name} ${lib}：${d}`); }
    }
    eq(performerOf("tsukuyomi")!.chunkGain, 0.89 / 0.42);
    for (const n of ["tsukuyomi", "vowel-sampler", "soundfont"]) eq(performerOf(n)!.defaultCalibrationDb(n === "soundfont" ? "generaluser-gs-2.0.3" : null), CALIBRATION_DEFAULT_DB, n);
  });
  it("结构：公共的出声代码（src/engine、src/core、src/score）里不声明、不引进针对某个引擎的音量数；退场的三个名字哪儿都没有了", () => {
    const bad: string[] = [];
    for (const d of ["engine/", "core/", "score/"]) for (const f of walk(d)) {
      const c = code(f);
      for (const m of c.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) if (ENGINE_VOLUME.test(m[1]!)) bad.push(`${f} 声明了 ${m[1]}`);
      for (const m of c.matchAll(/import\s*\{([^}]*)\}\s*from/g)) for (const n of m[1]!.split(",").map((x) => x.trim().split(/\s+as\s+/)[0]!)) if (n && (ENGINE_VOLUME.test(n) || n === "BUILTIN_CALIBRATION_DB")) bad.push(`${f} 引进了 ${n}`);
    }
    for (const f of walk("")) for (const n of ["SUNG_GAIN", "DEFAULT_CALIBRATION_DB", "SOUNDFONT_CALIBRATION_DB", "UNWRITTEN_CALIBRATION_DB", "BUILTIN_CALIBRATION_DB", "LIBRARY_CALIBRATION_DB", "OWN_SF2_CALIBRATION_DB"]) if (new RegExp(`\\b${n}\\b`).test(code(f))) bad.push(`${f} 还在用 ${n}`);
    assert(!bad.length, bad.join("；"));
  });
});
