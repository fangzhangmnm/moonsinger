// test/habits-preview.test.ts —— 「初始设置」卡的预览图（统筹「v0.17.30 收」跟进第 2 条）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   previewSvg 是拿正则换 toSvg 的开标签（宽高 + viewBox）：哪天 toSvg 的属性顺序变了，换不上就会悄悄按原大画（不缩、不居中）。这里钉住：
//   三种谱的预览开标签里都有 data-k、0 < k ≤ 1、viewBox 宽高比 = 150 : 92、宽高写的就是 150 × 92；开标签只有一个（没换出两个头）。
import { describe, it, eq, assert } from "./runner.mjs";
import { previewSvg, PREVIEW_W, PREVIEW_H } from "../src/app/panels/habits-preview.ts";
import { NOTATIONS } from "../src/score/song-view.ts";

const measure = (s: string, px: number) => [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 1 : 0.6), 0) * px;

describe("「初始设置」卡的预览图", () => {
  for (const id of NOTATIONS) it(`${id}：开标签换上了（data-k、k ≤ 1、150 : 92）`, () => {
    const svg = previewSvg(id, measure), head = /^<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
    eq((svg.match(/<svg\b/g) ?? []).length, 1, "只有一个 svg 开标签");
    const k = Number(/ data-k="([\d.]+)"/.exec(head)?.[1]);
    assert(Number.isFinite(k) && k > 0 && k <= 1, `data-k = ${k}`);
    assert(head.includes(` width="${PREVIEW_W}" height="${PREVIEW_H}"`), head.slice(0, 160));
    const vb = / viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(head);
    assert(!!vb, "有 viewBox");
    const ratio = Number(vb![3]) / Number(vb![4]);
    assert(Math.abs(ratio - PREVIEW_W / PREVIEW_H) < 0.01, `viewBox 宽高比 ${ratio}`);
    assert(Math.abs(Number(vb![3]) * k - PREVIEW_W) < 0.5, "viewBox 宽 × k = 150（等比缩、没放大）");
    assert(svg.includes("<text"), "真排出来的（有字）");
  });
});
