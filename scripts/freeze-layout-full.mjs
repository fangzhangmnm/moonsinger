#!/usr/bin/env node
// freeze-layout-full.mjs —— 冻结排版分家（施工单 1b）守卫 3 的全量快照 → test/fixtures/layout/full/<歌>.<视图>.json.gz。created 2026-11-11 by Claude Opus 5.5
// 用法：node scripts/freeze-layout-full.mjs（全部重写）。只在没动排版器的代码上跑（1b 开刀前冻一次）；分家途中红了 = 搬错了，不许重冻。
import fs from "node:fs";
import { gzipSync } from "node:zlib";
import { fullCases, fullSnapshot, fullPath } from "../test/fixtures/layout/full.ts";
fs.mkdirSync(new URL("../test/fixtures/layout/full/", import.meta.url), { recursive: true });
let n = 0, bytes = 0;
for (const c of fullCases()) {
  const gz = gzipSync(JSON.stringify(fullSnapshot(c.layout())) + "\n", { level: 9 });
  fs.writeFileSync(fullPath(c.song, c.view), gz); n++; bytes += gz.length;
}
console.log(`[freeze-layout-full] ${n} 份全量快照（${(bytes / 1024).toFixed(0)} KB）→ test/fixtures/layout/full/`);
