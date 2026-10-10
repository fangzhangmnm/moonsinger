// 混音台 EQ 页卡片背景的频谱 + EQ 响应曲线（src/ui/spectrum.ts、engine/fx.ts eqResponseDb；v0.10.11）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { bandsDb, bandHz, xOfHz, SPEC_BANDS, areaPath } from "../src/ui/spectrum.ts";
import { eqResponseDb } from "../src/engine/fx.ts";

describe("频谱（加窗 FFT → 96 个对数频带）", () => {
  it("1 kHz 满幅正弦 = 1 kHz 那一带约 0 dBFS，离得远的低很多", () => {
    const sr = 48000, x = Float32Array.from({ length: 2048 }, (_, i) => Math.sin((2 * Math.PI * 1000 * i) / sr));
    const b = bandsDb(x, sr); let k1 = 0; for (let k = 0; k < SPEC_BANDS; k++) if (Math.abs(Math.log(bandHz(k) / 1000)) < Math.abs(Math.log(bandHz(k1) / 1000))) k1 = k;
    assert(Math.abs(b[k1]) < 1.5, `1 kHz 带 ${b[k1].toFixed(1)} dB`);
    assert(b[0] < -40 && b[SPEC_BANDS - 1] < -40, `两头 ${b[0].toFixed(1)} / ${b[SPEC_BANDS - 1].toFixed(1)}`);
  });
  it("横坐标按对数、单调；填充面是闭合路径", () => {
    assert(xOfHz(30) === 0 && Math.abs(xOfHz(16000) - 1) < 1e-12 && xOfHz(100) < xOfHz(1000));
    const p = areaPath(new Float32Array(SPEC_BANDS).fill(-30)); assert(p.startsWith("M0,100") && p.endsWith("Z"));
  });
});
describe("EQ 响应曲线（和录音房同一份双二阶系数）", () => {
  const at = (p: Record<string, number>, f: number) => eqResponseDb(p, 48000, [f])[0];
  it("全平 = 处处 0 dB", () => { for (const f of [50, 1000, 10000]) assert(Math.abs(at({}, f)) < 1e-6); });
  it("低切 200 Hz：50 Hz 大幅衰减、2 kHz 不变；高架 +6 dB（5 kHz）：10 kHz 约 +6", () => {
    assert(at({ hpHz: 200 }, 50) < -20, `${at({ hpHz: 200 }, 50)}`); assert(Math.abs(at({ hpHz: 200 }, 2000)) < 0.5);
    assert(Math.abs(at({ highDb: 6 }, 10000) - 6) < 1, `${at({ highDb: 6 }, 10000)}`); eq(Math.abs(at({ highDb: 6 }, 100)) < 0.5, true);
  });
});
