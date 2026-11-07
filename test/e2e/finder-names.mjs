// test/e2e/finder-names.mjs —— 真浏览器 E2E：谱上名 / 详细说明 / 简写三层（v0.16.2）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「为什么我从era里面选的flute在sheet上面显示western concept flute，这个名字太麻烦了」
//   「所以应该是有详细解释，名字，简写？think critically about it」「不只是长笛，而是系统的看一下」；仓鼠 v15 scoreName）。
// 守：目录第二行 = 谱上名 · 百科名 · 日文名；从目录选「人声」交给小月相（不用下 GS 音源）= 谱上写 Voice（原来 Human voice），乐器页写出详细说明和简写。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-names.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
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
await p.route(/\.sf2(\?|$)/, (r) => r.abort());   // 点人声那一行会先试 GS 的 Choir：不下 32 MB，失败报一句就行
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300);

await reveal(p, "Q209554");
const alt = await p.$eval('.inst-row[data-c="Q209554"] .inst-name > span', (e) => e.textContent);
check(alt.startsWith("Flute · Western concert flute"), "目录里长笛的第二行 = 谱上名 · 百科名 · 日文名", alt);
await reveal(p, "Q208173");
const synth = await p.$eval('.inst-row[data-c="Q208173"] .inst-name > span', (e) => e.textContent);
check(synth.startsWith("Electric Guitar · Solid-body electric guitar (Fender Stratocaster)"), "型号：谱上写功能名，型号在详细说明里", synth);

await reveal(p, "Q7390"); await p.click('.inst-row[data-c="Q7390"]'); await p.waitForTimeout(300);
await p.click('.prov[data-p="Q7390|voice"] [data-v="cast"]'); await p.waitForTimeout(500);
check(await p.$eval(".inst-page", (e) => !e.hidden), "选了 = 回到乐器页");
const rn = await p.$eval("#roleIn", (e) => e.value);
check(rn === "Voice", "谱上写 Voice（原来是整个百科名 Human voice）", rn);
const det = await p.$eval(".role-detail", (e) => e.textContent);
check(det.includes("人声 · Human voice") && /第二行起写 \S+/.test(det), "乐器页写出详细说明和简写", det);
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
const onScore = await p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent));
check(onScore.includes("Voice"), "谱上声部名 = Voice", JSON.stringify(onScore));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinder-names: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
