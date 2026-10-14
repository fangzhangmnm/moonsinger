// test/e2e/sing-experiments.mjs —— 真浏览器 E2E：乐器页小月相的「高级」= 唱法核心的旋钮，存进候选（by value、走 undo）、进块的键（改了重唱）。
//   2026-10-15 user 拍板「齐平默认关…齐平和其他的也都放在高级设置里面可以持久化」「嗯你试一下连续也行」。v0.12.4 的「实验行（只在这次打开里有效）」退场。
//   只接线不听（AI 不听）。反证：把 timeline.ts 里 `...(info.singOpt ?? {})` 删掉 = 「切了 = 带着新旋钮重唱」那条红。
// created 2026-10-14 by Claude Fable 5.1；2026-10-15 改成持久化
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, a = st.song.papers[0]; let id = 7300;
  window.__opts = [];
  m.singer.sing = (_score, _onStage, o) => { window.__opts.push(o?.opt ?? null); return Promise.resolve({ samples: new Float32Array(22050), sr: 22050 }); };
  const n = (step, ly) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: ly });
  m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: [...a.tracks[pid].slice(0, 3), n("C", "か"), n("D", "な")] } }] } });
});
const lastOpt = async () => { for (let i = 0; i < 40; i++) { const o = await p.evaluate(() => window.__opts.at(-1) ?? null); if (o) return o; await p.waitForTimeout(100); } return null; };
const o0 = await lastOpt();
check(!!o0 && o0.level === 0 && o0.levelContinuous === 0 && o0.cleanMax === 0.4 && o0.breath === 0 && o0.levelMaxDb === 6, "默认：给核心的 opt 带着默认表（齐平关 level 0）", JSON.stringify(o0));
// 乐器页 →「高级」折叠
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
check(!!(await p.$(".inst-page details.ip-adv")) && !(await p.$eval(".inst-page details.ip-adv", (e) => e.open)), "乐器页有「高级」折叠，默认收着");
await p.click(".inst-page details.ip-adv > summary"); await p.waitForTimeout(150);
const txt = await p.$eval(".inst-page details.ip-adv", (e) => e.textContent ?? "");
check(/齐平/.test(txt) && /齐平过渡/.test(txt) && /齐平上限/.test(txt) && /借元音门槛/.test(txt) && /气息/.test(txt), "五行旋钮都在");
check(await p.$eval('.inst-page [data-v="core:level:0"]', (e) => e.classList.contains("is-on") && /默认/.test(e.textContent ?? "")), "齐平「关（默认）」亮着");
// 切「连续」→ 存进候选 + 重唱带新旋钮
await p.evaluate(() => { window.__opts = []; });
await p.click('.inst-page [data-v="core:levelContinuous:1"]'); await p.waitForTimeout(150);
check(await p.$eval('.inst-page [data-v="core:levelContinuous:1"]', (e) => e.classList.contains("is-on")), "点了 = 那一格亮（重画后还开着折叠）");
check(await p.$eval(".inst-page details.ip-adv", (e) => e.open), "重画后「高级」还开着");
check(await p.evaluate(() => JSON.stringify(window.__moonsinger.extras()).includes('"levelContinuous":1')), "存进了休息室快照（by value）");
const o1 = await lastOpt();
check(!!o1 && o1.levelContinuous === 1 && o1.level === 0, "切了 = 带着新旋钮重唱（opt.levelContinuous = 1）", JSON.stringify(o1));
// 再开齐平 0.8：两个都在
await p.evaluate(() => { window.__opts = []; });
await p.click('.inst-page [data-v="core:level:0.8"]');
const o2 = await lastOpt();
check(!!o2 && o2.level === 0.8 && o2.levelContinuous === 1, "两个旋钮叠着", JSON.stringify(o2));
// 撤销两步 = 回默认
await p.evaluate(() => { window.__moonsinger.undo(); window.__moonsinger.undo(); }); await p.waitForTimeout(150);
check(!(await p.evaluate(() => JSON.stringify(window.__moonsinger.extras()).includes('"levelContinuous":1'))) && (await p.$eval('.inst-page [data-v="core:level:0"]', (e) => e.classList.contains("is-on"))), "撤销两步 = 回默认（走 undo）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsing-experiments: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
