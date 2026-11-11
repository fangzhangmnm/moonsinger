#!/usr/bin/env node
// freeze-layout-surface.mjs —— 冻结谱面排版的长期底本 → test/fixtures/layout/surface/<歌>.<视图>.json.gz（test/score-surface.test.ts 比）。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家 1b 收尾：脚手架收成几条综合的对抗性测试，底本用分家之后的代码存——user 11-11「本来就不用太念旧」）。
//   什么时候跑：版面本来就该变的时候（先看 test/score-surface.test.ts 报的差别、确认都是该变的；第六刀之类的看得见的改动先出样张经统筹给 user 看）。
import fs from "node:fs";
import { gzipSync } from "node:zlib";
import { surfaceCases, fullSnapshot, surfacePath } from "../test/fixtures/layout/full.ts";
fs.mkdirSync(new URL("../test/fixtures/layout/surface/", import.meta.url), { recursive: true });
let n = 0, bytes = 0;
for (const c of surfaceCases()) { const gz = gzipSync(JSON.stringify(fullSnapshot(c.layout())) + "\n", { level: 9 }); fs.writeFileSync(surfacePath(c.song, c.view), gz); n++; bytes += gz.length; }
console.log(`[freeze-layout-surface] ${n} 份底本（${(bytes / 1024).toFixed(0)} KB）→ test/fixtures/layout/surface/`);
