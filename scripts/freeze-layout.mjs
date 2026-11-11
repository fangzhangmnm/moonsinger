#!/usr/bin/env node
// freeze-layout.mjs —— 冻结三首样张的 PDF 字节指纹（刀 1 的 N2 守卫）→ test/fixtures/layout/pdf-sha256.json。created 2026-11-08 by Claude Opus 5.5
//   2026-11-11（Claude Opus 5.5，谱面分家 1b-9）：版面快照（原来的 N1）并进谱面分家的守卫 3，冻那一套 = scripts/freeze-layout-full.mjs；这里只剩 PDF 指纹。
//   什么时候跑：只在 PDF 本来就该变的时候；先把两份 PDF 里的数字按守卫 3 的规矩比、证明只是该变的地方变了（施工单 20261111 第五节统筹裁定）。
import fs from "node:fs";
import { SONGS, pdfSha, pdfShaPath } from "../test/fixtures/layout/cases.ts";
const sha = {}; for (const key of Object.keys(SONGS)) sha[key] = await pdfSha(key);
fs.writeFileSync(pdfShaPath, JSON.stringify(sha, null, 2) + "\n");
console.log(`[freeze-layout] ${Object.keys(sha).length} 份 PDF 指纹 → test/fixtures/layout/pdf-sha256.json`);
