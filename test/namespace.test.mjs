// 命名空间守卫（家族规则书 §1 第 3 条 / §4 第 2 项：自家的东西都带自家前缀；威胁 = 共用存储里名字撞车）。created 2026-11-03 by Claude Opus 5.5（工单 A 第 5 步）
//   扫 src/ + service-worker.js 里给存储 / 锁 / 广播频道起名的字面量：库名、缓存名、锁名、频道名必须以 `moonsinger`（本 app：`moonsinger-…` 私有 /
//   `moonsinger.…` = store 的命名空间）或 `pwa-`（家族批过的共用仓：pwa-models / pwa-sounds）开头。localStorage 键只许经 device-kv（前缀在那一处加，redline 守着）。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, assert } from "./runner.mjs";
import { APP_NS, APP_DB_PREFIX, CACHE_DBS } from "../src/config.ts";

function* walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* walk(p); else if (/\.(ts|mjs|js)$/.test(f) && !f.endsWith(".d.ts")) yield p.replace(/\\/g, "/"); } }
const SOURCES = [...walk("src"), "service-worker.js"];
// 起名的几种写法（字面量）
const NAMERS = [
  /indexedDB\.(?:open|deleteDatabase)\(\s*["'`]([^"'`$]+)/g,
  /caches\.(?:open|delete)\(\s*["'`]([^"'`$]+)/g,
  /navigator\.locks\.request\(\s*["'`]([^"'`$]+)/g,
  /new BroadcastChannel\(\s*["'`]([^"'`$]+)/g,
  /\b(?:dbName|cacheName)\s*:\s*["'`]([^"'`$]+)/g,
  /\bconst [A-Z_]*(?:_DB|CACHE|CACHE_NAME|_CHANNEL|_LOCK)\s*=\s*["'`]([^"'`$]+)/g,
  /\b(?:let|const) CACHE_NAME\s*=\s*["'`]([^"'`$]+)/g,
];
const OK = /^(moonsinger[-.]|pwa-)/;
// 名字用模板拼的（2026-11-03 起派生缓存库 = `${APP_NS}.speech` 这种，config.ts）：先把这两个常量代回去再认
const SUBST = { APP_NS, APP_DB_PREFIX };
const subst = (s) => s.replace(/\$\{(APP_NS|APP_DB_PREFIX)\}/g, (_, k) => SUBST[k]);

describe("命名空间：存储 / 锁 / 频道名都带自家前缀（规则书 §1 第 3 条）", () => {
  it("src + service-worker.js 里起的名字全带前缀", () => {
    const bad = [], seen = [];
    for (const p of SOURCES) {
      const s = subst(readFileSync(p, "utf8"));
      for (const re of NAMERS) for (const m of s.matchAll(re)) { seen.push(m[1]); if (!OK.test(m[1])) bad.push(`${p}: ${m[1]}`); }
    }
    for (const [k, v] of Object.entries(CACHE_DBS)) { seen.push(v); if (!OK.test(v)) bad.push(`src/config.ts CACHE_DBS.${k}: ${v}`); }   // 派生缓存库的名字住这张表（建库处引它）
    assert(seen.length >= 5, `扫到的名字太少（${seen.length}）：起名写法变了，守卫要跟着改`);
    assert(bad.length === 0, "不带自家前缀的名字：\n" + bad.join("\n"));
  });
  it("没有人绕开 device-kv 直接起 localStorage 键（键前缀只在一处加）", () => {
    const bad = SOURCES.filter((p) => p !== "src/device-kv.ts" && /localStorage\.(?:setItem|getItem|removeItem)\(/.test(readFileSync(p, "utf8")));
    assert(bad.length === 0, "直接写 localStorage 的：" + bad.join(", "));
  });
});
