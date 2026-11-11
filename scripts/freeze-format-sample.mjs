#!/usr/bin/env node
// freeze-format-sample.mjs —— 冻结这一版的 .mxl 样本 + 形状快照（持久化向后兼容的证据）。created 2026-10-07 by Claude Fable 5.1
// 用法：node scripts/freeze-format-sample.mjs [--force]（已有的版本目录默认不碰，只更新 shape.json）
//   写 test/fixtures/format/v<manifest>-<score>-<lounge>-<studio>/{sample.mxl,expected.json}（按当前 FORMAT 命名；旧版的目录**不删**——守卫测试要拿它们验「老文件永远能开」）
//   和 test/fixtures/format/shape.json（当前写出来的各份 JSON 的键形状；2026-10-13 起数组取所有元素的并集、样本把可选字段都用上——见 sample-song.ts 头注释）。
// 什么时候跑：① 改了 FORMAT（升版本）→ 生成新版目录、旧目录保留；② 只加了可选字段（不升版本）→ 形状快照更新，审 diff。守卫测试 = test/format-guard.test.ts。
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { saveMxl, openBytes, activeInstrument, FORMAT } from "../src/format/project.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";
import { sampleSong, sampleView, sampleExtras, canonTokens, canonTracks, shapeOf, mergeShape } from "../test/fixtures/format/sample-song.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tag = `v${Object.values(FORMAT).join("-")}`;
const dir = join(ROOT, "test/fixtures/format", tag);
const force = process.argv.includes("--force");
const exists = existsSync(join(dir, "sample.mxl"));
mkdirSync(dir, { recursive: true });
const song = sampleSong();
const bytes = saveMxl({ song, hum: song.hum, extras: sampleExtras(song), app: "frozen-sample", date: "2026-10-07T00:00:00.000Z", view: sampleView() });   // 上场 = 月读元音版（同 v1 样本的 quality light）；2026-10-13 起休息室 / 录音房的可选字段都摆上（sampleExtras，守卫同一份）
const o = openBytes("sample.mxl", bytes);
const files = unzipSync(bytes);
const json = (p) => JSON.parse(strFromU8(files[p]));
const role = json(".moonsinger/lounge/r1.json"), studio = json(".moonsinger/studio.json");
const expected = {
  versions: FORMAT, title: song.title, hum: o.hum, engine: activeInstrument(o.extras, "r1")?.engine ?? "unknown", tokens: canonTokens(song),
  tracks: canonTracks(song), papers: song.papers.map((p) => ({ id: p.id, name: p.name })), parts: song.parts.map((p) => p.id),   // 0.5.0 起：所有纸 × 声部
  role: { name: role.name, sound: role.sound, active: role.active, candidates: role.candidates.map((c) => c.id) },
  mics: (studio.tracks ?? studio.mics).filter((t) => (t.kind ?? "mic") === "mic").map((m) => m.id),   // v2 起是 tracks（kind mic）；记的还是麦克风 id
};
// 已有的版本目录不碰（zip 里有时间戳，重写只会给 diff 添噪音——编辑器 session 2026-10-07 指出）；要重生成加 --force。
if (!exists || force) {
  writeFileSync(join(dir, "sample.mxl"), bytes);
  writeFileSync(join(dir, "expected.json"), JSON.stringify(expected, null, 2) + "\n");
}
const shape = { versions: FORMAT, shapes: {
  manifest: shapeOf(json(".moonsinger/manifest.json")), score: shapeOf(json(".moonsinger/score.json")),
  lounge: Object.keys(files).filter((p) => /^\.moonsinger\/lounge\/r\d+\.json$/.test(p)).sort().map(json).map(shapeOf).reduce(mergeShape), studio: shapeOf(studio),   // 所有角色的并集（2026-10-13）
} };
writeFileSync(join(ROOT, "test/fixtures/format/shape.json"), JSON.stringify(shape, null, 2) + "\n");
console.log(`${exists && !force ? `kept test/fixtures/format/${tag}/ (use --force to regenerate)` : `frozen: test/fixtures/format/${tag}/`} + shape.json`);

// ── minor 的冻结样本（2026-11-12 Claude Opus 5.5，谱面分家第三刀：施工单「加一份冻结样本」）──
//   升 minor 不开新的版本目录（上面的目录按 major 命名）；某一次 minor 加的东西要「以后的版本永远读得出来」时，在 test/fixtures/format/minor/<文件>-<minor>/ 存一份这一版写的，
//   已有的不碰（--force 才重写）。守卫 = 用它的那份测试（score-5 = test/song-view.test.ts）。
import { FORMAT_MINOR } from "../src/format/contract.ts";
import { songViewOf } from "../src/score/song-view.ts";
const minorDir = join(ROOT, "test/fixtures/format/minor", `score-${FORMAT_MINOR.score}`);
if (FORMAT_MINOR.score === 5 && (!existsSync(join(minorDir, "sample.mxl")) || force)) {
  mkdirSync(minorDir, { recursive: true });
  writeFileSync(join(minorDir, "sample.mxl"), bytes);
  const v = songViewOf(o.song);
  writeFileSync(join(minorDir, "expected.json"), JSON.stringify({ score: { version: FORMAT.score, minor: FORMAT_MINOR.score }, songView: { notation: v.notation, chordTags: v.chordTags, inC: v.inC, chords: Object.fromEntries(o.song.parts.map((p) => [p.id, v.chordsOf(p.id)])) }, raw: { notation: o.song.notation ?? null, parts: Object.fromEntries(o.song.parts.map((p) => [p.id, p.chords ?? null])) } }, null, 2) + "\n");
  console.log(`frozen: test/fixtures/format/minor/score-${FORMAT_MINOR.score}/`);
}
