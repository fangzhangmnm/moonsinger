// test/e2e/pedal-default.mjs —— 真浏览器 E2E：踏板 11-3「没写踏板记号时留不留住音」（乐手身上的 articulation.pedal）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：乐器页那一行两格 + 出厂那一句（对每件乐器都说得出：测试用的 .sf2 = 自己的音源文件）；点「留住音」= 写进乐手身上；声部名下面「留住音」角标；
//   默认留住时踏板菜单延音那一行是「抬起」「换踏板」（算上默认）；写进去的换踏板 / 抬起画成实色、不画名字（统筹「默认留住音的那一截怎么画」）；
//   改回「不留」= 角标没了、同一段照常画名字（换人之后画法跟着变，数据不动）。不联网：台上换成测试用的小 .sf2 里的 Square Lead。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/pedal-default.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { fileURLToPath } from "node:url";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const SF2 = fileURLToPath(new URL("../fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1000, height: 820 } })).newPage(), errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 不下 GS 音源（这里只用本地文件）
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 6; i++) { await p.click(".pad-key[data-k] >> nth=" + (i % 4)); await p.waitForTimeout(60); }
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300);
const [fc] = await Promise.all([p.waitForEvent("filechooser"), p.click(".finder-bar .finder-file")]); await fc.setFiles(SF2); await p.waitForSelector(".finder-own"); await p.waitForTimeout(150);
await p.click('.finder-own .prov[data-p="sf2|0:80"] [data-v="cast"]'); await p.waitForTimeout(500);
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
const pedalOf = () => p.evaluate(() => { const m = window.__moonsinger, st = m.state(), role = st.song.parts[0].role, r = m.extras().lounge[role]; return r.candidates.find((c) => c.id === r.active).articulation.pedal; });
const openInst = async () => { await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(400); };
const closeInst = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(300); };
const badges = () => p.$$eval("#score .part-badge", (es) => es.map((e) => e.textContent).join(" | "));
check((await pedalOf()) === "up", "上场写成具体的：自己的音源文件 = 不留（up）", String(await pedalOf()));
await openInst();
const page = await p.$eval(".inst-page", (e) => e.textContent ?? "");
check(!!(await p.$('.inst-page [data-v="pedal:down"]')) && !!(await p.$('.inst-page [data-v="pedal:up"].is-on')), "乐器页「没写踏板记号时」两格，「不留」亮着");
check(page.includes("出厂：不留——自己的音源文件，目录不认识它"), "出厂那一句：是哪一边 + 依据（自己的音源文件）");
await p.click('.inst-page [data-v="pedal:down"]'); await p.waitForTimeout(300);
check((await pedalOf()) === "down", "点「留住音」= 写进乐手身上（down）");
await closeInst();
check((await badges()).includes("留住音"), "声部名下面「留住音」角标", await badges());
const caretAfterNth = (k) => p.evaluate((k) => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part]; let c = -1, i = 0; for (; i < t.length; i++) if (t[i].kind === "note" && ++c === k) break; m.set({ ...s, sel: null, caret: i + 1 }); }, k);
const openMenu = async () => {
  if (!(await p.$(".pad-grid.symbols"))) { await p.click(".pad-head [data-kbswitch]"); await p.waitForTimeout(80); }
  await p.click('.pad-head [data-sympage="mark"]'); await p.waitForTimeout(80);
  await p.click('[data-sym="pedal"]'); await p.waitForTimeout(250);
  return p.$$eval(".pedal-menu [data-v]", (es) => es.map((e) => e.dataset.v));
};
await caretAfterNth(1); const vs = await openMenu();
check(vs.slice(0, 2).join(",") === "sustain:act:up,sustain:act:change", "默认留住时延音那一行 = 「抬起」「换踏板」（算上默认）", vs.join(","));
await p.click('.pedal-menu [data-v="sustain:act:change"]'); await p.waitForTimeout(200);
await caretAfterNth(3); await openMenu(); await p.click('.pedal-menu [data-v="sustain:act:up"]'); await p.waitForTimeout(200);
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
const ink = () => p.evaluate(() => { const s = window.__moonsinger.state(), t = s.song.papers[0].tracks[s.at.part].filter((x) => x.kind === "pedal");
  return t.map((x) => { const es = [...document.querySelectorAll(`#score [data-tok="${x.id}"]`)]; return { act: x.act, n: es.length, named: es.some((e) => e.tagName.toLowerCase() === "text"), mute: es.some((e) => e.classList.contains("art-mute")) }; }); });
const held = await ink();
check(held.length === 2 && held.every((x) => x.n > 0 && !x.named && !x.mute), "默认留住：换踏板 / 抬起 = 实色、不画名字（这一截没有「Ped.」）", JSON.stringify(held));
await openInst(); await p.click('.inst-page [data-v="pedal:up"]'); await p.waitForTimeout(300); await closeInst();
check(!(await badges()).includes("留住音"), "改回「不留」：角标没了", await badges());
const plain = await ink();
check(plain[0]?.named && !plain[0]?.mute, "改回「不留」：同一个换踏板照常画名字（没踩就换 = 踩下）", JSON.stringify(plain));
check(!errs.length, "没有页面错误", errs.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
