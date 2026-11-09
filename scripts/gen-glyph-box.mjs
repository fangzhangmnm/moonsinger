// gen-glyph-box.mjs —— 音乐字形的墨迹框表（src/render/glyph-box.gen.ts）。created 2026-11-09 by Claude Opus 5.5
// 刀 4b 的天际线要知道每个字形占多大：从仓里的 Bravura 轮廓（vendor/fonts/bravura/outlines.json，PDF 也用它）算，曲线按 16 段采样取紧框。
// 单位 = 线间距（默认字号 4 sp = 1 em）；屏幕方向：top < 0 = 基线以上。test/glyph-box.test.ts 守着表和轮廓一致（轮廓重出了没重跑这个 = 红）。
// 跑：node scripts/gen-glyph-box.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function glyphBoxes(outlines) {
  const per = outlines.unitsPerEm / 4, out = {};
  for (const [hex, g] of Object.entries(outlines.glyphs)) {
    const t = g.d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
    let i = 0, cmd = "", x = 0, y = 0, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const add = (a, b) => { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); };
    const num = () => Number(t[i++]);
    while (i < t.length) {
      if (/^[A-Za-z]$/.test(t[i])) { cmd = t[i++].toUpperCase(); if (cmd === "Z") continue; }
      if (cmd === "M" || cmd === "L") { x = num(); y = num(); add(x, y); }
      else if (cmd === "H") { x = num(); add(x, y); }
      else if (cmd === "V") { y = num(); add(x, y); }
      else if (cmd === "C") {
        const ax = num(), ay = num(), bx = num(), by = num(), cx = num(), cy = num();
        for (let k = 1; k <= 16; k++) { const s = k / 16, u = 1 - s; add(u * u * u * x + 3 * u * u * s * ax + 3 * u * s * s * bx + s * s * s * cx, u * u * u * y + 3 * u * u * s * ay + 3 * u * s * s * by + s * s * s * cy); }
        x = cx; y = cy;
      } else throw new Error(`gen-glyph-box: ${hex} 不认识的命令 ${cmd}`);
    }
    if (x0 === Infinity) continue;
    const r = (v) => Math.round(v * 1000) / 1000;
    out[String.fromCodePoint(parseInt(hex, 16))] = [r(x0 / per), r(x1 / per), r(-y1 / per), r(-y0 / per)];   // 字形坐标 y 向上 → 屏幕 top = −yMax
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const outlines = JSON.parse(readFileSync(new URL("../vendor/fonts/bravura/outlines.json", import.meta.url), "utf8"));
  const boxes = glyphBoxes(outlines), keys = Object.keys(boxes).sort();
  const body = keys.map((k) => `  "\\u{${k.codePointAt(0).toString(16).toUpperCase()}}": [${boxes[k].join(", ")}],`).join("\n");
  writeFileSync(new URL("../src/render/glyph-box.gen.ts", import.meta.url), `// 生成的，别手改：node scripts/gen-glyph-box.mjs（从 vendor/fonts/bravura/outlines.json）。\n// 每个音乐字形的墨迹框 [左, 右, 上, 下]（线间距；默认字号 4 sp；上 < 0 = 基线以上）。刀 4b 天际线用。\nexport const GLYPH_BOX: Record<string, readonly [number, number, number, number]> = {\n${body}\n};\n`);
  console.log(`glyph-box.gen.ts: ${keys.length} 个字形`);
}
