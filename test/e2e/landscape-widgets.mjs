// test/e2e/landscape-widgets.mjs —— 真浏览器 E2E（横屏）：小键盘写字那一排全部看得见（叠 / 升降不藏，折成两行）；混音台歌手卡顶上「静 / 独」= 谱上的静音 / 独奏（v0.10.34）。
// created 2026-10-10 by Claude Opus 5.5（user「横屏的时候小键盘的叠不见了。横屏的时候能显示全部widget吗」「混音台基础里面应该有mute和solo，和我们已经有的mute和solo绑定」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/landscape-widgets.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1180, height: 820 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const w = await p.$$eval(".pad-tools.writes .btn", (bs) => bs.map((b) => b.getBoundingClientRect().width));
check(w.length >= 10 && w.every((x) => x > 20), "横屏：写字那一排的键全都看得见（含叠、升降）", w.map(Math.round).join(","));
check(await p.$eval(".pad-tools.writes .btn.stack", (e) => e.getBoundingClientRect().width > 20), "「叠」在");
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(400);
const top = await p.$eval('.strip [data-v="mute"]', (b) => b.getBoundingClientRect().top - b.closest(".strip").getBoundingClientRect().top);
check(top < 40, "「静」钉在歌手卡顶上（不用在卡片里滚）", String(Math.round(top)));
const badge = () => p.evaluate(() => [...document.querySelectorAll("#score text.part-badge")].map((t) => t.textContent).join("|"));
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__ch = []; const ch = e.channel.bind(e); e.channel = (id, prm) => { window.__ch.push([id, !!prm.mute, !!prm.solo]); return ch(id, prm); }; });
await p.click('.strip [data-v="mute"]'); await p.waitForTimeout(250);
check(await p.evaluate(() => window.__ch.some(([, m]) => m)), "点「静」= 录音房马上收到这位静音（推子到底、发送一起停；v0.10.38）", JSON.stringify(await p.evaluate(() => window.__ch)));
check((await badge()).includes("静音") && await p.$eval('.strip [data-v="mute"]', (b) => b.classList.contains("is-on")), "点「静」= 谱上歌手名下面出现「静音」、钮亮着", await badge());
await p.click('.strip [data-v="mute"]'); await p.waitForTimeout(250);
check(!(await badge()).includes("静音"), "再点 = 不静音了");
await p.click('.strip [data-v="solo"]'); await p.waitForTimeout(250);
check((await badge()).includes("独奏"), "点「独」= 谱上「独奏」", await badge());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nlandscape-widgets: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
