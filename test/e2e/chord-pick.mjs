// test/e2e/chord-pick.mjs —— 真浏览器 E2E：点和弦级数 → 挑另一个读法（v0.16.87）。
// created 2026-11-10 by Claude Opus 5.5。user 11-09「输入法候选」、11-10「一同意」；设计稿 ai-docs/20261110-wave2-four-designs.md 第四节。
// 守：候选每一行能点；点第二个 = 谱上换成它、颜色换成墨色（人挑的）；再点开 = 顶上「这是你挑的」+「改回自动」；改回自动 = 回到原来；撤销一步一步回去；听模式只看不挑。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/chord-pick.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// C E G A 叠在一起：自动 = I6，候选里有 Am7/C
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), paper = s.song.papers[0], t = paper.tracks[s.at.part], P = (step, octave) => ({ step, alter: 0, octave });
  const toks = [...t, { kind: "note", id: s.nextId, pitch: P("A", 4), dur: 960, lyric: null, chord: [P("G", 4), P("E", 4), P("C", 4)] }];
  m.set({ ...s, nextId: s.nextId + 1, song: { ...s.song, papers: [{ ...paper, tracks: { ...paper.tracks, [s.at.part]: toks } }, ...s.song.papers.slice(1)] } });
});
await p.waitForTimeout(300);
const tag = () => p.$$eval("#score text.chord-tag", (ts) => ts.map((t) => `${t.textContent}${t.classList.contains("is-pinned") ? "*" : ""}`).join(" "));
const harm = () => p.evaluate(() => { const s = window.__moonsinger.state(), n = s.song.papers[0].tracks[s.at.part].find((x) => x.kind === "note"); return n.harm ? `${n.harm.root.step}${n.harm.kind}${n.harm.bass ? "/" + n.harm.bass.step : ""}` : "-"; });
const openTag = async () => { const r = await p.evaluate(() => { const e = document.querySelector("#score text.chord-tag")?.getBoundingClientRect(); return e ? { x: e.left + e.width / 2, y: e.top + e.height / 2 } : null; }); await p.mouse.click(r.x, r.y); await p.waitForTimeout(250); };
const closeMenu = async () => { await p.keyboard.press("Escape"); await p.mouse.click(5, 300); await p.waitForTimeout(150); };
check((await tag()) === "I6", "自动 = I6", await tag());
await openTag();
const rows = await p.$$eval(".ctx-menu.chord-info button.chord-cand", (bs) => bs.map((x) => x.querySelector("span")?.textContent));
check(rows.length >= 2 && rows.includes("Am7/C"), "候选每一行是钮，里面有 Am7/C", rows.join(","));
const k = rows.indexOf("Am7/C");
await p.click(`.ctx-menu.chord-info [data-v="pick:${k}"]`); await p.waitForTimeout(300);
check((await tag()) === "vi7/1*" && (await harm()) === "Am7/C", "点 Am7/C = 谱上换成 vi7/1、墨色（人挑的），记进这个音", `${await tag()} ${await harm()}`);
check(!(await p.$(".ctx-menu.chord-info")), "挑完小表收起");
await openTag();
const headTxt = await p.$eval(".ctx-menu.chord-info .ctx-what", (e) => e.textContent);
check(/你挑的/.test(headTxt) && !!(await p.$('.ctx-menu.chord-info [data-v="auto"]')), "再点开：顶上写「这是你挑的」，有「改回自动」", headTxt);
await p.click('.ctx-menu.chord-info [data-v="auto"]'); await p.waitForTimeout(300);
check((await tag()) === "I6" && (await harm()) === "-", "改回自动 = 回到 I6、音上的和弦名去掉", `${await tag()} ${await harm()}`);
await closeMenu();
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await harm()) === "Am7/C", "撤销一步 = 回到挑过的", await harm());
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await harm()) === "-", "再撤销一步 = 没挑过", await harm());
// 听模式：只看不挑
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300);
await openTag();
check(!!(await p.$(".ctx-menu.chord-info")) && !(await p.$(".ctx-menu.chord-info button.chord-cand")), "听模式：小表照开，但行不是钮（只看）");
await closeMenu();
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nchord-pick: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
