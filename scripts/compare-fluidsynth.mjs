#!/usr/bin/env node
// compare-fluidsynth.mjs —— 我们的引擎 vs 标准播放器（FluidSynth）对照表：各件相对中位数的位置差 ≤ 1.5 dB、八档相对 mf 差 ≤ 1.0 dB（施工单 9-4）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。动引擎（vendor/tsf/）和发版前手动跑，结果写进施工记录。
//   用法：node scripts/compare-fluidsynth.mjs --sf2=<整包.sf2> --ref=<scripts/fluidsynth-reference.py 出的表.json>
//   对照表里的 sha256 必须和这份 sf2 一样（不一样 = 不是同一份字节，停）。超了的按名字列出来；退出码 = 超了几件（0 = 都在里面）。
import fs from "node:fs";
import crypto from "node:crypto";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { SR, ourLufs, compare, selfCheck } from "../test/fixtures/sf2/loudness.mjs";
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const sf2 = arg("sf2"), refPath = arg("ref"), tolPos = Number(arg("tol-pos") ?? 1.5), tolRel = Number(arg("tol-rel") ?? 1.0);
if (!sf2 || !refPath) { console.error("用法：node scripts/compare-fluidsynth.mjs --sf2=<.sf2> --ref=<表.json>"); process.exit(2); }
const ref = JSON.parse(fs.readFileSync(refPath, "utf8")), bytes = new Uint8Array(fs.readFileSync(sf2)), sha = crypto.createHash("sha256").update(bytes).digest("hex");
const file = ref.files.find((f) => f.sha256 === sha);
if (!file) { console.error(`对照表里没有这份 sf2（sha256 ${sha}）`); process.exit(2); }
const check = selfCheck(); if (Math.abs(check + 3.01) > 0.02) { console.error(`量法自检没过：${check}`); process.exit(2); }
const tsf = await instantiateTsf(fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url))), bank = tsf.load(bytes, SR, 256);
const ours = file.cases.map((c) => ref.velocities.map((v) => ourLufs(tsf, bank.handle, c.bank, c.program, c.key, v)));
const rows = compare(file.cases, ours, ref.velocities);
console.log(`FluidSynth ${ref.fluidsynth}（${JSON.stringify(ref.settings)}）· ${file.name}`);
console.log(`件`.padEnd(22, "　") + "  位置差   相对 mf 差（" + ref.velocities.join(" / ") + "）");
let over = 0;
for (const r of rows) {
  const bad = Math.abs(r.pos) > tolPos || Math.abs(r.rel) > tolRel; if (bad) over++;
  console.log(`${bad ? "超 " : "   "}${r.label.padEnd(18, "　")} ${r.pos >= 0 ? "+" : ""}${r.pos.toFixed(2).padStart(5)}   ${r.rels.map((d) => (d >= 0 ? "+" : "") + d.toFixed(2)).join(" ")}`);
}
console.log(`超了 ${over} 件（位置 ±${tolPos} dB、相对 mf ±${tolRel} dB）`);
process.exit(over);
