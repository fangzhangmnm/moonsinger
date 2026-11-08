// test/e2e/pad-follow.mjs —— 真浏览器 E2E：换了乐器，小键盘的提示音域和窗口跟过去（v0.16.23）。
// created 2026-11-08 by Claude Opus 5.5（user 11-08「换歌手、换乐器的时候，有时候你键盘上的推荐就是默认音域，它没有跟上来，这个你能不能瑞士奶酪看一下…应该是推还是拉，你仔细想一下」）。
// 守：提示和窗口都是「拉 + 对账」——不管从哪条路换了乐器（目录、撤销），下一次重画就对上：
//   从目录换上低音提琴（音域 E1–G3）= 窗口挪到盖住它、键底提示条跟着；撤销 = 窗口跟回人声那一档；人自己拨过音域旋钮、谁在弹没变 = 不挪。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/pad-follow.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
async function reveal(p, cid) {   // 手风琴：逐组点开直到那一行露出来（同 cast-back.mjs）
  const n = await p.$$eval(".finder-group", (gs) => gs.length);
  for (let k = 0; k < n && !(await p.$(`.inst-row[data-c="${cid}"]`)); k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(60); }
  }
}
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
// 不拦 .sf2：要真的换上一件乐器（本机音源库，几秒）
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(150);
// 窗口 = 键盘上最低、最高那个键的 MIDI（pad 的音键带 data-midi 或从提示条读不到时用 range 旋钮的字）
const win = () => p.evaluate(() => { const ks = [...document.querySelectorAll(".pad-key[data-k]")].map((k) => Number(k.dataset.midi)).filter(Number.isFinite); return ks.length ? `${Math.min(...ks)}-${Math.max(...ks)}` : document.querySelector('.pad-tools [data-knob="range"]')?.textContent ?? ""; });
const hinted = () => p.evaluate(() => [...document.querySelectorAll(".pad-key[data-k].in-range, .pad-key[data-k].hint")].map((k) => Number(k.dataset.midi)).filter(Number.isFinite));
const w0 = await win();
// 从目录换上低音提琴（音域 E1–G3 = MIDI 28–55）
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForTimeout(400);
await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(200);
await reveal(p, "Q80019"); await p.click('.inst-row[data-c="Q80019"]'); await p.waitForTimeout(300);
await p.click('.prov [data-v="cast"] >> nth=0'); await p.waitForTimeout(600); await p.waitForFunction(() => !document.querySelector(".finder:not([hidden])"), null, { timeout: 30000 }).catch(() => {});
if (await p.$(".finder:not([hidden])")) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); }   // 目录还开着（这件的音源被测试拦了）= 关掉回谱：目录开着时键盘照试听台走
const w1 = await win(), [lo1, hi1] = w1.split("-").map(Number);
check(w1 !== w0 && lo1 <= 40 && hi1 >= 36, "换上低音提琴 = 窗口挪到盖住它的音域", `${w0} → ${w1}`);
const h1 = await hinted();
check(h1.length > 0 && Math.max(...h1) <= 55 && Math.min(...h1) >= 28, "键底提示条 = 低音提琴的音域", JSON.stringify(h1.slice(0, 4)));
// 人自己拨音域旋钮：谁在弹没变 = 重画也不挪回去
await p.evaluate(() => window.__moonsinger.set(window.__moonsinger.state())); await p.waitForTimeout(150);
check((await win()) === w1, "谁在弹没变、重画 = 窗口不动", await win());
// 撤销 = 换回小月相 = 窗口跟回去
const nm = () => p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(","));
const n1 = await nm();
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(500);   // 撤销（顶栏那颗早挪到底下小条里了）
const n2 = await nm();
const w2 = await win();
check(n2 !== n1 && w2 !== w1 && Number(w2.split("-")[1]) >= 64, "撤销（换回小月相）= 窗口跟回人声那一档", `${n1} → ${n2}；${w1} → ${w2}`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npad-follow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
