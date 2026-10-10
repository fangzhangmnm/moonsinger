// test/e2e/dyn-levels.mjs —— 真浏览器 E2E：ppp / fff（v0.9.23）+ 乐器页「力度」那一行的换算表。
// created 2026-10-10 by Claude Opus 5.5（user「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」「揭露表的位置建议是乐器页「力度」那一行 同意」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/dyn-levels.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const dyns = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "dyn").map((t) => t.value).join(","); });
// pad 符号层「力度」页：ppp…fff 八格在前两排
await p.evaluate(() => window.__moonsinger.setMode("symbols")); await p.waitForTimeout(150);
await p.click('.pad-head [data-sympage="dyn"]'); await p.waitForTimeout(100);
const cells = await p.$$eval(".pad-grid.symbols [data-sym]", (es) => es.map((e) => e.dataset.sym).filter((x) => x.startsWith("dyn:") && x !== "dyn:ramp").slice(0, 8).join(" "));
check(cells.replace(/:on/g, "") === "dyn:ppp dyn:pp dyn:p dyn:mp dyn:mf dyn:f dyn:ff dyn:fff", "力度页：ppp…fff 八格", cells);
await p.click('.pad-grid.symbols [data-sym^="dyn:fff"]'); await p.waitForTimeout(150);
check((await dyns()) === "fff", "点 fff = 光标前那个音起 fff", await dyns());
check((await p.$$eval("#score text", (ts) => ts.some((t) => t.textContent === "\u{E530}"))), "谱上画了 fff 的字形");
// MusicXML 原生往返
const xml = await p.evaluate(() => { const m = window.__moonsinger, id = m.state().song.papers[0].id; return m.zipText(m.bytes(), `.moonsinger/papers/${id}.musicxml`); });
check(xml.includes("<dynamics><fff/></dynamics>"), "MusicXML 写成原生的 <fff/>");
// 乐器页「力度」那一行（月读 = 音量 dB 那张表，八列）
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(100);
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
const tab = await p.evaluate(() => { const t = document.querySelector(".dyn-tab"); if (!t) return null; const rows = [...t.querySelectorAll("tr")].map((r) => [...r.children].map((c) => c.textContent.trim())); return rows; });
check(!!tab && tab[0].length === 9, "乐器页有力度换算表（ppp…fff 八列）", JSON.stringify(tab));
check(!!tab && tab[1][0] === "音量 dB" && tab[1][1] === "−24" && tab[1][8] === "+18", "月读：音量 dB（ppp −24 … fff +18，一档 6 dB）", JSON.stringify(tab?.[1]));
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ndyn-levels: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
