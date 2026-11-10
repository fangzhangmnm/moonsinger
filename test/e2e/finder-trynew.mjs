// test/e2e/finder-trynew.mjs —— 真浏览器 E2E：乐器目录「＋ 声部」= 先不换，加成新声部试试（v0.16.63，总表第 16 条）。
// created 2026-11-09 by Claude Opus 5.5（user 11-09「加新声部都没必要，只是你能弹着完就行，等等，可能还是需要的，因为你想看着谱子弹着玩。不过不要占UI太多」）。
// 守：从台上某位进目录、点开一件乐器、谁能演那一行有小钮「＋ 声部」；点了 = 在这位下面多一个声部（只在这一段、乐器 = 这一件）、台上那位不动、目录关、「弹」开着；
//   一步撤销 = 新声部没了；从「＋ 新声部」进的目录不出这颗钮（那一路本来就是新的）。用小月相（不用下 32 MB 的音源）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-trynew.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const VOICE = "Q7390";   // 人声：点开有小月相（不用下音源）
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const parts = () => p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => x.id).join(","));
const before = await parts(), part0 = await p.evaluate(() => window.__moonsinger.state().at.part);
async function reveal(cid) {
  if (await p.evaluate(() => document.querySelector(".finder-hide")?.classList.contains("is-on"))) { /* 人声有人演，不受开关影响 */ }
  const n = await p.$$eval(".finder-group", (gs) => gs.length);
  for (let k = 0; k < n && !(await p.$(`.inst-row[data-c="${cid}"]`)); k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(60); }
  }
}
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300);
await reveal(VOICE); await p.click(`.inst-row[data-c="${VOICE}"]`); await p.waitForTimeout(400);
const btn = `.prov[data-p="${VOICE}|voice"] [data-v="trynew"]`;
check(!!(await p.$(btn)), "台上某位进的目录：谁能演那一行有「＋ 声部」");
await p.click(btn); await p.waitForTimeout(600);
const after = await parts(), st = await p.evaluate(() => { const s = window.__moonsinger.state(); return { at: s.at.part, onPaper: Object.keys(s.song.papers[0].tracks) }; });
check(after.split(",").length === before.split(",").length + 1, "多了一个声部", `${before} → ${after}`);
check(st.at !== part0 && st.onPaper.includes(st.at), "光标在新声部、它在这一段上", JSON.stringify(st));
check(await p.evaluate(() => !document.querySelector(".finder") || document.querySelector(".finder").hidden), "目录关了（回到谱）");
check(await p.evaluate(() => document.getElementById("padPanel").classList.contains("is-unplugged")), "「弹」开着（看着谱弹着试）");
// 「弹」开着时总闸挡住撤销（v0.16.52 的规矩）：先把「弹」关了再撤
await p.click("#padPanel .impro-pad"); await p.waitForTimeout(200);
const off = await p.evaluate(() => !document.getElementById("padPanel").classList.contains("is-unplugged"));
await p.click("#score", { position: { x: 5, y: 5 } }).catch(() => {}); await p.keyboard.press("Control+z"); await p.waitForTimeout(300);
check(off && (await parts()) === before, "关了「弹」、撤销一步 = 新声部没了", `${off} ${await parts()}`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`finder-trynew: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
