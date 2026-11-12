// SoundFont 的力度：引擎照库给每件乐器写的力度曲线算（施工单第 9 节 → 9-4，2026-11-12；user「立刻最先修」「我无法容忍backward compatibility 错误的convention」
//   →「真正该对齐的是：我们的引擎和标准播放器 对齐」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   第 9 节先在外面包了一层（敲之前把总音量设成力度 = 全体按平方）；9-4 改成引擎自己读库里每个区的「力度 → 初始衰减」调制器（vendor/tsf/patch-tsf.py 补丁 2，照 FluidSynth）：
//   响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)，深度没写 = 960（= 平方）。和标准播放器的对照在 test/sf-loudness.test.ts。
import { describe, it, assert, eq } from "./runner.mjs";
import { instantiateTsf, type Tsf, type TsfBank } from "../src/gm/tsf-standalone.ts";
import { sf2VelocityDepths } from "../src/gm/sf2-subset.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

const SR = 48000;
const wasm = () => fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)) as BufferSource;
const fixture = (n: string) => new Uint8Array(fs.readFileSync(new URL(`./fixtures/sf2/${n}`, import.meta.url)));
/** 一个音按住 0.3 秒，量中间那一段的 RMS（dB）。 */
function rms(tsf: Tsf, bank: TsfBank, preset: number, key: number, vel: number): number {
  const n = Math.round(SR * 0.3), out = new Float32Array(n);
  tsf.reset(bank); tsf.noteOn(bank, preset, key, vel); tsf.render(bank, out); tsf.allOff(bank);
  let s = 0; const a = Math.round(SR * 0.1); for (let i = a; i < n; i++) s += out[i]! * out[i]!;
  return 10 * Math.log10(s / (n - a));
}
const TABLE = [16, 33, 49, 64, 80, 96, 112, 126];   // 力度表（MuseScore 经典值；mf = 80）

describe("SoundFont 的力度：引擎照库写的力度深度（9-4）", () => {
  it("深度读得对（照 FluidSynth 合：乐器一级盖默认 960、预设一级加上去）：Sine Wave / Square Lead / Castanets = 800，Tonewheel Org noVel = 0", () => {
    eq(JSON.stringify(sf2VelocityDepths(fixture("gu-sine-wave.sf2"), 8, 80)), "[800]");   // 乐器一级写 0、预设一级写 800
    eq(JSON.stringify(sf2VelocityDepths(fixture("gu-square-castanets.sf2"), 0, 80)), "[800]");
    eq(JSON.stringify(sf2VelocityDepths(fixture("gu-square-castanets.sf2"), 8, 115)), "[800]");
    eq(JSON.stringify(sf2VelocityDepths(fixture("gu-tonewheel-novel.sf2"), 11, 16)), "[0]");
    eq(sf2VelocityDepths(fixture("gu-sine-wave.sf2"), 0, 0), null, "没有这个预设");
  });
  it("引擎照深度出声：深度 800 的每档相对 mf = 800 ÷ 960 × 40·log10(力度 ÷ 80)（差 ≤ 0.1 dB）；深度 0 的八档一样响（差 ≤ 0.05 dB）", async () => {
    const tsf = await instantiateTsf(wasm());
    { const b = tsf.load(fixture("gu-sine-wave.sf2"), SR)!, p = b.presets[0]!.index, mf = rms(tsf, b, p, 69, 80 / 127);
      for (const v of TABLE) { const d = rms(tsf, b, p, 69, v / 127) - mf, want = (800 / 960) * 40 * Math.log10(v / 80); assert(Math.abs(d - want) < 0.1, `Sine 力度 ${v}：相对 mf ${d.toFixed(2)}，应该 ${want.toFixed(2)}`); }
      tsf.close(b); }
    { const b = tsf.load(fixture("gu-tonewheel-novel.sf2"), SR)!, p = b.presets[0]!.index, mf = rms(tsf, b, p, 60, 80 / 127);
      for (const v of TABLE) { const d = rms(tsf, b, p, 60, v / 127) - mf; assert(Math.abs(d) < 0.05, `风琴 力度 ${v}：相对 mf ${d.toFixed(2)}，应该一样响`); }
      tsf.close(b); }
  });
  it("结构：力度 → 响度只在引擎里一处——src 里没人在敲音前改播放器的总音量（第 9 节那层包装退场了）", () => {
    const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    const src = (f: string) => (fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8") as string).replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    const hits = walk("").filter((f) => /\bsfNoteOnSquared\b|\._?sf_set_volume\s*\(/.test(src(f)));
    assert(!hits.length, `还有：${hits.join("、")}`);
  });
  it("同力度同响度：录音房的 Tsf.noteOn（播放、导出、试听都调它）和胶水版的整段渲染一样响", async () => {
    const tsf = await instantiateTsf(wasm()), bank = tsf.load(fixture("gu-sine-wave.sf2"), SR)!, a = rms(tsf, bank, bank.presets[0]!.index, 69, 64 / 127);
    const { wrapTsf } = await import("../src/gm/soundfont.ts"), createTsf = (await import("../vendor/tsf/tsf.mjs" as string)).default;
    const sb = wrapTsf(await createTsf()).load(fixture("gu-sine-wave.sf2"), SR), out = sb.render([{ preset: 0, key: 69, vel: 64 / 127, t0: 0, t1: 0.3 }], 0);
    let s = 0; const lo = Math.round(SR * 0.1), hi = Math.round(SR * 0.3); for (let i = lo; i < hi; i++) s += out[i]! * out[i]!;
    const b = 10 * Math.log10(s / (hi - lo)); assert(Math.abs(a - b) < 0.05, `独立版 ${a.toFixed(2)} vs 胶水版 ${b.toFixed(2)} dB`);
    sb.close(); tsf.close(bank);
  });
});
