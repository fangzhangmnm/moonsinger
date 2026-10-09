// test/e2e/arrange.mjs —— 真浏览器 E2E：编排那一行（歌名下面；只在「全部」视图里有；点了就地改；写错的说为什么；本段视图里没有）。
// created 2026-10-08 by Claude Opus 5.5（user「编排我建议就是总paper的顶上说一下，然后只有全部paper的时候可见，就是一行，对吧，就和title一样」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/arrange.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const box = () => p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), a = L.arrangement; return a && { x: sh.left + L.pageX.left + a.x + 30, y: sh.top + a.y + a.h / 2 }; });
await p.evaluate(() => window.__moonsinger.setScope("segment")); await p.waitForTimeout(150);
check((await box()) === null, "本段视图：没有编排那一行");
await p.evaluate(() => window.__moonsinger.setScope("all")); await p.waitForTimeout(150);
const at = await box();
check(!!at, "全部视图：有编排那一行");
check(await p.$$eval("#score text.arr-empty", (e) => e.length) === 1, "没写 = 灰字说怎么写");
await p.mouse.click(at.x, at.y); await p.waitForTimeout(150);
check(await p.$eval(".title-input", (e) => !e.hidden && e.classList.contains("arr")), "点了 = 就地开框");
await p.keyboard.type("1 x2"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
check(await p.evaluate(() => window.__moonsinger.state().song.arrangement) === "1 x2", "回车 = 存进歌里");
check(await p.$$eval("#score text.arr", (e) => e.map((x) => x.textContent).join()) === "1 x2", "谱上画出来");
check(await p.$$eval("#score text.arr-issue", (e) => e.length) === 0, "写对了 = 没有灰字");
const at2 = await box();   // 进了文字焦点、谱的位置会挪：重新量
await p.mouse.click(at2.x, at2.y); await p.waitForTimeout(150);
await p.keyboard.type("1 副歌"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);   // 开框时整行已经选中
const why = await p.$$eval("#score text.arr-issue", (e) => e.map((x) => x.textContent).join());
check(/没有叫「副歌」的纸/.test(why), "写错的 = 后面灰字说为什么", why);
// 回归（v0.7.35）：写了编排、各段速度不同 = 音量曲线（力度 / 重音）的时刻照放的顺序算（v0.7.34 用了默认顺序的速度表、和音对不上）。
// 第一张 ♩=60、第一个音前 pp；第二张 ♩=180；编排「2 1」→ pp 从第二张放完（2 个八分 @180 = ⅓ 秒）起，不是 1 秒（新开一页：上面改编排后键盘在文字状态）
const q = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); q.on("pageerror", (e) => errs.push(e.message));
await q.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await q.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await q.click(`.pad-key[data-k] >> nth=${i}`); await q.waitForTimeout(40); }
await q.evaluate(() => window.__moonsinger.addPaper()); await q.waitForTimeout(200);
for (let i = 0; i < 2; i++) { await q.click(`.pad-key[data-k] >> nth=${i + 4}`); await q.waitForTimeout(40); }
const drop = await q.evaluate(async () => {
  const m = window.__moonsinger; m.setScope("all"); const st = m.state(), [a, b2] = st.song.papers, pid = st.song.parts[0].id;
  const bpm = (toks, v) => toks.map((t) => (t.kind === "tempo" ? { ...t, bpm: v } : t));
  const ta = bpm(a.tracks[pid], 60), k = ta.findIndex((t) => t.kind === "note");
  ta.splice(k, 0, { kind: "dyn", id: 99001, value: "pp" });
  m.set({ ...st, song: { ...st.song, arrangement: "2 1", papers: [{ ...a, tracks: { ...a.tracks, [pid]: ta } }, { ...b2, tracks: { ...b2.tracks, [pid]: bpm(b2.tracks[pid], 180) } }] } });
  m.singer.sing = async () => ({ samples: new Float32Array(48000 * 4).fill(0.1), sr: 48000 });
  let got = null; m.singer.play = (r) => { got = r; };
  document.getElementById("playBtn").click();
  for (let i = 0; i < 50 && !got; i++) await new Promise((ok) => setTimeout(ok, 50));
  if (!got) return null;
  const x = got.samples, ref = Math.abs(x[Math.round(0.6 * got.sr)]);   // 0.1 秒（谱上）的地方 = 还没 pp（月读提前量 0.5 秒）
  for (let i = Math.round(0.6 * got.sr); i < x.length; i++) if (Math.abs(x[i]) < ref * 0.5) return i / got.sr - 0.5;
  return -1;
});
check(drop !== null && Math.abs(drop - 1 / 3) < 0.03, "编排「2 1」+ 各段速度不同：pp 从 ⅓ 秒起（照放的顺序算速度）", String(drop));
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
