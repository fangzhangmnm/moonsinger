// test/e2e/cast-back.mjs —— 真浏览器 E2E：乐器页点回之前用过的候选 = 谱上名 / 乐器跟着换回（v0.16.15）。
// created 2026-11-08 by Claude Opus 5.5（user 11-07「你点了记忆的旧的音源选项的时候，名字没有」→ AI 查出「点回旧候选只换了谁来演，谱上和乐器页写的乐器名不跟着换回去」→ user「我说的就是这个问题」）。
// 守：从目录选「合唱」交给小月相（不用下 GS 音源）= 谱上 Choir；点元音版（旧候选，没记过上场时的乐器 = 按目录反查成人声）= 谱上 Voice；点回完整版（记着 Choir）= 谱上 Choir。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/cast-back.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
async function reveal(p, cid) {   // 手风琴：逐组点开直到那一行露出来（同 finder-names.mjs）
  const n = await p.$$eval(".finder-group", (gs) => gs.length);
  for (let k = 0; k < n && !(await p.$(`.inst-row[data-c="${cid}"]`)); k++) {
    if (!(await p.$eval(`.finder-group[data-g="${k}"]`, (g) => g.classList.contains("is-open")))) { await p.click(`.finder-group[data-g="${k}"] > .finder-group-h`); await p.waitForTimeout(60); }
  }
}
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
await p.click('.ip-btns [data-v="finder"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(300);
await reveal(p, "Q131186"); await p.click('.inst-row[data-c="Q131186"]'); await p.waitForTimeout(300);
await p.click('.prov[data-p="Q131186|voice"] [data-v="cast"]'); await p.waitForTimeout(500);
const role = () => p.$eval("#roleIn", (e) => e.value);
check((await role()) === "Choir", "选合唱 = 谱上写 Choir", await role());
const chipFor = async () => { const ids = await p.$$eval('[data-v^="cand:"]', (cs) => cs.map((c) => c.dataset.v)); return ids; };
const ids = await chipFor();
check(ids.length >= 2, "乐器页有两颗候选（完整版 / 元音版）", ids.join(","));
await p.click(`[data-v="${ids[1]}"]`); await p.waitForTimeout(300);
check((await role()) === "Voice", "点元音版（旧候选，没记过）= 按目录反查成人声：谱上 Voice", await role());
await p.click(`[data-v="${ids[0]}"]`); await p.waitForTimeout(300);
check((await role()) === "Choir", "点回完整版（记着上场时是合唱）= 谱上 Choir", await role());
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
const onScore = await p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(","));
check(onScore.includes("Choir"), "谱上的歌手名也跟着", onScore);
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(","))).includes("Voice"), "撤销一步 = 名字和人一起退回", await p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(",")));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ncast-back: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
