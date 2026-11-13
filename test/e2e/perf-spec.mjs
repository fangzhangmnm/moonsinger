// test/e2e/perf-spec.mjs —— 真浏览器 E2E：拿乐手规格只有一个口（杂事版 v0.17.42，统筹「拿乐手规格的口收成一个」）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：台上那位身上的数缺了 / 不是数（这里把小月相的 accentDb 改成字）→ 按键试听不响（不拿缺了的数算力度，engine.auditionOn 一次都没叫）；
//   乐器页「怎么演」里一行「缺的数」写着缺哪个键、依赖规格的那几行（力度记号）不画；改回来 = 又响、那一行没了。结构守卫在 test/perf-spec-entry.test.ts。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/perf-spec.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(900);
await p.evaluate(() => { const e = window.__moonsinger.engine, on = e.auditionOn.bind(e); window.__aud = 0; e.auditionOn = (...a) => { window.__aud++; return on(...a); }; });
const aud = () => p.evaluate(() => window.__aud);
/** 把台上那位（第一个声部的乐手）的 articulation.accentDb 改成 v（直接走文档入口，像一份读进来的怪文件）。 */
const setAccent = (v) => p.evaluate((v) => { const m = window.__moonsinger, x = m.extras(), role = m.state().song.parts[0].role, r = x.lounge[role];
  const cands = r.candidates.map((c) => (c.id === r.active ? { ...c, articulation: { ...c.articulation, accentDb: v } } : c));
  return m.commit({ extras: { ...x, lounge: { ...x.lounge, [role]: { ...r, candidates: cands } } } }).ok; }, v);
const tap = async () => { await p.click(".pad-key[data-k] >> nth=2"); await p.waitForTimeout(250); };

await tap(); const a0 = await aud();
check(a0 > 0, "（前提）好好的小月相：按键试听响了", String(a0));
const good = await p.evaluate(() => { const m = window.__moonsinger, x = m.extras(), role = m.state().song.parts[0].role, r = x.lounge[role]; return r.candidates.find((c) => c.id === r.active).articulation.accentDb; });
check(await setAccent("x"), "把她身上的 accentDb 改成字（怪值）");
await tap();
check((await aud()) === a0, "规格缺数：按键试听不响（不拿缺了的数算力度）", `${a0} → ${await aud()}`);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(350);
const ip = await p.evaluate(() => ({ bad: document.querySelector(".inst-page .ip-bad")?.textContent ?? null, keys: [...document.querySelectorAll(".inst-page .ip-k")].map((e) => e.textContent) }));
check(ip.bad === "accentDb" && ip.keys.includes("缺的数"), "乐器页：「缺的数」那一行写着 accentDb", JSON.stringify(ip.bad));
check(!ip.keys.includes("力度记号"), "乐器页：依赖规格的「力度记号」那一行不画（不拿它算）", ip.keys.join(" / "));
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
check(await setAccent(good), "改回原来的数");
await tap();
check((await aud()) > a0, "改回来：按键试听又响了");
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(350);
const ip2 = await p.evaluate(() => ({ bad: !!document.querySelector(".inst-page .ip-bad"), keys: [...document.querySelectorAll(".inst-page .ip-k")].map((e) => e.textContent) }));
check(!ip2.bad && ip2.keys.includes("力度记号"), "改回来：乐器页没有「缺的数」、力度记号那一行回来了", ip2.keys.join(" / "));
check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
