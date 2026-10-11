// test/e2e/sung-preview.mjs —— 真浏览器 E2E：「音」里按小键盘写音，月读预听唱的是刚写下的那个音（v0.10.30）。
// created 2026-10-10 by Claude Opus 5.5（user「然后音模式下面月读的preview没有了，小键盘没有声音」：以前按光标找字，写完光标已经在后面——歌尾 = 不出声）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/sung-preview.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => { const m = window.__moonsinger; window.__sung = []; m.singer.singOnly = async (score, o) => { window.__sung.push({ entry: o.entry, midi: o.midi, n: score.SCORE.length }); return { sr: 22050, samples: new Float32Array(2205) }; }; });
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(250); }
const sung = await p.evaluate(() => window.__sung);
check(sung.length >= 3, "按三下 = 唱了三下（歌尾也唱）", JSON.stringify(sung));
check(sung.length >= 3 && sung.slice(-3).map((x) => x.entry).join(",") === "0,1,2", "唱的是刚写下的那个音（第 1、2、3 个字）", JSON.stringify(sung.map((x) => x.entry)));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsung-preview: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
