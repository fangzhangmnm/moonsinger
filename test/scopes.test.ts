// 李萨如图 + 左右相关（src/ui/scopes.ts；v0.10.16）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { stereoShape } from "../src/ui/scopes.ts";

const sine = (n: number, f = 0.013, a = 0.5) => Float32Array.from({ length: n }, (_, i) => a * Math.sin(2 * Math.PI * f * i));
const pts = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
describe("李萨如图 / 左右相关", () => {
  it("单声道（左右一样）= 相关 +1、一根竖线", () => {
    const x = sine(1024), g = stereoShape(x, x);
    assert(Math.abs(g.corr! - 1) < 1e-6, `相关 ${g.corr}`);
    assert(pts(g.path).every(([px]) => Math.abs(px) < 1e-3), "都在竖线上");
  });
  it("反相（右 = −左）= 相关 −1、一根横线", () => {
    const x = sine(1024), g = stereoShape(x, x.map((v) => -v));
    assert(Math.abs(g.corr! + 1) < 1e-6, `相关 ${g.corr}`);
    assert(pts(g.path).every(([, py]) => Math.abs(py) < 1e-3), "都在横线上");
  });
  it("只有左声道 = 左上那条斜线（相位表老规矩）、相关 0", () => {
    const x = sine(1024), g = stereoShape(x, new Float32Array(1024));
    eq(g.corr, 0);
    assert(pts(g.path).every(([px, py]) => Math.abs(px - py) < 1e-3), "x = y：正半周落在左上");
    assert(pts(g.path).some(([px, py]) => px < -0.3 && py < -0.3), "有点在左上");
  });
  it("静音 = 没有相关（不是 0 也不是 1）；小声不被放大成满格", () => {
    eq(stereoShape(new Float32Array(1024), new Float32Array(1024)).corr, null);
    const q = sine(1024, 0.013, 0.01), g = stereoShape(q, q);
    assert(Math.max(...pts(g.path).map(([, py]) => Math.abs(py))) < 0.3, "0.01 的小声画得也小");
  });
});
describe("李萨如图 = 圆滑的线（v0.10.17）", () => {
  it("过中点的二次曲线连（不是散点、不是直线折线）", () => {
    const x = Float32Array.from({ length: 1024 }, (_, i) => 0.5 * Math.sin(i / 7)), g = stereoShape(x, x.map((v, i) => 0.5 * Math.cos(i / 7)));
    assert(!/h0/.test(g.path) && (g.path.match(/Q/g) ?? []).length >= 500, `${(g.path.match(/Q/g) ?? []).length} 段曲线`);
  });
});
