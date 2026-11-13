// test/e2e/settings-libs.mjs —— 真浏览器 E2E：设置的「音源」「维护」两页（施工单 13-2）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：① 名字后面并排的「?」「©」：点哪个就是哪个（零件库 0.4.0 时量的：旧 CSS「?」上 144/256 个点点到「©」；统筹说这条长期守卫放 13-2 进 E2E），点了展开各自那一段；
//   ② 你自己加的音色文件：名字从那一块字节里读（「预设名 · 音色库名」）；删 = 叠在设置上面问一句（设置不关），「算了」不动、「删」= 那一行没了、缓存里也没了；
//   ③ 两页互相跳：维护页的组名 → 音源页那一栏；音源页「它的缓存在维护里」→ 维护页那一组；
//   ④ 拿掉只用两个词：音源页只有「删」、维护页只有「清」（「删掉 / 全清 / 清空念缓存 / 放掉内存」不再出现）；
//   ⑤ 设备上有二十块自己加的音色文件时，开音源页到名字都读出来要多久（只报数）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/settings-libs.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import fs from "node:fs"; import crypto from "node:crypto";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const SF2 = [...fs.readFileSync(new URL("../fixtures/sf2/gu-sine-wave.sf2", import.meta.url))], SHA = crypto.createHash("sha256").update(Buffer.from(SF2)).digest("hex");
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1100, height: 1000 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(BASE); await p.waitForTimeout(800);
const putSound = (sha, bytes) => p.evaluate(async ([sha, bytes]) => { const c = await caches.open("pwa-sounds"); await c.put(`${location.origin}/__pwa-sounds__/${sha}`, new Response(new Uint8Array(bytes), { headers: { "Content-Length": String(bytes.length) } })); }, [sha, bytes]);
const hasSound = (sha) => p.evaluate(async (sha) => !!(await (await caches.open("pwa-sounds")).match(`${location.origin}/__pwa-sounds__/${sha}`)), sha);
const openSettings = async (tab) => { await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".settings-card"); await p.click(`.set-tabs [data-tab="${tab}"]`); await p.waitForTimeout(400); };
const closeSettings = async () => { await p.click('.settings-card [data-v="close"]'); await p.waitForTimeout(200); };
const visiblePage = () => p.$eval(".settings-card", (c) => [...c.querySelectorAll(".set-page")].find((x) => !x.hidden)?.dataset.page ?? "");

await putSound(SHA, SF2);
await openSettings("sound");
// ① 并排的两个小标记：在各自的样子上取 16 × 16 个点，没有一个点落到另一个上
const steal = await p.evaluate(() => {
  const row = document.querySelector('.wbe-row[data-lib="voice"]'), [q, c] = [...row.querySelectorAll(".wbe-row-mark")];
  const count = (m, other) => { const r = m.getBoundingClientRect(); let n = 0; for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const el = document.elementFromPoint(r.left + (i + 0.5) * r.width / 16, r.top + (j + 0.5) * r.height / 16); if (el?.closest(".wbe-row-mark") === other) n++; } return n; };
  return { q: q?.textContent, c: c?.textContent, qToC: count(q, c), cToQ: count(c, q) };
});
check(steal.q === "?" && steal.c === "©" && steal.qToC === 0 && steal.cToQ === 0, "名字后面「?」「©」并排：点「?」的样子 256 个点没有一个落到「©」上，反过来也是", JSON.stringify(steal));
await p.click('.wbe-row[data-lib="voice"] .wbe-row-mark[data-note="0"]'); await p.waitForTimeout(100);
const n0 = await p.$$eval('.wbe-row[data-lib="voice"] > .wbe-row-note', (ns) => ns.map((n) => !n.hidden));
await p.click('.wbe-row[data-lib="voice"] .wbe-row-mark[data-note="1"]'); await p.waitForTimeout(100);
const n1 = await p.$$eval('.wbe-row[data-lib="voice"] > .wbe-row-note', (ns) => ns.map((n) => !n.hidden)), rules = await p.$eval('.wbe-row[data-lib="voice"] > .wbe-row-note[data-note="1"]', (n) => n.textContent ?? "");
check(JSON.stringify(n0) === "[true,false]" && JSON.stringify(n1) === "[false,true]" && /版权和使用规则/.test(rules) && /禁止/.test(rules), "点「?」= 展开这是什么；点「©」= 换成版权和使用规则（署名 + 禁止用途）", `${JSON.stringify(n0)} → ${JSON.stringify(n1)}`);

