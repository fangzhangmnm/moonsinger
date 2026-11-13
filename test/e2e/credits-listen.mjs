// test/e2e/credits-listen.mjs —— 真浏览器 E2E：听模式里也能改歌名 / 作者（v0.16.85）。
// created 2026-11-10 by Claude Opus 5.5。user 11-10「歌名和作者信息应该三个不同模式都能写」。
// 守：音 / 词 / 听三个模式里，点作者栏（空着时的「作者」提示字）= 开作者框（13-3 起 =「这首歌」面板、光标在作者栏里）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/credits-listen.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (const mode of ["notes", "lyrics", "listen"]) {
  await p.evaluate((m) => window.__moonsinger.setMode(m), mode); await p.waitForTimeout(250);
  await p.click(".ov-ph-credits"); await p.waitForTimeout(250);
  const open = await p.evaluate(() => !!document.querySelector(".wbe-panel #crIn") && document.activeElement?.id === "crIn");
  check(open, `${mode}：点「作者」= 开作者框`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  if (await p.$(".wbe-panel")) { await p.click('.wbe-panel [data-panel-btn="ok"]').catch(() => {}); await p.waitForTimeout(150); }
}
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ncredits-listen: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
