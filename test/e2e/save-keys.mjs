// test/e2e/save-keys.mjs —— 真浏览器 E2E：Ctrl / ⌘+S 不管哪一页开着、焦点在谁身上，都被 app 接住（不落到浏览器的「保存网页」）。
// created 2026-10-10 by Claude Opus 5.5（user「很多地方save没有拦截」）
// 看法：在 app 的 keydown 之后再挂一个监听，看 defaultPrevented（= app 接了）；同时把「存」换成记一笔，不真弹存档框。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/save-keys.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(60);
await p.evaluate(() => { window.__sk = []; window.addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) window.__sk.push(e.defaultPrevented); }); });
const caught = async (where) => {
  await p.evaluate(() => { window.__sk = []; });
  await p.keyboard.press("Control+s"); await p.waitForTimeout(200);
  const sheet = await p.evaluate(() => [...document.querySelectorAll(".offer, .sheet-overlay, .sheet")].filter((e) => e.offsetParent !== null).map((e) => e.className).join(","));
  if (sheet) { await p.keyboard.press("Escape"); await p.waitForTimeout(150); }   // 存档框 / 问一句（无地稿）开了就收掉；没开就别按（Esc 会把乐器页 / 目录也收了）
  const r = await p.evaluate(() => window.__sk);
  check(r.length === 1 && r[0] === true, `${where}：Ctrl+S 被 app 接住`, JSON.stringify(r));
};
await caught("谱面");
// 录音室（底座里），焦点在它的推子上
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(250);
await p.focus(".studio input, .studio button"); await caught("录音室（焦点在里面）");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
// 乐器页
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
await caught("乐器页");
// 乐器目录（从乐器页「换人」进）
const fin = await p.$('.ip-btns [data-v="finder"]');
if (fin) { await fin.click(); await p.waitForTimeout(400); await caught("乐器目录"); await p.keyboard.press("Escape"); await p.waitForTimeout(200); }
else check(false, "乐器页里有「打开乐器目录」");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
// 参考窗拿着焦点
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="ref"]'); await p.waitForTimeout(300);
check(await p.evaluate(() => window.__moonsinger.refHost.hasFocus()), "参考窗开着、有焦点");
await caught("参考窗（焦点在窗里）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsave-keys: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
