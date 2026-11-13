// 派生缓存库改名后的老库探删（家族工单 A2 ⑤，2026-11-03 Claude Opus 5.5；Fable 裁定：不搬、探到就删、不在就不建、不盲删）。
//   老名字 = moonsinger-thumbs / facts / speech（config.ts LEGACY_CACHE_DBS）；新名字 = moonsinger-5b1e7c0a92d34f6e.thumbs / facts / speech。
//   ① 一页上造出三个老库 + 一个无关的库 → 重开 app、等空闲片 → 三个老库没了、无关的那个还在、提示说了一次
//   ② 没有老库时开 app → 一个老名字都不会被建出来（探的那一下当场 abort）
import { chromium } from "./pw.mjs";
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
let fails = 0; const check = (ok, what, extra = "") => { console.log(`  ${ok ? "✓" : "✗"} ${what}`, extra); if (!ok) fails++; };
const OLD = ["moonsinger-thumbs", "moonsinger-facts", "moonsinger-speech"];
const browser = await chromium.launch();
const names = (p) => p.evaluate(async () => (await indexedDB.databases()).map((d) => d.name).sort());
try {
  // ② 先测「没有老库 = 不建」（干净的 context）
  const c0 = await browser.newContext(), p0 = await c0.newPage();
  await p0.goto(BASE); await p0.waitForFunction(() => !!window.__moonsinger); await p0.waitForTimeout(3500);
  const n0 = await names(p0);
  check(!n0.some((n) => OLD.includes(n)), "没有老库时：一个老名字都没被建出来", JSON.stringify(n0));
  await c0.close();
  // ① 有老库：造三个老库 + 一个无关的
  //   在同源、但 app 没跑的那一页上造（清单文件）：原来在 app 的页上造，app 自己开机后的空闲片探删偶尔赶在「数一数」之前把刚造的删掉（机器快慢不同，2026-11-13 第二次单跑也红时查出来的）
  const c1 = await browser.newContext(), p1 = await c1.newPage();
  await p1.goto(new URL("manifest.webmanifest", BASE).href);
  await p1.evaluate(async (old) => { for (const n of [...old, "someone-else-db"]) await new Promise((ok, fail) => { const r = indexedDB.open(n, 1); r.onupgradeneeded = () => r.result.createObjectStore("x"); r.onsuccess = () => { r.result.close(); ok(); }; r.onerror = () => fail(r.error); }); }, OLD);
  check((await names(p1)).filter((n) => OLD.includes(n)).length === 3, "造好了三个老库", JSON.stringify(await names(p1)));
  await p1.goto(BASE); await p1.waitForFunction(() => !!window.__moonsinger);
  await p1.waitForFunction(() => /dropped legacy cache DBs/.test(window.__moonsinger.diagText()), null, { timeout: 15000 }).catch(() => {});
  await p1.waitForTimeout(300);
  const n1 = await names(p1);
  check(!n1.some((n) => OLD.includes(n)), "重开 + 空闲片之后：三个老库都删了", JSON.stringify(n1));
  check(n1.includes("someone-else-db"), "别人的库没碰");
  check(/dropped legacy cache DBs: moonsinger-thumbs, moonsinger-facts, moonsinger-speech/.test(await p1.evaluate(() => window.__moonsinger.diagText())), "黑匣子记了删了哪几个");
  // 再开一次：没有老库了 = 不再提示、不再删
  await p1.reload(); await p1.waitForFunction(() => !!window.__moonsinger); await p1.waitForTimeout(3500);
  const n2 = await names(p1);
  check(!n2.some((n) => OLD.includes(n)), "再开：老名字没被重新建出来", JSON.stringify(n2));
  await c1.close();
} finally { await browser.close(); }
console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
