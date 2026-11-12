// SoundFont 照规范放：音量 = (力度 ÷ 127)²（施工单第 9 节，2026-11-12；user「立刻最先修」「我无法容忍backward compatibility 错误的convention」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。src/gm/tsf-standalone.ts sfNoteOnSquared：敲下去之前把这个播放器的总音量设成这一下的力度。
import { describe, it, assert } from "./runner.mjs";
import { instantiateTsf, type Tsf, type TsfBank } from "../src/gm/tsf-standalone.ts";
import { MARK_DEFAULTS } from "../src/format/performance.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

const SR = 48000;
const wasm = () => fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)) as BufferSource;
const sine = fs.readFileSync(new URL("./fixtures/sf2/gu-sine-wave.sf2", import.meta.url)) as Uint8Array;
/** 一个音按住 0.3 秒，量中间那一段的 RMS（dB）。old = 改之前的放法（直接敲，总音量 1）。 */
function rms(tsf: Tsf, bank: TsfBank, vel: number, old = false): number {
  const n = Math.round(SR * 0.3), out = new Float32Array(n);
  tsf.reset(bank); tsf.ex.sf_set_volume(bank.handle, 1);
  if (old) tsf.ex.sf_note_on(bank.handle, 0, 69, vel); else tsf.noteOn(bank, 0, 69, vel);
  tsf.render(bank, out); tsf.allOff(bank);
  let s = 0; const a = Math.round(SR * 0.1); for (let i = a; i < n; i++) s += out[i]! * out[i]!;
  return 10 * Math.log10(s / (n - a));
}
const TABLE = [16, 33, 49, 64, 80, 96, 112, 126];   // 力度表（MuseScore 经典值；mf = 80）

describe("SoundFont 的力度：音量 = 力度的平方（第 9 节）", () => {
  it("每一档：比改之前多出 20·log10(力度 ÷ 127) dB（= 总的按平方）；相对 mf = 40·log10(力度 ÷ 80)（差 ≤ 0.3 dB）；fff 和改之前差 ≤ 0.2 dB", async () => {
    const tsf = await instantiateTsf(wasm()), bank = tsf.load(sine, SR)!;
    const mf = rms(tsf, bank, 80 / 127);
    for (const v of TABLE) {
      const now = rms(tsf, bank, v / 127), before = rms(tsf, bank, v / 127, true);
      assert(Math.abs(now - before - 20 * Math.log10(v / 127)) < 0.05, `力度 ${v}：多出 ${(now - before).toFixed(2)} dB，应该 ${(20 * Math.log10(v / 127)).toFixed(2)}`);
      assert(Math.abs(now - mf - 40 * Math.log10(v / 80)) < 0.3, `力度 ${v}：相对 mf ${(now - mf).toFixed(2)} dB，应该 ${(40 * Math.log10(v / 80)).toFixed(2)}`);
    }
    assert(Math.abs(rms(tsf, bank, 126 / 127) - rms(tsf, bank, 126 / 127, true)) < 0.2, "fff 几乎不变");
    tsf.close(bank);
  });
  it("一处做：敲音只有 sfNoteOnSquared 直接调引擎（录音房的播放 / 离线导出 / 按键试听 / 找乐器的试听、滚奏的每一下、胶水版都经过它）", () => {
    const src = (f: string) => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8") as string;
    const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    const calls = (f: string) => (src(f).replace(/\/\/.*$/gm, "").match(/\._?sf_note_on\s*\(/g) ?? []).length;   // 真的调用（类型声明里的不算）
    const hits = walk("").filter((f) => calls(f) > 0);
    assert(hits.length === 1 && hits[0] === "gm/tsf-standalone.ts" && calls(hits[0]) === 1, `直接敲引擎的地方：${hits.map((f) => `${f} × ${calls(f)}`).join("、")}（只许 tsf-standalone.ts 里 sfNoteOnSquared 那一处）`);
    const studio = src("engine/studio.ts"); assert(!/\bex\.sf_note_on|\b_sf_note_on/.test(studio), "录音房只走 Tsf.noteOn");
  });
  it("同力度同响度：录音房的 Tsf.noteOn（播放、导出、试听都调它）和胶水版的整段渲染一样响", async () => {
    const tsf = await instantiateTsf(wasm()), bank = tsf.load(sine, SR)!, a = rms(tsf, bank, 64 / 127);
    const { wrapTsf } = await import("../src/gm/soundfont.ts"), createTsf = (await import("../vendor/tsf/tsf.mjs" as string)).default;
    const sb = wrapTsf(await createTsf()).load(sine, SR), out = sb.render([{ preset: 0, key: 69, vel: 64 / 127, t0: 0, t1: 0.3 }], 0);
    let s = 0; const lo = Math.round(SR * 0.1), hi = Math.round(SR * 0.3); for (let i = lo; i < hi; i++) s += out[i]! * out[i]!;
    const b = 10 * Math.log10(s / (hi - lo)); assert(Math.abs(a - b) < 0.05, `独立版 ${a.toFixed(2)} vs 胶水版 ${b.toFixed(2)} dB`);
    sb.close(); tsf.close(bank);
    void MARK_DEFAULTS;
  });
});
