// test/e2e/start-dyn.mjs —— 真浏览器 E2E：空文档开头的力度不会变成两个（v0.10.41）。
// created 2026-10-11 by Claude Opus 5.5（user「为什么空文档打字的时候会有两个mf?」「删了一个还有一个」「然后一打字又duplicate了」）
// 复现路径：写一个音（自动补 mf）→ 退格撤回 → 点谱头（光标落在 mf 前面）→ 再写 = 以前「mf n mf」。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/start-dyn.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
const body = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].slice(3).map((x) => (x.kind === "dyn" ? x.value : x.kind[0])).join(" "); });
const tapStart = async () => { const r = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(); return { x: sh.left + L.pageX.left + 120, y: sh.top + 300 }; }); await p.mouse.click(r.x, r.y); await p.waitForTimeout(150); };
await p.evaluate(() => window.__moonsinger.setMode("notes"));
await tapStart(); await p.keyboard.press("Digit1"); await p.waitForTimeout(100);
check((await body()) === "mf n", "空纸写一个音 = 自动补一个 mf", await body());
await p.keyboard.press("Backspace"); await p.waitForTimeout(100);
check((await body()) === "mf", "退格撤回音，mf 留着", await body());
await tapStart(); check((await p.evaluate(() => window.__moonsinger.state().caret)) === 3, "点谱头 = 光标在 mf 前面");
await p.keyboard.press("Digit1"); await p.waitForTimeout(100);
check((await body()) === "mf n", "再写 = 写在 mf 后面、不再补第二个（以前「mf n mf」）", await body());
await tapStart(); await p.keyboard.press("Digit0"); await p.waitForTimeout(100);
check((await body()).startsWith("mf") && (await body()).split(" ").filter((x) => x === "mf").length === 1, "谱头再打休止：仍然只有一个 mf", await body());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`start-dyn: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
