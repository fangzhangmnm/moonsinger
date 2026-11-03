// 备用版清单守卫（家族工单 A 第 7 步；规则书 §3.5）：源码里按站点根读的 app 文件（resources.ts getBytes / worker 向主线程要的那些路径）
//   都必须在 scripts/pack-site.mjs 的 LOCAL_APP_FILES 里——漏了 = 备用版（双击打开的文件夹）里那一处读不到（没有对应的 .data.js）。
//   清单里每一项也必须真在仓里（没有幽灵条目）。乐器目录三个文件由 instruments.gen.ts 另加，不在这里列。created 2026-11-03 by Claude Opus 5.5
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, assert } from "./runner.mjs";
import { LOCAL_APP_FILES } from "../scripts/pack-site.mjs";

function* walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* walk(p); else if (/\.(ts|mjs)$/.test(f) && !f.endsWith(".d.ts") && !f.endsWith(".gen.ts")) yield p.replace(/\\/g, "/"); } }
const LIT = /["'`]((?:vendor|assets)\/[^"'`$\s]+\.[a-z0-9]+)["'`]/g;

describe("备用版清单：站点根起算的读取路径都打进了老实脚本", () => {
  it("源码里的 vendor/… assets/… 读取路径都在 LOCAL_APP_FILES 里", () => {
    const want = new Set(LOCAL_APP_FILES), miss = [];
    let seen = 0;
    for (const p of walk("src")) for (const line of readFileSync(p, "utf8").split("\n")) {
      if (/^\s*(\/\/|\*)/.test(line)) continue;
      for (const m of line.replace(/\s\/\/\s.*$/, "").matchAll(LIT)) { seen++; if (!want.has(m[1])) miss.push(`${p}: ${m[1]}`); }
    }
    assert(seen >= 8, `扫到的读取路径太少（${seen}）：写法变了，守卫要跟着改`);
    assert(miss.length === 0, "备用版里读不到的路径（加进 scripts/pack-site.mjs LOCAL_APP_FILES）：\n" + miss.join("\n"));
  });
  it("清单里每一项都真在仓里", () => {
    const ghosts = LOCAL_APP_FILES.filter((f) => !existsSync(f));
    assert(ghosts.length === 0, "LOCAL_APP_FILES 里不存在的文件：" + ghosts.join(", "));
  });
});
