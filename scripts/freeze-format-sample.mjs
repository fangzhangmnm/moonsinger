#!/usr/bin/env node
// freeze-format-sample.mjs —— 冻结这一版的 .mxl 样本 + 形状快照（持久化向后兼容的证据）。created 2026-10-07 by Claude Fable 5.1
// 用法：node scripts/freeze-format-sample.mjs [--force]（已有的版本目录默认不碰，只更新 shape.json）
//   写 test/fixtures/format/v<manifest>-<score>-<lounge>-<studio>/{sample.mxl,expected.json}（按当前 FORMAT 命名；旧版的目录**不删**——守卫测试要拿它们验「老文件永远能开」）
//   和 test/fixtures/format/shape.json（当前写出来的各份 JSON 的键形状）。
// 什么时候跑：① 改了 FORMAT（升版本）→ 生成新版目录、旧目录保留；② 只加了可选字段（不升版本）→ 形状快照更新，审 diff。守卫测试 = test/format-guard.test.ts。
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { saveMxl, openBytes, emptyExtras, activeInstrument, withActive, FORMAT } from "../src/format/project.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";
import { sampleSong, canonTokens, shapeOf } from "../test/fixtures/format/sample-song.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tag = `v${Object.values(FORMAT).join("-")}`;
const dir = join(ROOT, "test/fixtures/format", tag);
const force = process.argv.includes("--force");
const exists = existsSync(join(dir, "sample.mxl"));
mkdirSync(dir, { recursive: true });
const song = sampleSong();
const bytes = saveMxl({ song, hum: song.hum, extras: withActive(emptyExtras(), "c2", song.hum), app: "frozen-sample", date: "2026-10-07T00:00:00.000Z" });   // 上场 = 月读元音版（同 v1 样本的 quality light）
const o = openBytes("sample.mxl", bytes);
const files = unzipSync(bytes);
const json = (p) => JSON.parse(strFromU8(files[p]));
const role = json(".moonsinger/lounge/r1.json"), studio = json(".moonsinger/studio.json");
const expected = {
  versions: FORMAT, title: song.title, hum: o.hum, engine: activeInstrument(o.extras)?.engine ?? "unknown", tokens: canonTokens(song),
  role: { name: role.name, sound: role.sound, active: role.active, candidates: role.candidates.map((c) => c.id) },
  mics: studio.mics.map((m) => m.id),
};
// 已有的版本目录不碰（zip 里有时间戳，重写只会给 diff 添噪音——编辑器 session 2026-10-07 指出）；要重生成加 --force。
if (!exists || force) {
  writeFileSync(join(dir, "sample.mxl"), bytes);
  writeFileSync(join(dir, "expected.json"), JSON.stringify(expected, null, 2) + "\n");
}
const shape = { versions: FORMAT, shapes: {
  manifest: shapeOf(json(".moonsinger/manifest.json")), score: shapeOf(json(".moonsinger/score.json")),
  lounge: shapeOf(role), studio: shapeOf(studio),
} };
writeFileSync(join(ROOT, "test/fixtures/format/shape.json"), JSON.stringify(shape, null, 2) + "\n");
console.log(`${exists && !force ? `kept test/fixtures/format/${tag}/ (use --force to regenerate)` : `frozen: test/fixtures/format/${tag}/`} + shape.json`);
