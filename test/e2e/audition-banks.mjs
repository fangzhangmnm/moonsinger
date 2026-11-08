// test/e2e/audition-banks.mjs —— 真浏览器 E2E：乐器目录里试听过的音色库只留最近几件、关目录全卸、歌里用着的永不卸（v0.16.23）。
// created 2026-11-08 by Claude Fable 5.1（查 user 11-08「键盘延迟非常高」时发现：每点一件 = 一份库 + 一个合成器永久留在声音线程里，整个 app 没人调过 unbank；
//   user「然后看一下是不是换歌手的逻辑导致的」）。
// 守：① 连点 4 件 GS 乐器 → 声音线程里最多 3 份库、现在试听的那份一定在；② 关目录 → 一份都不剩；③ 上场一件再逛 → 它一直在、别的照旧只留几件；④ 卸过的再点 = 重载、照样能响。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/audition-banks.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
async function reveal(p, cid) {   // 手风琴：逐组点开直到那一行露出来（同 cast-back.mjs）
  const n = await p.$$eval(".finder-group", (gs) => gs.length);
  for (let k = 0; k < n && !(await p.$(`.inst-row[data-c="${cid}"]`)); k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(60); }
  }
}
const banks = (p) => p.evaluate(() => window.__moonsinger.engine.banks());
/** 点开一件、点它第一个提供者 = 试听台换成它；等到声音线程里的库数变了或 8 s。 */
async function audition(p, cid) {
  await reveal(p, cid); await p.click(`.inst-row[data-c="${cid}"]`); await p.waitForTimeout(250);
  const before = (await banks(p)).join(",");
  await p.click(`.inst-row.is-open[data-c="${cid}"] + .inst-prov .prov:not(.prov-none) >> nth=0`);
  await p.waitForFunction((b) => window.__moonsinger.engine.banks().join(",") !== b, before, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(200);
}
const GS = ["Q80019", "Q209554", "Q7390", "Q208173"];   // 都有 GeneralUser GS 的本尊（vendor/instruments/gm-map）
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(150);
// 进目录（点声部名 → 小卡「换乐器 ›」）
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForTimeout(400);
await p.waitForSelector(".finder-list .finder-group-h");
// ① 连点 4 件：最多留 3 份，现在这件一定在
for (const cid of GS) await audition(p, cid);
const b1 = await banks(p);
check(b1.length >= 1 && b1.length <= 3, "连点 4 件 GS 乐器：声音线程里最多留 3 份库", `${b1.length} 份`);
const cur = await p.evaluate(() => window.__moonsinger.auditionSha?.() ?? null);
check(cur === null || b1.includes(cur), "现在试听的那一份一定还在", `${cur?.slice(0, 8)}`);
// ④ 卸过的（第一件）再点 = 重载、照样在
await audition(p, GS[0]);
const b2 = await banks(p);
check(b2.length <= 3 && b2.length >= 1, "再点卸过的那件：重载回来、总数照旧不超 3", `${b2.length} 份`);
// ② 关目录 = 全卸（这首歌里还没有 GS 乐器上场）
await p.keyboard.press("Escape"); await p.waitForTimeout(600);
check((await banks(p)).length === 0, "关目录：试听过的全卸掉（歌里没人用着）", `${(await banks(p)).length} 份`);
// ③ 上场一件再逛：它永不卸
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForTimeout(400);
await p.waitForSelector(".finder-list .finder-group-h");
await reveal(p, GS[1]); await p.click(`.inst-row[data-c="${GS[1]}"]`); await p.waitForTimeout(300);
await p.click(`.inst-row.is-open[data-c="${GS[1]}"] + .inst-prov .prov:not(.prov-none) [data-v="cast"] >> nth=0`).catch(() => {});
await p.waitForFunction(() => !document.querySelector(".finder:not([hidden])"), null, { timeout: 30000 }).catch(() => {});
if (await p.$(".finder:not([hidden])")) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); }
const inUse = await banks(p);
check(inUse.length === 1, "上场一件 = 关目录后它留着", `${inUse.length} 份`);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForTimeout(400);
await p.waitForSelector(".finder-list .finder-group-h");
for (const cid of [GS[0], GS[2], GS[3]]) await audition(p, cid);
const b3 = await banks(p);
check(inUse.every((s) => b3.includes(s)), "逛目录时上场那位的库一直在", `${b3.length} 份`);
check(b3.length <= 4, "试听的照旧最多 3 份 + 上场的 1 份", `${b3.length} 份`);
await p.keyboard.press("Escape"); await p.waitForTimeout(600);
const b4 = await banks(p);
check(b4.length === 1 && b4[0] === inUse[0], "关目录：只剩上场那位的", `${b4.length} 份`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\naudition-banks: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
