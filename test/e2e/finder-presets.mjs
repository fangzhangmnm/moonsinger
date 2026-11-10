// test/e2e/finder-presets.mjs —— 真浏览器 E2E：乐器预设的规矩（v0.16.38；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §5 R1–R7、§8）。
// created 2026-11-09 by Claude Opus 5.5。守：换上 A（不调）再换 B = 预设一行里没有 A；A 调过再换 B = A 留着；另一个声部的目录里看得见 A「在 ⟨声部⟩ 上」，
//   点了 = 本声部台上是 A 的一份、原声部的 A 没动；撤销一步 = 回到换之前；长按 = 复制一份 / 删掉。用仓里 24 KB 的 sf2，不靠外网。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/finder-presets.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
import { fileURLToPath } from "node:url";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const SF2 = fileURLToPath(new URL("../fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(100);
const lounge = (k = 0) => p.evaluate((k) => { const m = window.__moonsinger, st = m.state(), role = st.song.parts[k].role, r = m.extras().lounge[role]; return r ? { active: r.candidates.find((c) => c.id === r.active)?.name, names: r.candidates.map((c) => c.name), cal: Object.fromEntries(r.candidates.map((c) => [c.name, c.calibrationDb])) } : null; }, k);
const tiles = () => p.$$eval(".finder-used [data-preset]", (ts) => ts.map((t) => `${t.querySelector(".fp-name")?.textContent}${t.classList.contains("is-on") ? "*" : ""}${t.querySelector(".fp-job") ? "@" + t.querySelector(".fp-job").textContent : ""}`));
const openFinder = async (k = 0) => { await p.click(`#score text.part-name >> nth=${k}`); await p.waitForTimeout(200); await p.click('.track-card [data-v="swap"]'); await p.waitForSelector(".finder-list .finder-group-h"); await p.waitForTimeout(250); };
const openFile = async () => { const [fc] = await Promise.all([p.waitForEvent("filechooser"), p.click(".finder-bar .finder-file")]); await fc.setFiles(SF2); await p.waitForSelector(".finder-own"); await p.waitForTimeout(150); };
const cast = async (key) => { await p.click(`.finder-own .prov[data-p="${key}"] [data-v="cast"]`); await p.waitForTimeout(450); };
const tune = (db) => p.evaluate((db) => { const m = window.__moonsinger, st = m.state(), role = st.song.parts.find((x) => x.id === st.at.part).role, ex = structuredClone(m.extras());
  ex.lounge[role].candidates.find((c) => c.id === ex.lounge[role].active).calibrationDb = db; m.commit({ extras: ex }, { locus: { kind: "lounge", label: "test" } }); }, db);

await openFinder();
check((await tiles()).join("|") === "小月相*", "新歌什么都没动：预设一排只有台上的小月相（没调过的元音版不列）", (await tiles()).join("|"));
await openFile();
await cast("sf2|0:80");   // A = Square Lead
check((await tiles()).join("|") === "Square Lead*", "换上 A：一排里是 A（小月相没调过 = 不列）", (await tiles()).join("|"));
await cast("sf2|8:115");  // B = Castanets，A 没调过
check((await tiles()).join("|") === "Castanets*", "A 没调过就换 B = A 不留", (await tiles()).join("|"));
check(!(await lounge()).names.includes("Square Lead"), "数据里也没有 A", JSON.stringify(await lounge()));
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(250);
check((await lounge()).active === "Square Lead" && (await lounge()).names.includes("Square Lead"), "撤销一步 = A 回来、台上是 A", JSON.stringify(await lounge()));
// A 调过再换 B = 留着
await tune(-3); await p.waitForTimeout(150);
await cast("sf2|8:115");
check((await tiles()).join("|") === "Square Lead|Castanets*", "A 调过再换 B = A 留在一排里", (await tiles()).join("|"));
// 点 A = 换上；B 没调过、下台 = 删
await p.click('.finder-used [data-preset="0"]'); await p.waitForTimeout(400);
check((await tiles()).join("|") === "Square Lead*", "点调过的 A = 换上；没调过的 B 下台 = 不留", (await tiles()).join("|"));
// 长按 / 右键 A = 复制一份
await p.click('.finder-used [data-preset="0"]', { button: "right" }); await p.waitForTimeout(150);
const menu = await p.$$eval(".finder-pinmenu .ctx-item", (bs) => bs.map((x) => x.textContent));
check(menu.join("|") === "复制一份", "台上那格的小菜单 = 复制一份（台上的不能删）", menu.join("|"));
await p.click('.finder-pinmenu [data-act="pcopy"]'); await p.waitForTimeout(400);
check((await tiles()).join("|") === "Square Lead|Square Lead 2*", "复制一份 = 名字加「 2」、复制出来的上台、原来那位留着", (await tiles()).join("|"));
await p.click('.finder-used [data-preset="0"]', { button: "right" }); await p.waitForTimeout(150);
check((await p.$$eval(".finder-pinmenu .ctx-item", (bs) => bs.map((x) => x.textContent))).join("|") === "复制一份|删掉", "不在台上的那格 = 复制一份 / 删掉");
await p.click('.finder-pinmenu [data-act="pdel"]'); await p.waitForTimeout(400);
check((await tiles()).join("|") === "Square Lead 2*", "删掉 = 那一位没了", (await tiles()).join("|"));
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
// 另一个声部：看得见「在 X 上」，点了 = 拷一份过来，原声部不动
await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(200); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(200);
await p.click(".parts-mgr [data-v^=addbelow]"); await p.waitForTimeout(150); await p.click(".parts-mgr [data-v=addnew]"); await p.waitForTimeout(400);
await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(400);   // 新声部先选小月相
const nParts = await p.evaluate(() => window.__moonsinger.state().song.parts.length);
check(nParts === 2, "第二个声部建好了", String(nParts));
const other = (await tiles()).find((t) => t.startsWith("Square Lead 2@"));
check(!!other, "第二个声部的目录里看得见第一个声部调过的那位（写着在哪个声部上）", (await tiles()).join("|"));
const before0 = JSON.stringify(await lounge(0));
const k = (await tiles()).findIndex((t) => t.startsWith("Square Lead 2@"));
await p.click(`.finder-used [data-preset="${k}"]`); await p.waitForTimeout(400);
check((await lounge(1))?.active === "Square Lead 2" && (await lounge(1)).cal["Square Lead 2"] === -3, "点了 = 本声部台上是它的一份（设置跟着来）", JSON.stringify(await lounge(1)));
check(JSON.stringify(await lounge(0)) === before0, "原声部的那位一个字节不动");
check((await tiles())[0]?.endsWith("*") && !(await tiles()).some((t) => t.startsWith("Square Lead 2@")), "拷来的就在本声部了，同一套设置不重复列", (await tiles()).join("|"));
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(250);
check((await lounge(1))?.active !== "Square Lead 2", "撤销一步 = 回到拷之前", JSON.stringify(await lounge(1)));
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
