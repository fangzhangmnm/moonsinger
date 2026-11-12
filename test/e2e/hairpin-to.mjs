// test/e2e/hairpin-to.mjs —— 真浏览器 E2E：渐强渐弱的「变到」（施工单 7-N 补）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   user：「怎么样在后面加一个符号？」「这种渐强渐弱里面那个括号的小字，我们都让它可以手动设置成别的」。守：
//   ① 点发夹 = 小菜单里有「变到」（走一档 + 八档），没写终点时亮「走一档」② 选 fff = 最后一个音后面放一个 fff、说一句放在哪、推定的灰字没了；一步撤销回去
//   ③ 点末端的推定灰字 = 开的是同一个菜单（同一条发夹）④ 选回「走一档」= 那个 fff 去掉 ⑤ 和方向反着的那几档标出来（不拦）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/hairpin-to.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 一个音的滚奏：ppp < 一个全音符（滚奏）
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].filter((t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo");
  const toks = [...head, { kind: "dyn", id: 900, value: "ppp" }, { kind: "hairpin", id: 901, dir: "cresc" }, { kind: "note", id: 902, pitch: { step: "C", alter: 0, octave: 4 }, dur: 3360, lyric: null, art: ["roll"] }];
  m.set({ ...st, song: { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [pid]: toks } }] }, caret: toks.length, sel: null });
});
await p.waitForTimeout(300); await p.evaluate(() => { document.querySelector(".notice-stack")?.replaceChildren(); window.__moonsinger.setMode("symbols"); }); await p.waitForTimeout(200);
const kinds = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].slice(3).map((t) => (t.kind === "dyn" ? `dyn:${t.value}` : t.kind)).join(" "); });
/** 发夹的点击框（第 k 个：0 = 发夹本身，1 = 末端推定灰字那一块）在屏幕上的中心。 */
const pinHit = (k) => p.evaluate((k) => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), hs = L.dyns.filter((d) => d.kind === "hairpin"); const h = hs[k]; return h ? { x: sh.left + L.pageX.left + h.x + (k === 0 ? Math.min(3, h.w / 3) : h.w / 2), y: sh.top + h.y + h.h / 2, n: hs.length } : { n: hs.length }; }, k);   // 发夹本身点靠左那一截（一个音的发夹很短，中心挨着终点的力度字）
const implied = () => p.$$eval("#score text.dyn-implied", (e) => e.length);
const toasts = () => p.evaluate(() => [...document.querySelectorAll(".notice-stack [data-notice-id], .notice-stack .toast")].map((n) => n.textContent ?? "").join(" | "));

check((await implied()) === 1 && (await pinHit(1)).n === 2, "没写终点：末端有推定的灰字，它也有一块点击框（发夹两块）", `${await implied()} / ${(await pinHit(1)).n}`);
let h = await pinHit(0); await p.mouse.click(h.x, h.y); await p.waitForTimeout(200);
check((await p.$$eval(".ctx-menu [data-v^='to:']", (e) => e.length)) === 9, "点发夹 = 小菜单里有「变到」：走一档 + 八档");
check(await p.$eval(".ctx-menu [data-v='to:step']", (e) => e.classList.contains("is-on")), "没写终点 = 「走一档」亮着");
check(await p.$eval(".ctx-menu [data-v='to:ppp']", (e) => e.classList.contains("is-against")) && !(await p.$eval(".ctx-menu [data-v='to:pp']", (e) => e.classList.contains("is-against"))) && !(await p.$eval(".ctx-menu [data-v='to:ppp']", (e) => e.disabled)), "渐强里不比起点（ppp）响的那一档（ppp 本身）标出来、不拦；pp 往上不标");
await p.click(".ctx-menu [data-v='to:fff']"); await p.waitForTimeout(250);
check((await kinds()) === "dyn:ppp hairpin note dyn:fff", "选 fff = 最后一个音后面放一个 fff", await kinds());
check(/在这一段最后一个音后面放了 fff/.test(await toasts()), "说一句放在了哪", (await toasts()).slice(0, 60));
check((await implied()) === 0, "推定的灰字没了（终点是真的 fff）");
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await kinds()) === "dyn:ppp hairpin note", "一步撤销就回去");
// ③ 点推定灰字 = 同一个菜单
h = await pinHit(1); await p.mouse.click(h.x, h.y); await p.waitForTimeout(200);
check((await p.$$eval(".ctx-menu [data-v^='to:']", (e) => e.length)) === 9 && !!(await p.$(".ctx-menu [data-v^='dir:']")), "点末端的推定灰字 = 开的是这条发夹的菜单（同一个「变到」）");
await p.click(".ctx-menu [data-v='to:ff']"); await p.waitForTimeout(250);
check((await kinds()) === "dyn:ppp hairpin note dyn:ff", "从灰字那儿选 ff = 变成真的 ff", await kinds());
// ④ 选回「走一档」
h = await pinHit(0); await p.mouse.click(h.x, h.y); await p.waitForTimeout(200);
check(await p.$eval(".ctx-menu [data-v='to:ff']", (e) => e.classList.contains("is-on")), "现在的终点 ff 亮着");
await p.click(".ctx-menu [data-v='to:step']"); await p.waitForTimeout(250);
check((await kinds()) === "dyn:ppp hairpin note" && (await implied()) === 1, "选「走一档」= 结尾那个 ff 去掉、灰字回来", await kinds());
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
