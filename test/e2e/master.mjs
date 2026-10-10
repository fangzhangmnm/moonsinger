// test/e2e/master.mjs —— 真浏览器 E2E：录音室里的总轨（增益推子 / 限幅开关 / 峰值表）：改了进歌（studio.json master）、能撤销；关限幅时钮上明说；离线混音吃到总轨增益。
// created 2026-10-10 by Claude Fable 5.1（实时试听刀 3；user「好，然后到fable的时候总轨和常见的几个混音的东西也让他可以开始做了」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 3).fill(0.2), sr: 22050 }); });
const master = () => p.evaluate(() => window.__moonsinger.extras().studio?.master ?? null);
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(250);
check(!!(await p.$(".strip.master")), "录音室里有总轨那一条");
check((await master()) === null, "没动过 = 歌里没有 master 字段（老文件也不会多出东西）");
const peakBefore = await p.evaluate(async () => { const m = await window.__moonsinger.renderMix(); let pk = 0; for (const v of m.samples) pk = Math.max(pk, Math.abs(v)); return pk; });
await p.$eval(".strip.master input[data-master]", (el) => { el.value = "-6"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(150);
check((await master())?.gainDb === -6, "推子 −6 dB 进歌", JSON.stringify(await master()));
check((await p.textContent(".strip.master output")).includes("-6.0"), "读数跟着");
const peakAfter = await p.evaluate(async () => { const m = await window.__moonsinger.renderMix(); let pk = 0; for (const v of m.samples) pk = Math.max(pk, Math.abs(v)); return pk; });
check(Math.abs(peakAfter / peakBefore - 0.501) < 0.01, "离线混音吃到总轨 −6 dB（峰值减半）", `${peakBefore.toFixed(3)} → ${peakAfter.toFixed(3)}`);
await p.click('.strip.master [data-v="limiter"]'); await p.waitForTimeout(150);
check((await master())?.limiter === false, "关限幅进歌");
check((await p.textContent('.strip.master [data-v="limiter"]')).includes("可能削波"), "关着的时候钮上明说可能削波");
await p.click('.strip.master [data-v="limiter"]'); await p.waitForTimeout(150);
check((await master())?.limiter === true, "再点 = 开");
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
check((await master())?.limiter === false, "撤销一步 = 限幅回到关");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(!(await p.$eval(".studio", (e) => !e.hidden)), "Esc 回谱");
// 卡片一样宽：撑不满一排的也不被拉宽（2026-10-10 user「录音房撑不满行宽的卡片应该也一样大，看着舒服」）——iPad 竖屏录音室在底下、一排几张；
//   纯版式检查：把卡复制到 5 张（凑出没排满的最后一排），量完就关这一页
{
  const q = await (await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true })).newPage();
  await q.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await q.waitForTimeout(800);
  await q.click('.mode-seg [data-mode="listen"]'); await q.waitForTimeout(300);
  const widths = await q.evaluate(() => {
    const box = document.querySelector(".studio-strips"), src = box.querySelector(".strip");
    while (box.querySelectorAll(".strip").length < 5) box.appendChild(src.cloneNode(true));
    return [...box.querySelectorAll(".strip")].map((e) => Math.round(e.getBoundingClientRect().width));
  });
  check(widths.length === 5 && widths.every((w) => w > 0 && Math.abs(w - widths[0]) <= 1), "iPad 竖屏：录音室的卡片一样宽（最后一排没排满也不被拉宽）", JSON.stringify(widths));
  await q.close();
}
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
