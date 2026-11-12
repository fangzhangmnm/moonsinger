// test/e2e/notice-dodge.mjs —— 真浏览器 E2E：提示条不挡点得到的东西（施工单第五节，统筹 2026-11-12）。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。起因 = 小卡开着时「试听不了」的提示条压住小卡中间那排钮（finder-memory、cast-back 两份测试撞上过）。
// 守：非模态的小卡开着、来一条提示：小卡上每颗钮的中心点都点得到（提示条躲开小卡；躲不开 = 没有按钮的部分让点击穿过去，提示条自己的钮照样能点）；
//   模态面板开着时照旧（提示条挪到顶上，不归这里管）。
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const LONG = "试听不了：「GeneralUser GS 2.0.3」拿不到（试过 http://127.0.0.1/pwa-sounds/ 和 https://example.invalid/pwa-sounds/）。这是一条故意写得很长的提示，好让它在窄屏上折成好几行、盖住一大块。";
const b = await chromium.launch();
/** 小卡上每颗钮的中心点，点下去落在哪（elementFromPoint）；不在那颗钮里的列出来。 */
const blocked = (p) => p.evaluate(() => [...document.querySelectorAll(".part-card [data-v]")].filter((el) => { const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(hit && (hit === el || el.contains(hit))); }).map((el) => el.dataset.v));
const overlap = (p) => p.evaluate(() => { const s = document.getElementById("noticeStack")?.getBoundingClientRect(), c = document.querySelector(".part-card")?.getBoundingClientRect(); return !!s && !!c && s.width > 0 && s.left < c.right && s.right > c.left && s.top < c.bottom && s.bottom > c.top; });
for (const [w, h, label] of [[1100, 900, "宽屏"], [700, 520, "矮窗口"], [360, 420, "很小的窗口（躲不开）"]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, locale: "zh-CN" })).newPage(), errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(800);
  for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
  await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(250);
  await p.evaluate((t) => { window.__moonsinger.notice(t); window.__moonsinger.notice(t); }, LONG); await p.waitForTimeout(300);
  const bl = await blocked(p), ov = await overlap(p), through = await p.$eval("#noticeStack", (e) => e.classList.contains("notice-through"));
  check(bl.length === 0, `${label}：小卡开着来了提示，小卡上每颗钮都点得到`, bl.join(","));
  check(!ov || through, `${label}：提示条要么躲开小卡，要么让点击穿过去`, `叠着=${ov} 穿过去=${through}`);
  if (through) {
    const btnOk = await p.evaluate(() => [...document.querySelectorAll("#noticeStack .toast :is(button, a)")].every((x) => getComputedStyle(x).pointerEvents !== "none"));
    check(btnOk, `${label}：穿过去的时候，提示条自己的钮照样能点`);
  }
  // 小卡收了 = 提示条回原位（不留躲开时设的位置）
  await p.mouse.click(2, h - 2); await p.waitForTimeout(250);
  const back = await p.$eval("#noticeStack", (e) => !e.dataset.dodged && !e.classList.contains("notice-through"));
  check(back, `${label}：小卡收了，提示条回原来的位置`);
  check(!errs.length, `${label}：没有页面错误`, errs.join(" | "));
  await p.context().close();
}
// 模态面板照旧：开着设置（.offer）时提示条挪到顶上，不加躲开的位置
{ const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  await p.goto(BASE); await p.waitForTimeout(800);
  await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForSelector(".settings-card");
  await p.evaluate((t) => window.__moonsinger.notice(t), LONG); await p.waitForTimeout(300);
  const st = await p.$eval("#noticeStack", (e) => ({ dodged: !!e.dataset.dodged, top: Math.round(e.getBoundingClientRect().top) }));
  check(!st.dodged && st.top < 200, "模态面板开着：照旧挪到顶上（不归这里管）", JSON.stringify(st));
  await p.context().close(); }
await b.close();
console.log(`\nnotice-dodge: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
