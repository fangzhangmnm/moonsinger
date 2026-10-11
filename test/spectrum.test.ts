// 混音台 EQ 页卡片背景的频谱 + EQ 响应曲线（src/ui/spectrum.ts、engine/fx.ts eqResponseDb；v0.10.11）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { bandsDb, bandHz, xOfHz, SPEC_BANDS, areaPath } from "../src/ui/spectrum.ts";
import { eqResponseDb } from "../src/engine/fx.ts";

describe("频谱（加窗 FFT → 96 个对数频带）", () => {
  it("1 kHz 满幅正弦：功率都在 1 kHz 那一点（每八度功率 = 1 ÷ 一个点宽几个八度 ≈ +10 dB），离得远的低很多", () => {
    const sr = 48000, x = Float32Array.from({ length: 2048 }, (_, i) => Math.sin((2 * Math.PI * 1000 * i) / sr));
    const b = bandsDb(x, sr); let k1 = 0; for (let k = 0; k < SPEC_BANDS; k++) if (Math.abs(Math.log(bandHz(k) / 1000)) < Math.abs(Math.log(bandHz(k1) / 1000))) k1 = k;
    const want = -10 * Math.log10(Math.log2(16000 / 30) / SPEC_BANDS);
    assert(Math.abs(b[k1] - want) < 1.5, `1 kHz 那一点 ${b[k1].toFixed(1)} dB（应 ≈ ${want.toFixed(1)}）`);
    assert(b[0] < want - 40 && b[SPEC_BANDS - 1] < want - 40, `两头 ${b[0].toFixed(1)} / ${b[SPEC_BANDS - 1].toFixed(1)}`);
  });
  it("每八度功率（v0.10.28，user「not discrete bands, but perhaps power per octave?」）：同一小段里两个分音 = 加起来（+3 dB）；白噪声每八度 +3 dB——高处、低处（比一格还窄的地方）都一样", () => {
    const sr = 48000, N = 2048, band = (f: number) => { let k1 = 0; for (let k = 0; k < SPEC_BANDS; k++) if (Math.abs(Math.log(bandHz(k) / f)) < Math.abs(Math.log(bandHz(k1) / f))) k1 = k; return k1; };
    const tone = (fs: number[]) => Float32Array.from({ length: N }, (_, i) => fs.reduce((a, f) => a + 0.25 * Math.sin((2 * Math.PI * f * i) / sr + f), 0));
    const k = band(4000), c = bandHz(k), one = bandsDb(tone([c]), sr)[k], two = bandsDb(tone([c - 40, c + 40]), sr)[k];   // 这一小段约 270 Hz 宽：两个都在里面、隔 3 格多
    assert(Math.abs(two - one - 3) < 1.2, `两个分音 ${two.toFixed(2)} vs 一个 ${one.toFixed(2)}（应 +3 dB）`);
    let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
    const runs = Array.from({ length: 24 }, () => bandsDb(Float32Array.from({ length: N }, rnd), sr));
    const avg = (f0: number, f1: number) => { let s = 0, c2 = 0; for (const b of runs) for (let q = 0; q < SPEC_BANDS; q++) if (bandHz(q) > f0 && bandHz(q) < f1) { s += b[q]; c2++; } return s / c2; };
    const hiStep = avg(8000, 16000) - avg(1000, 2000), loStep = avg(120, 240) - avg(60, 120);
    assert(Math.abs(hiStep - 9) < 2.5, `高处：8–16 kHz 比 1–2 kHz 高 ${hiStep.toFixed(1)} dB（三个八度 ≈ +9）`);
    assert(Math.abs(loStep - 3) < 2, `低处（比 FFT 一格还窄）：120–240 比 60–120 高 ${loStep.toFixed(1)} dB（一个八度 ≈ +3；以前一格整个算进去 ≈ 0）`);
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
