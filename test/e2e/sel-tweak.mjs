// test/e2e/sel-tweak.mjs —— 真浏览器 E2E：选区条第二排 = 微调（v0.10.1；user「选区多微调同意」= 设计稿 ai-docs/20261010-note-tweak-design.md 方案 A）。
//   ↑↓ 一级、♯♭ 半音、↑8 ↓8 八度、÷2 ×2、附点；点了不收、选区留着、可以连着点；每一下一步撤销。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/sel-tweak.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const notes = () => p.evaluate(() => { const s = window.__moonsinger.state(), m = (q) => ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[q.step] + q.alter + 12 * (q.octave + 1); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").map((t) => `${m(t.pitch)}/${t.dur}`).join(" "); });
const sel = () => p.evaluate(() => JSON.stringify(window.__moonsinger.state().sel));
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), toks = s.song.papers[0].tracks[s.at.part], a = toks.findIndex((t) => t.kind === "note"); m.set({ ...s, sel: { from: a, to: toks.length }, caret: toks.length }); });
await p.waitForTimeout(200);
const s0 = await notes(), sel0 = await sel();
check(!!(await p.$('.sel-bar .sel-tweak [data-v="up"]')), "选中时选区条多一排微调");
const tap = async (v) => { await p.click(`.sel-bar [data-v="${v}"]`); await p.waitForTimeout(120); };
const shift = (s, f) => s.split(" ").map((x) => { const [m, d] = x.split("/").map(Number); return f(m, d); }).join(" ");
await tap("sharp");
check((await notes()) === shift(s0, (m, d) => `${m + 1}/${d}`), "♯ = 都升半音", await notes());
check((await sel()) === sel0 && (await p.$(".sel-bar .sel-tweak")) !== null, "点了不收、选区留着");
await tap("flat"); await tap("octUp");
check((await notes()) === shift(s0, (m, d) => `${m + 12}/${d}`), "♭ 再 ↑8 = 高八度", await notes());
await tap("octDown"); await tap("up");
check((await notes()) !== s0 && (await notes()).split(" ").every((x, k) => Number(x.split("/")[0]) > Number(s0.split(" ")[k].split("/")[0])), "↑ = 都往上一级", await notes());
await tap("down");
check((await notes()) === s0, "↓ = 回来", await notes());
await tap("half");
check((await notes()) === shift(s0, (m, d) => `${m}/${d / 2}`), "÷2 = 时值减半", await notes());
await tap("double"); await tap("dot");
check((await notes()) === shift(s0, (m, d) => `${m}/${d * 1.5}`), "×2 再加附点", await notes());
await tap("dot");
check((await notes()) === s0, "再点附点 = 去掉", await notes());
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
check((await notes()) === shift(s0, (m, d) => `${m}/${d * 1.5}`), "撤销 = 一步一步回去（回到带附点）", await notes());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsel-tweak: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
