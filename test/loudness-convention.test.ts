// 力度 → 响度全体演奏者只有一条（施工单第 9 节 / 9-2，2026-11-12；user「按照SoundFont对齐，然后小月相也应该对齐」「这个就是我绝对无法容忍的那个东西」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。响度 = 40·log10(力度 ÷ 127)（score/perform.ts velocityDb）；力度记号查力度表（全体一张，没带 = 标准表）；
//   渐强渐弱 / 渐到在力度上按时间线性；按值存的 dynamicsDb / wedgeStepDb 退役（lounge 3：迁移 2→3 删掉、写时没有；统筹裁定走大版本）。
import { describe, it, eq, assert } from "./runner.mjs";
import { gainSegments, velocityDb, SF2_VEL_DEPTH, type PerfSpec } from "../src/score/perform.ts";
import { performerOf } from "../src/performers/index.ts";
import { DYNAMICS_VEL, ARTICULATION, MARK_DEFAULTS } from "../src/format/performance.ts";
import { initState, tr, TPQ, DYNS, type Token, type Dyn } from "../src/score/song.ts";
import { openBytes, activePerfSpec } from "../src/format/project.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

/** 小月相 / 元音版这一路（按音量曲线）的规格：力度表 = 标准表。 */
const SING: PerfSpec = { ...MARK_DEFAULTS, dynamicsVel: { ...DYNAMICS_VEL }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb } as PerfSpec;
let id = 9900;
const note = (dur = TPQ): Token => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric: null }) as Token;
const dyn = (value: Dyn): Token => ({ kind: "dyn", id: id++, value }) as Token;
const line = (items: Token[]) => [...tr(initState()).slice(0, 3), ...items];
const map = [{ tick: 0, bpm: 60 }] as never;   // 一拍一秒

describe("力度 → 响度：全体一条（9-2）", () => {
  it("小月相 / 元音版：八档力度记号的音量曲线水平 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)（和乐器同一个式子，不以 mf 为 0；深度 = 插件报的 800，9-4）", () => {
    for (const name of ["tsukuyomi", "vowel-sampler"]) eq(performerOf(name)!.velocityDepth, 800, `${name} 报的力度深度`);
    const at800 = { ppp: -30.0, pp: -19.5, p: -13.8, mp: -9.9, mf: -6.7, f: -4.0, ff: -1.8, fff: -0.1 } as Record<string, number>;   // 统筹 2026-11-12 给的数
    for (const depth of [SF2_VEL_DEPTH, 800]) for (const d of DYNS) {
      const g = gainSegments(line([dyn(d), note()]), map, SING, undefined, undefined, false, depth)!, want = (depth / 960) * 40 * Math.log10(DYNAMICS_VEL[d] / 127);
      assert(g.every((s) => Math.abs(s.dB - want) < 0.05), `深度 ${depth} ${d}：${g.map((s) => s.dB.toFixed(2)).join(" ")}，应该 ${want.toFixed(2)}`);
      if (depth === 800) assert(Math.abs(want - at800[d]!) < 0.06, `${d}：${want.toFixed(2)} vs ${at800[d]}`);
    }
    assert(Math.abs(velocityDb(DYNAMICS_VEL.mf) - 40 * Math.log10(80 / 127)) < 1e-12 && Math.abs(velocityDb(127)) < 1e-12 && Math.abs(velocityDb(127, 800)) < 1e-12, "满力度 = 0 dB");
  });
  it("p 渐强到 f：一个长音里每一小段 = 力度按时间线性、再换成 dB（不是在 dB 上线性）", () => {
    const toks = line([dyn("p"), { kind: "hairpin", id: id++, dir: "cresc" } as Token, note(4 * TPQ), dyn("f"), note()]);
    const g = gainSegments(toks, map, SING)!, inA = g.filter((s) => s.t1 <= 4 + 1e-9);
    assert(inA.length > 4, "切成了小段");
    for (const s of inA) { const fr = (s.t0 + s.t1) / 2 / 4, v = DYNAMICS_VEL.p + (DYNAMICS_VEL.f - DYNAMICS_VEL.p) * fr; assert(Math.abs(s.dB - velocityDb(v)) < 1e-6, `${s.t0.toFixed(2)} 秒：${s.dB.toFixed(3)} vs 力度线性 ${velocityDb(v).toFixed(3)}`); }
    const mid = velocityDb((DYNAMICS_VEL.p + DYNAMICS_VEL.f) / 2), dbMid = (velocityDb(DYNAMICS_VEL.p) + velocityDb(DYNAMICS_VEL.f)) / 2;
    assert(Math.abs(mid - dbMid) > 0.5, "两种走法在中点差得出来（不然这条测不出东西）");
  });
  it("结构：src 里不再有 dynamicsDb / wedgeStepDb / DYNAMICS_DB——只剩契约的历史注释（第 16 条起没有迁移；16-4 起小月相的 dB 表恢复时这一条跟着改）", () => {
    const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    const read = (f: string) => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8") as string;
    const bad: string[] = [];
    for (const f of walk("")) {
      if (f === "i18n/strings.ts") continue;   // 界面字表另有「不用的字」守卫
      const src = read(f), lines = src.split("\n");
      lines.forEach((l, k) => {
        if (!/dynamicsDb|wedgeStepDb|DYNAMICS_DB/.test(l)) return;
        const comment = /^\s*(\/\/|\*|\/\*\*)/.test(l) || /\/\/.*(dynamicsDb|wedgeStepDb|DYNAMICS_DB)/.test(l) || /\/\*[^*]*(dynamicsDb|wedgeStepDb)[^*]*\*\//.test(l);
        if (!comment) bad.push(`${f}:${k + 1}`);
      });
    }
    assert(!bad.length, `还在用：${bad.join("、")}`);
  });
  it("老文件照写的读（第 16 条，没有迁移）：第 2 版的三个样本读得开，候选身上带着的 dynamicsDb / wedgeStepDb 原样留在读进来的休息室里（运行时不读）、力度表照常；第 1 版的两个样本谱的扩展没有纸的表 = 读不懂、明说", () => {
    for (const dir of ["v2-2-2-1", "v2-2-2-2", "v2-2-3-2"]) {
      const o = openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL(`fixtures/format/${dir}/sample.mxl`, import.meta.url))));
      for (const role of Object.keys(o.extras.lounge)) { const sp = activePerfSpec(o.extras, role); assert(DYNS.every((d) => sp.dynamicsVel[d] >= 1 && sp.dynamicsVel[d] <= 127), `${dir} ${role}：力度表`); }
    }
    for (const dir of ["v1-1-1-1", "v1-1-2-1"]) {
      let threw = ""; try { openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL(`fixtures/format/${dir}/sample.mxl`, import.meta.url)))); } catch (e) { threw = (e as Error).message; }
      assert(/读不懂/.test(threw), `${dir}：${threw}`);
    }
  });
});
