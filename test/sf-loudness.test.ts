// 我们的引擎 vs 标准播放器（FluidSynth）：各件乐器之间的轻重、八档力度的强弱（施工单 9-4，2026-11-12；user「我们现在放出来的各件乐器之间的轻重，是不是这个库作者本来的意思」
//   →「真正该对齐的是：我们的引擎和标准播放器 对齐」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   对照表 = test/fixtures/sf2/fluidsynth-reference.json（scripts/fluidsynth-reference.py 用这台机器的 FluidSynth 对仓里的几个子集出的，版本和设置写在表里；
//   FluidSynth 不是 app 的依赖，重出见脚本头）。量法同一份（test/fixtures/sf2/loudness.mjs）。整包 GS 的对照是手动跑的 scripts/compare-fluidsynth.mjs，结果在施工记录。
//   容差：各件「mf 的响度相对全体中位数」两边差 ≤ 1.5 dB；八档「相对 mf」两边差 ≤ 1.0 dB。超了的要进 ALLOWED（写原因），名单外 = 红；名单里的没超 = 也红（修好了划掉）。
import { describe, it, eq, assert } from "./runner.mjs";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { sf2VelocityDepths } from "../src/gm/sf2-subset.ts";
import { SR, ourLufs, compare, selfCheck } from "./fixtures/sf2/loudness.mjs";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs"), crypto = nodeMod("node:crypto");

type RefCase = { label: string; bank: number; program: number; key: number; lufs: number[] };
const REF = JSON.parse(fs.readFileSync(new URL("./fixtures/sf2/fluidsynth-reference.json", import.meta.url), "utf8")) as { fluidsynth: string; velocities: number[]; files: { name: string; sha256: string; cases: RefCase[] }[] };
/** 超了也认的（写原因）。现在仓里的子集一件都没超。 */
const ALLOWED: Record<string, string> = {};

describe("我们的引擎 vs 标准播放器（9-4）", () => {
  it("量法自检：997 Hz 满幅正弦 = −3.01（BS.1770）", () => { const c = selfCheck() as number; assert(Math.abs(c + 3.01) < 0.02, `${c}`); });
  it(`对照表（FluidSynth ${REF.fluidsynth}）对的就是仓里这几份字节；盖到力度深度 800、0 和一件打击乐`, () => {
    for (const f of REF.files) eq(crypto.createHash("sha256").update(fs.readFileSync(new URL(`./fixtures/sf2/${f.name}`, import.meta.url))).digest("hex"), f.sha256, f.name);
    const depths = REF.files.flatMap((f) => f.cases.map((c) => sf2VelocityDepths(new Uint8Array(fs.readFileSync(new URL(`./fixtures/sf2/${f.name}`, import.meta.url))), c.bank, c.program, c.key)![0]));
    assert(depths.includes(800) && depths.includes(0), `深度 ${depths.join(" / ")}`);
    assert(REF.files.some((f) => f.cases.some((c) => c.label === "Castanets")), "打击乐（Castanets，一次性）");
  });
  it("各件相对中位数的位置差 ≤ 1.5 dB、八档相对 mf 差 ≤ 1.0 dB（名单外 = 红；名单里没超的 = 也红）", async () => {
    const wasm = fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)), cases: RefCase[] = [], ours: number[][] = [];
    for (const f of REF.files) {
      const tsf = await instantiateTsf(wasm), bank = tsf.load(new Uint8Array(fs.readFileSync(new URL(`./fixtures/sf2/${f.name}`, import.meta.url))), SR, 64)!;
      for (const c of f.cases) { cases.push(c); ours.push(REF.velocities.map((v) => ourLufs(tsf, bank.handle, c.bank, c.program, c.key, v))); }
      tsf.close(bank);
    }
    const rows = compare(cases, ours, REF.velocities) as { label: string; pos: number; rel: number; rels: number[] }[], bad: string[] = [];
    for (const r of rows) {
      const over = Math.abs(r.pos) > 1.5 || Math.abs(r.rel) > 1.0;
      if (over && !(r.label in ALLOWED)) bad.push(`${r.label}：位置差 ${r.pos.toFixed(2)}，相对 mf 差 ${r.rels.map((d) => d.toFixed(2)).join(" ")}`);
      if (!over && r.label in ALLOWED) bad.push(`${r.label} 已经不超了：从 ALLOWED 划掉`);
    }
    assert(!bad.length, bad.join("\n"));
  });
});
