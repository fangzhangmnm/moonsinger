// test/e2e/metronome.mjs —— 真浏览器 E2E：速度框的小节拍器是一个自激的摆（W-12），换速度不重新起摆、摆杆不跳、追上新速度。
// created 2026-10-10 by Claude Opus 5.5（user 2026-10-07「调速度的时候那个小节拍器的动画应该有物理动画…受迫物理模型让小节拍器跟上你的乱调」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/metronome.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
// 空白处右键 → 速度…
const box = await p.$eval("#score .sheet", (e) => { const r = e.getBoundingClientRect(); return { x: r.right - 60, y: r.top + 160 }; });
await p.mouse.click(box.x, box.y, { button: "right" }); await p.waitForTimeout(150);
await p.click('.ctx-menu [data-v="mark:tempo"]'); await p.waitForTimeout(300);
check(await p.$eval(".metro", (e) => !e.hidden).catch(() => false), "速度框里有节拍器");
/** 在页面里每帧记摆杆角度 ms 毫秒；at 毫秒时（可选）把速度框改成 bpm。 */
const sample = (ms, change) => p.evaluate(({ ms, change }) => new Promise((done) => {
  const arm = document.querySelector(".metro-arm"), out = [], t0 = performance.now();
  const ang = () => { const m = /rotate\((-?[\d.]+)deg\)/.exec(arm.style.transform); return m ? Number(m[1]) : NaN; };
  let changed = false;
  const tick = (now) => {
    out.push({ t: (now - t0) / 1000, a: ang() });
    if (change && !changed && now - t0 >= change.at) { changed = true; const inp = document.querySelector(".mark-ed input, .mark-editor input") ?? document.querySelector(".metro").closest("div").parentElement.querySelector("input"); inp.value = String(change.bpm); inp.dispatchEvent(new Event("input", { bubbles: true })); }
    if (now - t0 < ms) requestAnimationFrame(tick); else done(out);
  };
  requestAnimationFrame(tick);
}), { ms, change });
const period = (xs) => { const ups = []; for (let i = 1; i < xs.length; i++) if (xs[i - 1].a < 0 && xs[i].a >= 0) ups.push(xs[i - 1].t + (xs[i].t - xs[i - 1].t) * (-xs[i - 1].a / (xs[i].a - xs[i - 1].a))); return ups.length > 1 ? (ups[ups.length - 1] - ups[0]) / (ups.length - 1) : NaN; };
let s = await sample(4500);   // 看后 3.5 秒（至少两个来回）
const bpm0 = Number(await p.$eval(".metro", (e) => e.closest("div").parentElement.querySelector("input")?.value ?? "90"));
const tail0 = s.filter((x) => x.t > 1.0);
check(Math.abs(period(tail0) - 120 / bpm0) < 0.05, `稳定时整个来回 = 两拍（♩=${bpm0} → ${(120 / bpm0).toFixed(3)} s）`, period(tail0).toFixed(3));
check(Math.abs(Math.max(...tail0.map((x) => Math.abs(x.a))) - 32) < 3, "摆幅 ≈ ±32°", Math.max(...tail0.map((x) => Math.abs(x.a))).toFixed(1));
s = await sample(3500, { at: 400, bpm: 160 });
const steps = s.map((x, i) => (i ? Math.abs(x.a - s[i - 1].a) : 0)), around = steps.slice(Math.max(1, s.findIndex((x) => x.t >= 0.4) - 2), s.findIndex((x) => x.t >= 0.4) + 6);
check(Math.max(...around) < 15, "换速度那几帧摆杆不跳（不重新起摆）", around.map((x) => x.toFixed(1)).join(" "));
const tail1 = s.filter((x) => x.t > 1.8);
check(Math.abs(period(tail1) - 0.75) < 0.04, "追上 ♩=160：整个来回 0.75 s", period(tail1).toFixed(3));
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmetronome: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
