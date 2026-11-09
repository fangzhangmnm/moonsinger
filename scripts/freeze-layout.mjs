#!/usr/bin/env node
// freeze-layout.mjs —— 冻结版面快照（刀 1 的 N1 守卫）：三首样张 × 几种视图 → test/fixtures/layout/<歌>.<视图>.json。created 2026-11-08 by Claude Opus 5.5
// 用法：node scripts/freeze-layout.mjs（全部重写）。什么时候跑：只在「版面本来就该变」的时候（比如施工单 §4 第 5 条：隐藏的声部不再留位置），
//   跑之前先让 test/engrave-printable.test.ts 告诉你变了哪些、确认都是该变的；平时动排版器 = 先跑测试，红了先查。
import fs from "node:fs";
import { gzipSync } from "node:zlib";
import { SONGS, VIEWS, caseLayout, snapshot, fixturePath, pdfSha, pdfShaPath } from "../test/fixtures/layout/cases.ts";
let n = 0;
for (const key of Object.keys(SONGS)) for (const v of VIEWS) {
  fs.writeFileSync(fixturePath(key, v.name), gzipSync(JSON.stringify(snapshot(caseLayout(key, v)), null, 0) + "\n", { level: 9 })); n++;
}
const sha = {}; for (const key of Object.keys(SONGS)) sha[key] = await pdfSha(key);
fs.writeFileSync(pdfShaPath, JSON.stringify(sha, null, 2) + "\n");
console.log(`[freeze-layout] ${n} 份快照 + ${Object.keys(sha).length} 份 PDF 指纹 → test/fixtures/layout/`);
