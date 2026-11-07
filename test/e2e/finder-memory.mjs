// test/e2e/finder-memory.mjs —— 真浏览器 E2E：乐器目录的三件小事（v0.15.7）。
// created 2026-11-07 by Claude Opus 5.5。
//   ① 默认按年代（家族周账 F-205，user 11-05「还是默认年代排序的那个order」）；
//   ② 点开的那件没有谁能演 = 试听键盘静音，不是还弹着上一个声音（F-210，user 11-07「如果选中的那个类别里面没有合适的音源的时候，我在即兴的时候应该是静音，而不是显示弹在上一个音源」）；
//      之后点能演的（这里用小月相，不下 GS 音源）= 又出声；
//   ③ 关掉再开 = 回到上次翻到的地方、点开的那件还开着、静音还在（F-197，user 11-05「选乐器应该能记住上次翻到哪里了」）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-memory.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const NOBODY = "Q207691", VOICE = "Q7390";   // 特雷门琴（目录里没有谁能演）/ 人声（点开有小月相）
// 手风琴（v0.16.3）：乐器在收着的组里 = 逐组点开，直到那一行露出来
async function reveal(p, cid) {
  const n = await p.$$eval(".finder-group", (gs) => gs.length);
  for (let k = 0; k < n && !(await p.$(`.inst-row[data-c="${cid}"]`)); k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(60); }
  }
  return !!(await p.$(`.inst-row[data-c="${cid}"]`));
}
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 不下 32 MB 的 GS：点人声那一行先试 GS 会失败（报一句），接着点小月相
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
const blank = await p.evaluate(() => Array.from(window.__moonsinger.bytes()));   // 「另一首」= 还没碰过乐器目录的样子（⑤ 用）
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
const openFinder = async () => { await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300); };
await openFinder();
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__aud = []; const on = e.auditionOn.bind(e); e.auditionOn = (...a) => { window.__aud.push(a[1]?.kind); return on(...a); }; });
const press = async (k) => { const n = await p.evaluate(() => window.__aud.length); await p.keyboard.press(k); await p.waitForTimeout(150); return (await p.evaluate(() => window.__aud.length)) - n; };

// ① 默认按年代、下拉第一项就是它
const sort = await p.$eval(".finder-sort", (s) => ({ v: s.value, first: s.options[0].value }));
check(sort.v === "year" && sort.first === "year", "默认按年代（下拉第一项也是）", JSON.stringify(sort));

// ② 什么都没点 = 默认的哼（出声）；点开没人能演的那件 = 静音
check((await press("Digit1")) === 1, "什么都没点：键盘出声（默认的哼）");
await reveal(p, NOBODY); await p.click(`.inst-row[data-c="${NOBODY}"]`); await p.waitForTimeout(300);
check(await p.$(`.inst-row.is-open[data-c="${NOBODY}"] + .inst-prov .prov-none`) !== null, "点开特雷门琴：写着「目录里还没有谁能演它」");
check((await press("Digit2")) === 0, "点开没人能演的那件：键盘不出声（不是还弹着上一个）");
// 点能演的（人声 → 小月相）= 又出声
await reveal(p, VOICE); await p.click(`.inst-row[data-c="${VOICE}"]`); await p.waitForTimeout(300);
await p.click(`.prov[data-p="${VOICE}|voice"]`); await p.waitForTimeout(300);
check((await press("Digit3")) === 1, "点小月相：又出声");
// 再点开没人能演的、记下翻到哪
await reveal(p, NOBODY); await p.click(`.inst-row[data-c="${NOBODY}"]`); await p.waitForTimeout(300);
check((await press("Digit4")) === 0, "再点开特雷门琴：又静音");
const y0 = await p.$eval(".finder-list", (l) => l.scrollTop);