// ② 自己加的音色文件：名字从字节里读
let label = ""; for (let i = 0; i < 30 && !/Sine/.test(label); i++) { label = await p.$eval(`.lib-own[data-sha="${SHA}"] .lib-own-name`, (e) => e.textContent ?? "").catch(() => ""); await p.waitForTimeout(100); }
check(label === "Sine Wave · GeneralUser GS 2.0.3 BETA", "自己加的音色文件：名字 =「预设名 · 音色库名」，从那一块字节里读", label);
await p.click(`.lib-own[data-sha="${SHA}"] [data-v="lib:del:own:${SHA}"]`); await p.waitForTimeout(200);
const ask = await p.$eval(".settings-card ~ .ask-layer, .offer .ask-layer", (e) => e.textContent ?? "").catch(() => "");
check(/删掉这个音色文件/.test(ask) && /找不回来/.test(ask) && !!(await p.$(".settings-card")), "删之前叠在设置上面问一句（设置不关），写明删了找不回来", ask.slice(0, 60));
await p.click('.ask-layer [data-ask="no"]'); await p.waitForTimeout(200);
check(!!(await p.$(`.lib-own[data-sha="${SHA}"]`)) && (await hasSound(SHA)), "「算了」= 那一行还在、缓存里也还在");
await p.click(`.lib-own[data-sha="${SHA}"] [data-v="lib:del:own:${SHA}"]`); await p.waitForTimeout(200); await p.click('.ask-layer [data-ask="ok"]'); await p.waitForTimeout(400);
check(!(await p.$(`.lib-own[data-sha="${SHA}"]`)) && !(await hasSound(SHA)), "「删」= 那一行没了、缓存里也没了");

// ③ 两页互相跳
await p.click('.wbe-row[data-lib="voice"] [data-v="goto:upkeep:voice"]'); await p.waitForTimeout(200);
check((await visiblePage()) === "upkeep" && !!(await p.$('.wbe-row[data-group="voice"].is-target')), "音源页「它的缓存在维护里」= 维护页小月相那一组（亮一下）");
await p.click('.wbe-row[data-group="gs"] [data-v="goto:sound:gs"]'); await p.waitForTimeout(200);
check((await visiblePage()) === "sound" && !!(await p.$('.wbe-row[data-lib="gs"].is-target')), "维护页的组名「乐器音色库 ›」= 音源页那一栏");

// ④ 两个词
const words = await p.$eval(".settings-card", (c) => { const t = (pg) => [...c.querySelectorAll(`.set-page[data-page="${pg}"] button, .set-page[data-page="${pg}"] label.btn`)].map((x) => (x.textContent ?? "").trim()); return { sound: t("sound"), upkeep: t("upkeep") }; });
const retired = /^(删掉|全清|清空念缓存|放掉内存|清空)$/;
check(!words.sound.some((w) => /^清/.test(w)) && words.upkeep.every((w) => !/^删/.test(w)) && ![...words.sound, ...words.upkeep].some((w) => retired.test(w)), "音源页只说「删」、维护页只说「清」；那五种旧说法没了", JSON.stringify(words.upkeep));
await closeSettings();

// ⑤ 二十块：开音源页到名字都读出来要多久（只报数）
const fakes = Array.from({ length: 20 }, (_, i) => crypto.createHash("sha256").update(`fake-${i}`).digest("hex"));
for (const sha of fakes) await putSound(sha, SF2);
const t0 = performance.now(); await openSettings("sound");
let done = 0; for (let i = 0; i < 100; i++) { done = await p.$$eval(".lib-own .lib-own-name", (es) => es.filter((e) => /Sine/.test(e.textContent ?? "")).length); if (done >= 20) break; await p.waitForTimeout(50); }
const ms = Math.round(performance.now() - t0);
check(done === 20, `设备上二十块：名字都读出来了（开页到读完 ${ms} ms，含开设置面板）`, String(done));
await closeSettings();
for (const sha of fakes) await p.evaluate(async (sha) => (await caches.open("pwa-sounds")).delete(`${location.origin}/__pwa-sounds__/${sha}`), sha);
check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
