// test/e2e/cast-back.mjs —— 真浏览器 E2E：换乐器 = 点歌手名一个钮进目录（v0.16.18 搬家 C）；点回之前用过的 = 谱上名 / 乐器跟着换回（v0.16.15）。
// created 2026-11-08 by Claude Opus 5.5（user 11-07「你点了记忆的旧的音源选项的时候，名字没有」→「我说的就是这个问题」；
//   「你点了谱表的乐器名之后，按一个按钮就立刻能换，然后配置是另外一回事」——搬家清单一到六 user 拍了）。
// 守：歌手名小卡第一颗 = 换乐器 → 直接进目录；选「合唱」交给小月相（不用下 GS 音源）= 回到谱、谱上 Choir；
//   目录顶上「这首歌里用过的」：点元音版（旧候选，没记过上场时的乐器 = 按目录反查成人声）= 谱上 Voice；点回完整版（记着 Choir）= 谱上 Choir；撤销一步 = 名字和人一起退回。
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
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(); m.set({ ...st, song: { ...st.song, textLang: "en" } }); });   // 谱上的字钉英文（12-4）：这里看的是乐器换回来，名字用英文叫法比
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
const names = () => p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(","));
const finderOpen = () => p.evaluate(() => !!document.querySelector(".finder:not([hidden])"));
const swap = async () => { await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForTimeout(400); };
await swap();
check(await finderOpen(), "歌手名小卡第一颗「换乐器」= 直接进乐器目录");
await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(200);
await reveal(p, "Q131186"); await p.click('.inst-row[data-c="Q131186"]'); await p.waitForTimeout(300);
await p.click('.prov[data-p="Q131186|voice"] [data-v="cast"]'); await p.waitForTimeout(500);
check(await finderOpen(), "选合唱 = 目录还开着（v0.16.35：选完不关，放着歌也能接着换）");
await p.click('.finder [data-v="back"]'); await p.waitForTimeout(300);
check(!(await finderOpen()) && (await names()).includes("Choir"), "回谱：谱上写 Choir", await names());
// v0.16.38：没调过的内置两位不进「这首歌的乐器预设」（施工单 §5 R4）——先把小月相调一下（响度），它才留在那一排
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), role = st.song.parts.find((x) => x.id === st.at.part).role, ex = structuredClone(m.extras());
  ex.lounge[role].candidates.find((c) => c.id === ex.lounge[role].active).calibrationDb = -3; m.commit({ extras: ex }, { locus: { kind: "lounge", label: "test" } }); });
await swap();
await reveal(p, "Q7390"); await p.click('.inst-row[data-c="Q7390"]'); await p.waitForTimeout(300);
check(!!(await p.$('.prov[data-p="Q7390|vowel"]')), "人声里有「小月相（元音）」一行（没调过的元音版不进预设那一排，从这里选）");
await p.click('.prov[data-p="Q7390|vowel"] [data-v="cast"]'); await p.waitForTimeout(400);
check(await finderOpen(), "选元音版 = 目录还开着");
const used = await p.$$eval(".finder-used [data-preset]", (cs) => cs.map((c) => ({ k: c.dataset.preset, t: c.querySelector(".fp-name")?.textContent ?? "", on: c.classList.contains("is-on") })));
check(used.length === 2 && used.some((u) => u.on && /元音/.test(u.t)), "目录顶上「这首歌的乐器预设」：调过的小月相 + 台上的元音版", JSON.stringify(used));
await p.click('.finder [data-v="back"]'); await p.waitForTimeout(300);
check((await names()).includes("Voice"), "元音版作为人声上场 = 谱上 Voice", await names());
await swap();
const full = used.find((u) => !/元音/.test(u.t));
await p.click(`.finder-used [data-preset="${full.k}"]`); await p.waitForTimeout(400);
check(await finderOpen(), "点预设那一格 = 目录还开着");
await p.click('.finder [data-v="back"]'); await p.waitForTimeout(300);
check((await names()).includes("Choir"), "点回完整版（记着上场时是合唱）= 谱上 Choir", await names());
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await names()).includes("Voice"), "撤销一步 = 名字和人一起退回", await names());
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
check(!(await p.$('[data-v^="cand:"]')) && !!(await p.$('.ip-who [data-v="finder"]')), "「配置…」= 乐器页；里面不再摆用过的候选（搬进目录了），只有一行台上是谁 +「换乐器…」");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ncast-back: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
