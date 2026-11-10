// test/e2e/mono-later-wins.mjs —— 真浏览器 E2E：单声乐器写谱时两根手指几乎同时按下 = 后按的算数（v0.16.77）。
// created 2026-11-09 by Claude Opus 5.5（user 11-09 夜「可以」= 写谱时那条 50 毫秒护栏改成「后按的算数」，和「弹」里一样）。
// 守：小月相（单声）按住第 1 个键、马上按第 3 个键 = 谱上只多一个音、是第 3 个键的音；撤销一下 = 两下一起回去；隔开按（> 50 ms）= 照旧写两个。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/mono-later-wins.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(200);
const notes = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers.find((x) => x.id === s.at.paper).tracks[s.at.part].filter((t) => t.kind === "note").map((t) => t.pitch ? `${t.pitch.step}${t.pitch.alter}${t.pitch.octave}` : "-"); });
// 两根手指：pointerId 不同；gap = 两下之间隔几毫秒（页面里排，免得测试进程来回拖慢）
const press = (a, c, gap) => p.evaluate(async ([a, c, gap]) => {
  const ks = document.querySelectorAll(".pad-key[data-k]"), ev = (el, type, id) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, isPrimary: id === 11, pointerType: "touch" }));
  ev(ks[a], "pointerdown", 11); if (gap) await new Promise((r) => setTimeout(r, gap)); ev(ks[c], "pointerdown", 12);
  await new Promise((r) => setTimeout(r, 120)); ev(ks[a], "pointerup", 11); ev(ks[c], "pointerup", 12);
}, [a, c, gap]);
const n0 = (await notes()).length;
await press(0, 2, 0); await p.waitForTimeout(150);
const n1 = await notes();
check(n1.length === n0 + 1, "几乎同时按两个键：只多一个音", JSON.stringify(n1));
const n1Last = n1[n1.length - 1];
await press(2, 2, 0).catch(() => {}); await p.waitForTimeout(100);   // 单按第 3 个键当对照（同一根手指按两下：第二下同 id 不算第二根）
const ref = (await notes()).slice(-1)[0];
check(n1Last === ref, "写进去的是后按的那个键的音", `${n1Last} vs ${ref}`);
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(80);   // 撤掉对照那个
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(120);
check((await notes()).length === n0, "撤销一下 = 两下一起回去", JSON.stringify(await notes()));
await press(0, 2, 120); await p.waitForTimeout(150);
check((await notes()).length === n0 + 2, "隔开 120 ms 按（前一个还按着）= 照旧写两个", JSON.stringify(await notes()));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nmono-later-wins: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
