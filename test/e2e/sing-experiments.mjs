// test/e2e/sing-experiments.mjs —— 真浏览器 E2E：乐器页小月相的「高级」= 唱法核心的旋钮，存进候选（by value、走 undo）、进块的键（改了重唱）。
//   2026-10-15 user 拍板「齐平默认关…齐平和其他的也都放在高级设置里面可以持久化」「嗯你试一下连续也行」；2026-10-17 默认改回齐平 0.8 + 连续（user「…加上连续过渡然后用那个默认」「齐平还是默认开吧」）。v0.12.4 的「实验行（只在这次打开里有效）」退场。
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
check(!!o0 && o0.level === 0.8 && o0.levelContinuous === 1 && o0.cleanMax === 0.4 && o0.breath === 0 && o0.levelMaxDb === 6, "默认：给核心的 opt 带着默认表（齐平 0.8 + 连续）", JSON.stringify(o0));
// 乐器页 →「高级」折叠
await p.click("#score text.part-name"); await p.waitForTimeout(200); await p.click('.track-card [data-v="inst"]'); await p.waitForTimeout(300);
check(!!(await p.$(".inst-page details.ip-adv")) && !(await p.$eval(".inst-page details.ip-adv", (e) => e.open)), "乐器页有「高级」折叠，默认收着");
await p.click(".inst-page details.ip-adv > summary"); await p.waitForTimeout(150);
const txt = await p.$eval(".inst-page details.ip-adv", (e) => e.textContent ?? "");
check(/齐平/.test(txt) && /齐平过渡/.test(txt) && /齐平上限/.test(txt) && /借元音门槛/.test(txt) && /气息/.test(txt), "五行旋钮都在");
check(await p.$eval('.inst-page [data-v="core:level:0.8"]', (e) => e.classList.contains("is-on") && /默认/.test(e.textContent ?? "")), "齐平「0.8（默认）」亮着");
check(await p.$eval('.inst-page [data-v="core:levelContinuous:1"]', (e) => e.classList.contains("is-on") && /默认/.test(e.textContent ?? "")), "齐平过渡「连续（默认）」亮着");
// 切「每字重起」→ 存进候选 + 重唱带新旋钮；先滚到底（「高级」在最下面）——调一下页面不许弹回顶端（user 2026-10-17「我调歌手设置的时候每调一下页面都会弹回顶端」）
await p.evaluate(() => { window.__opts = []; });
const sc0 = await p.$eval(".inst-page .ip-body", (e) => { e.scrollTop = e.scrollHeight; return e.scrollTop; });
await p.$eval('.inst-page [data-v="core:levelContinuous:0"]', (e) => e.click()); await p.waitForTimeout(150);   // 直接点（测试工具的点法会先把挡着的钮滚出来，滚动位置在重画之前就变了）
const sc1 = await p.$eval(".inst-page .ip-body", (e) => e.scrollTop);
check(sc0 > 50 && Math.abs(sc1 - sc0) <= 2, "调一下 = 页面停在原地（不弹回顶端）", `${sc0} → ${sc1}`);
check(await p.$eval('.inst-page [data-v="core:levelContinuous:0"]', (e) => e.classList.contains("is-on")), "点了 = 那一格亮（重画后还开着折叠）");
check(await p.$eval(".inst-page details.ip-adv", (e) => e.open), "重画后「高级」还开着");
check(await p.evaluate(() => JSON.stringify(window.__moonsinger.extras()).includes('"levelContinuous":0')), "存进了休息室快照（by value）");
const o1 = await lastOpt();
check(!!o1 && o1.levelContinuous === 0 && o1.level === 0.8, "切了 = 带着新旋钮重唱（opt.levelContinuous = 0）", JSON.stringify(o1));
// 再关齐平：两个都在
await p.evaluate(() => { window.__opts = []; });
await p.click('.inst-page [data-v="core:level:0"]');
const o2 = await lastOpt();
check(!!o2 && o2.level === 0 && o2.levelContinuous === 0, "两个旋钮叠着", JSON.stringify(o2));
// 撤销两步 = 回默认
await p.evaluate(() => { window.__moonsinger.undo(); window.__moonsinger.undo(); }); await p.waitForTimeout(150);
check(!(await p.evaluate(() => JSON.stringify(window.__moonsinger.extras()).includes('"levelContinuous":0'))) && (await p.$eval('.inst-page [data-v="core:level:0.8"]', (e) => e.classList.contains("is-on"))), "撤销两步 = 回默认（走 undo）");
// 原始输出增益（16-4 B）：乐手身上的 instrument.outputGainDb；一步 0.5 dB、「默认」= 抄模板、走撤销
const og = () => p.evaluate(() => { const m = window.__moonsinger, x = m.extras(), r = x.lounge[m.state().song.parts[0].role]; return r.candidates.find((c) => c.id === r.active).instrument.outputGainDb; });
const ogRow = () => p.evaluate(() => [...document.querySelectorAll(".inst-page .ip-k")].find((e) => e.textContent === "原始输出增益")?.nextElementSibling?.textContent ?? "");
check((await og()) === 6.52 && /\+6\.52 dB/.test(await ogRow()) && !(await p.$('.inst-page [data-v="og:def"]')), "原始输出增益：新歌 = +6.52 dB（写在乐手身上），在默认上就不出「默认」钮", `${await og()} ${await ogRow()}`);
await p.$eval('.inst-page [data-v="og:0.5"]', (e) => e.click()); await p.waitForTimeout(150);
check((await og()) === 7.02 && /\+7\.02 dB/.test(await ogRow()) && !!(await p.$('.inst-page [data-v="og:def"]')), "+0.5 = 7.02、出「默认」钮", String(await og()));
await p.waitForTimeout(1800);   // 连着调同一行并成一步（gesture，1.5 s 内）：隔开再点「默认」，撤销才是单独的一步
await p.$eval('.inst-page [data-v="og:def"]', (e) => e.click()); await p.waitForTimeout(150);
check((await og()) === 6.52, "「默认」= 抄模板现在的值（6.52，照样写成数）", String(await og()));
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
check((await og()) === 7.02, "撤销回到 7.02", String(await og()));
// 乐手自己的效果链（16-4 H）：空的不显示；不空就只读列出来（关着的标出来）
const fxRow = () => p.evaluate(() => [...document.querySelectorAll(".inst-page .ip-k")].find((e) => e.textContent === "这位自己的效果")?.nextElementSibling?.textContent ?? null);
check((await fxRow()) === null, "乐手效果链空着 = 不显示这一行");
await p.evaluate(() => { const m = window.__moonsinger, x = structuredClone(m.extras()), r = x.lounge[m.state().song.parts[0].role]; r.candidates.find((c) => c.id === r.active).chain = [{ id: "pf0", kind: "reverb", on: false, params: {} }, { id: "pf1", kind: "eq", params: {} }]; m.commit({ extras: x }, { locus: { kind: "lounge", label: "t" } }); });
await p.waitForTimeout(200);
const fr = await fxRow();
check(!!fr && /混响（关着）/.test(fr) && /均衡/.test(fr) && !(await p.$$eval(".inst-page .ip-fx", (es) => es.some((e) => e.closest("button")))), "不空 = 列出来（关着的标出来），只读（没有钮）", String(fr));
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nsing-experiments: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
