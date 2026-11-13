// test/e2e/performer-db.mjs —— 真浏览器 E2E：混音台上照实写乐手的响度（施工单第 14 条，2026-11-12）。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。起因：推子写 0、乐手的响度 −6 在乐器页里，混音台上看不见（user「就我们这边为什么整体会轻六db？」）。
// 守：新歌的乐手 = 0 → 推子旁边不写；乐手明写着 −6（老歌）→ 基础页和发送页推子旁边都写「乐手 -6.0 dB」，点它 = 去这位的乐器页、「响度」那一行在屏幕里、写着 -6.0 dB；
//   乐器页「默认」钮回到 0；回到 0 之后混音台不再写。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/performer-db.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const cal = () => p.evaluate(() => { const m = window.__moonsinger, st = m.state(), role = st.song.parts[0].role, r = m.extras().lounge[role];
  return r ? r.candidates.find((c) => c.id === r.active)?.calibrationDb ?? null : "没有快照"; });
const chip = () => p.$$eval(".strip:not(.master):not(.bus) .strip-perfdb", (bs) => bs.map((x) => x.textContent).join("|"));
const setCal = (db) => p.evaluate((db) => { const m = window.__moonsinger, st = m.state(), role = st.song.parts[0].role, ex = structuredClone(m.extras());
  if (!ex.lounge[role]) return false;
  ex.lounge[role].candidates.find((c) => c.id === ex.lounge[role].active).calibrationDb = db; m.commit({ extras: ex }, { locus: { kind: "lounge", label: "test" } }); return true; }, db);

const c0 = await cal();
check(c0 === "没有快照" || c0 === 0, "新歌的乐手：没写或 0（第 14 条起默认 0）", String(c0));
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(300);
check(await p.$eval(".studio", (e) => !e.hidden), "听 = 混音台开着");
check((await chip()) === "", "乐手 0 = 推子旁边不写", await chip());

// 老歌：乐手明写 −6。新歌在内存里还没有乐手的快照（存的时候才把默认整份写进去）——走真实的路：歌手牌 → 乐器设置 → 「−1 dB」一下（快照建起来），再写成 −6
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
await p.click('[data-v="cal:-1"]'); await p.waitForTimeout(150);
check((await cal()) === -1, "乐器页「−1 dB」= −1（从默认 0 起）", String(await cal()));
const ok = await setCal(-6);
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(300);
check(ok, "能把乐手写成 −6（模拟老歌）");
await p.waitForTimeout(200);
check((await chip()) === "乐手 -6.0 dB", "基础页：推子旁边写「乐手 -6.0 dB」", await chip());
const title = await p.$eval(".strip:not(.master):not(.bus) .strip-perfdb", (x) => x.getAttribute("title") ?? "").catch(() => "");
check(/-6\.0 dB/.test(title) && /一共/.test(title), "钮上的说明：推子 + 乐手 = 一共多少", title);
await p.click('.studio [data-v="tab"][data-tab="send"], .studio [data-tab="send"]'); await p.waitForTimeout(200);
check((await chip()) === "乐手 -6.0 dB", "发送页的推子旁边也写", await chip());
await p.click(".strip:not(.master):not(.bus) .strip-perfdb"); await p.waitForTimeout(400);
const inst = await p.evaluate(() => { const el = document.querySelector('[data-v="cal:-1"]'); if (!el) return null; const v = el.closest(".ip-v"), r = v.getBoundingClientRect();
  return { shown: !document.querySelector(".inst-page, #inst")?.hidden, inView: r.top >= 0 && r.bottom <= innerHeight, val: v.querySelector(".ip-val")?.textContent ?? "" }; });
check(!!inst && inst.inView, "点它 = 乐器页「响度」那一行在屏幕里", JSON.stringify(inst));
check(!!inst && /[-−]6/.test(inst.val), "乐器页写着 −6", JSON.stringify(inst));
check(!!(await p.$('[data-v="def:cal"]')), "乐器页有「默认」钮（−6 不是默认）");
await p.click('[data-v="def:cal"]'); await p.waitForTimeout(200);
check((await cal()) === 0, "「默认」= 0", String(await cal()));
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(300);
check((await chip()) === "", "回到 0：混音台不再写", await chip());
check(!errs.length, "没有页面错误", errs.join(" / "));
await b.close();
console.log(`\n  ${pass} 过，${fail} 红`);
process.exit(fail ? 1 : 0);