// ③ 关掉再开：回到原地、那件还开着、静音还在
await p.click('.finder-bar [data-v="back"]'); await p.waitForTimeout(300);
check(!(await p.$eval(".finder", (e) => !e.hidden)), "「← 谱」关掉了目录");
await openFinder();
const y1 = await p.$eval(".finder-list", (l) => l.scrollTop);
check(Math.abs(y1 - y0) <= 2, "重开 = 回到上次翻到的地方", `${y0} → ${y1}`);
check(await p.$(`.inst-row.is-open[data-c="${NOBODY}"]`) !== null, "重开：上次点开的那件还开着");
check((await press("Digit5")) === 0, "重开：还是静音（和亮着的对得上）");
// ④ 目录 v14（仓鼠 eec835f；F-212，user 11-07「midi breath不是呼吸是演奏技巧」）：GM 122 Breath Noise 在长笛名下，「呼吸」没人能演
await reveal(p, "Q209554"); await p.click('.inst-row[data-c="Q209554"]'); await p.waitForTimeout(300);
check(await p.$('.prov[data-p="Q209554|0:121"]') !== null, "长笛点开：有 GeneralUser GS · Breath Noise（气声）");
await reveal(p, "Q9530"); await p.click('.inst-row[data-c="Q9530"]'); await p.waitForTimeout(300);
check(await p.$('.inst-row.is-open[data-c="Q9530"] + .inst-prov .prov-none') !== null, "呼吸点开：目录里还没有谁能演它");
// ⑤ 翻到哪记进这首歌的文件（v0.16.6，user 11-07「乐器列表记录滚动位置的话，是每个文件自己记录，不是用户设置」）：换一首 = 那首自己的；开回来 = 回到原位
await p.keyboard.press("Escape"); await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(200);   // 目录 → 乐器页 → 谱
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300); await openFinder();
await p.selectOption(".finder-sort", "family"); await p.waitForTimeout(150);
await p.click('.finder-group[data-g="2"] > .finder-group-h'); await p.waitForTimeout(150);
await p.evaluate(() => { const l = document.querySelector(".finder-list"); l.scrollTop += 120; }); await p.waitForTimeout(100);
const want = await p.evaluate(() => ({ gid: document.querySelector('.finder-group.is-open').dataset.gid, y: document.querySelector(".finder-list").scrollTop }));
await p.click('.finder-bar [data-v="back"]'); await p.waitForTimeout(200);
const A = await p.evaluate(() => Array.from(window.__moonsinger.bytes()));
const sj = await p.evaluate((arr) => window.__moonsinger.zipText(new Uint8Array(arr), ".moonsinger/score.json"), A);
check(/"finder":\s*\{\s*"mode":\s*"family"/.test(sj) && sj.includes(want.gid), "翻到哪写进这首歌的文件（score.json 视图）", sj.slice(sj.indexOf('"finder"'), sj.indexOf('"finder"') + 120));
const reopen = async (arr) => { await p.keyboard.press("Escape"); await p.waitForTimeout(150); await p.evaluate((a) => { const ms = window.__moonsinger; ms.load(ms.open("x.mxl", new Uint8Array(a))); }, arr); await p.waitForTimeout(300);
  await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300); await openFinder();
  return p.evaluate(() => ({ mode: document.querySelector(".finder-sort").value, open: [...document.querySelectorAll(".finder-group.is-open")].map((g) => g.dataset.gid).join(), y: document.querySelector(".finder-list").scrollTop })); };
const b1 = await reopen(blank);
check(b1.mode === "year" && b1.open === "" && b1.y === 0, "开另一首（没翻过目录）= 默认：按年代、全收着、在顶上", JSON.stringify(b1));
await p.click('.finder-bar [data-v="back"]'); await p.waitForTimeout(200);
const a1 = await reopen(A);
check(a1.mode === "family" && a1.open === want.gid && Math.abs(a1.y - want.y) <= 2, "开回第一首 = 按族、那一组展开、翻到原来的位置", `${JSON.stringify(a1)} / ${JSON.stringify(want)}`);
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinder-memory: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
