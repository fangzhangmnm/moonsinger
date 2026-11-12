// 「这一下力度让它多响」那一项 L(键, 力度)（src/gm/sf2-subset.ts sf2VelocityCurve；施工单 7-N，2026-11-12，统筹选 A）：拿引擎本身逐格核。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。引擎那一头 = vendor/tsf/tsf-glue.c 的只读探针 sf_region_atten（报出这个键、这个力度下每个响的区实际施加的衰减）。
//   条件（统筹）：只有一层响时 L 必须和引擎逐值相同；几层同时响按功率加（假定每层采样一样响）。整包 GS 的核对是手动跑的，结果在施工记录 7-N。
import { describe, it, eq, assert } from "./runner.mjs";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { sf2VelocityCurve, listSf2Presets } from "../src/gm/sf2-subset.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");
const FILES = ["gu-sine-wave.sf2", "gu-square-castanets.sf2", "gu-tonewheel-novel.sf2"];

describe("L(键, 力度)：app 自己的那一份 = 引擎实际施加的（7-N）", () => {
  it("仓里的子集：每个预设 × 键 0–127 × 力度 1–127，响的区一样多、每一区的衰减差 < 0.001 dB；只有一层响时 L = −那一层的衰减", async () => {
    const tsf = await instantiateTsf(fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)));
    const ex = tsf.ex, out = ex.malloc(16 * 4);
    let cells = 0, single = 0;
    for (const name of FILES) {
      const bytes = new Uint8Array(fs.readFileSync(new URL(`./fixtures/sf2/${name}`, import.meta.url))), bank = tsf.load(bytes, 48000)!;
      for (const p of listSf2Presets(bytes)) {
        const c = sf2VelocityCurve(bytes, p.bank, p.program)!, pi = ex.sf_preset_index(bank.handle, p.bank, p.program);
        for (let key = 0; key < 128; key++) for (let v = 1; v < 128; v++) {
          const n = ex.sf_region_atten(bank.handle, pi, key, v / 127, out, 16), eng = [...new Float32Array(ex.memory.buffer, out, Math.min(n, 16))].sort((a, b) => a - b), js = c.regions(key, v).sort((a, b) => a - b);
          eq(js.length, n, `${name} ${p.bank}:${p.program} 键 ${key} 力度 ${v}：响的区数`);
          js.forEach((a, i) => assert(Math.abs(a - eng[i]!) < 1e-3, `${name} ${p.bank}:${p.program} 键 ${key} 力度 ${v}：${a} vs 引擎 ${eng[i]}`));
          const L = c.at(key, v);
          if (n === 0) eq(L, null); else if (n === 1) { single++; assert(Math.abs(L! + eng[0]!) < 1e-3, "一层：L = −衰减"); }
          cells++;
        }
      }
      tsf.close(bank);
    }
    ex.free(out);
    assert(cells > 40000 && single > 30000, `核了 ${cells} 格（一层响的 ${single} 格）`);
  });
  it("深度 800 的一层：相邻两档力度之间 L 的差 = 800 ÷ 960 × 40·log10(力度比)（和 velocityDb 同一条）", () => {
    const bytes = new Uint8Array(fs.readFileSync(new URL("./fixtures/sf2/gu-sine-wave.sf2", import.meta.url))), c = sf2VelocityCurve(bytes, 8, 80)!;
    for (const [a, b] of [[16, 80], [49, 96], [64, 126]] as const) { const d = c.at(69, b)! - c.at(69, a)!, want = (800 / 960) * 40 * Math.log10(b / a); assert(Math.abs(d - want) < 0.01, `${a} → ${b}：${d.toFixed(3)} vs ${want.toFixed(3)}`); }
    eq(sf2VelocityCurve(bytes, 0, 0), null, "没有这个预设");
  });
});
