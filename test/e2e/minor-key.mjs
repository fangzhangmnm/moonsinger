// test/e2e/minor-key.mjs —— 真浏览器 E2E：谱头面板里切大调 / 小调（v0.16.83）。
// created 2026-11-10 by Claude Opus 5.5。user 11-09「在选调号的时候强制一起选。不过关系大小调对齐…切换大小调会很方便」；设计稿 ai-docs/20261110-wave2-four-designs.md 第二节。
// 守：调号下拉框写一对（1=C · 6=A）；下面两格总有一格亮；点「a 小调」= 级数从 la 数（Am → i）、调号上方淡字「6=A」、音不动；一步撤销回来；换调号不换大小调。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/minor-key.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 谱里放两个叠音：Am（A3 C4 E4）、E（E3 G♯3 B3）
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), paper = s.song.papers[0], t = paper.tracks[s.at.part], P = (step, octave, alter = 0) => ({ step, alter, octave });
  const toks = [...t, { kind: "note", id: s.nextId, pitch: P("E", 4), dur: 480, lyric: null, chord: [P("C", 4), P("A", 3)] }, { kind: "note", id: s.nextId + 1, pitch: P("B", 3), dur: 480, lyric: null, chord: [P("G", 3, 1), P("E", 3)] }];
  m.set({ ...s, nextId: s.nextId + 2, song: { ...s.song, papers: [{ ...paper, tracks: { ...paper.tracks, [s.at.part]: toks } }, ...s.song.papers.slice(1)] } });
});
await p.waitForTimeout(300);
const tags = () => p.$$eval("#score text.chord-tag", (ts) => ts.map((t) => t.textContent).join(" "));
const key = () => p.evaluate(() => { const s = window.__moonsinger.state(), k = s.song.papers[0].tracks[s.at.part].find((x) => x.kind === "key"); return `${k.fifths}${k.mode === "minor" ? "m" : ""}`; });
const pitches = () => p.evaluate(() => { const s = window.__moonsinger.state(); return JSON.stringify(s.song.papers[0].tracks[s.at.part].filter((x) => x.kind === "note")); });
const hint = () => p.evaluate(() => [...document.querySelectorAll(".ov-key-hint")].map((e) => e.textContent).join(" "));
const seg = () => p.evaluate(() => [...document.querySelectorAll(".header-panel .hp-seg .btn")].map((e) => `${e.textContent}${e.classList.contains("is-on") ? "*" : ""}`).join(" | "));
check((await tags()) === "vi III", "C 大调：Am = vi、E = III", await tags());
const n0 = await pitches();
const keyBox = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), k = L.marks.find((x) => x.kind === "key" && x.system === 0); return { x: sc.left + L.pageX.left + k.x + k.w / 2, y: sc.top + k.y + k.h / 2 }; });
await p.mouse.click(keyBox.x, keyBox.y); await p.waitForTimeout(250);
const opt0 = await p.$eval('.header-panel [data-hp="key"]', (s) => s.options[s.selectedIndex].textContent).catch(() => null);
check(!!opt0 && opt0.startsWith("1=C · 6=A"), "调号下拉框写一对关系大小调", String(opt0));
check((await seg()) === "C 大调* | a 小调", "下面两格：C 大调亮着", await seg());
await p.click('.header-panel [data-v="minor"]'); await p.waitForTimeout(250);
check((await key()) === "0m", "点「a 小调」= 调号写着小调", await key());
check((await seg()) === "C 大调 | a 小调*", "面板不收，亮的换成 a 小调", await seg());
check((await tags()) === "i V", "级数从 la 数：Am = i、E = V", await tags());
check((await hint()).includes("6=A"), "调号上方淡字「6=A」", await hint());
check((await pitches()) === n0, "音一个没动");
await p.selectOption('.header-panel [data-hp="key"]', "1"); await p.waitForTimeout(200);
check((await key()) === "1m" && (await seg()) === "G 大调 | e 小调*", "换调号（一个升号）= 还是小调（e 小调）", `${await key()} ${await seg()}`);
await p.keyboard.press("Escape"); await p.mouse.click(5, 300); await p.waitForTimeout(150);
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
check((await key()) === "0m", "撤销一步 = 回到 a 小调", await key());
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
check((await key()) === "0" && (await tags()) === "vi III", "再撤销一步 = 回到 C 大调", `${await key()} ${await tags()}`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nminor-key: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
