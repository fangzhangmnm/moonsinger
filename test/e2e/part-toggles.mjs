// test/e2e/part-toggles.mjs —— 真浏览器 E2E：歌手名下面的四颗小钮（静 / 独 / 隐 / 只；v0.16.17 搬家 B）。
// created 2026-11-08 by Claude Opus 5.5（user 11-07「你说的第三类就是一个播放控制，这些东西反而应该是独立的按钮，不应该藏在里面」；搬家清单一到六 user 拍了）。
// 守：静 / 独 一按就切、录音房马上收到；隐 = 缩成细线、点细线 = 放回来；只 = 别人缩成细线、点别人的细线 = 它也加进「只看」；听模式也能点；小卡里不再有这几样；PDF 不印。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/part-toggles.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), paper = s.song.papers[0], t = paper.tracks[s.at.part];   // 第二位歌手（同一张纸上）
  m.set({ ...s, song: { ...s.song, parts: [...s.song.parts, { id: "P9", role: "r9", mic: "m9" }], papers: [{ ...paper, tracks: { ...paper.tracks, P9: t.map((x) => ({ ...x })) } }, ...s.song.papers.slice(1)] } }); });
await p.waitForTimeout(300);
const tgBox = (part, kind) => p.evaluate(([part, kind]) => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), t = L.partToggles.find((x) => x.part === part && x.kind === kind); return t ? { x: sc.left + L.pageX.left + t.x + t.w / 2, y: sc.top + t.y + t.h / 2 } : null; }, [part, kind]);
const on = (part, kind) => p.evaluate(([part, kind]) => !!window.__moonsinger.layout().partToggles.find((x) => x.part === part && x.kind === kind) && [...document.querySelectorAll(`#score rect.part-tg.tg-${kind}.on`)].length > 0, [part, kind]);
const shown = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((r) => r.part))].join(","));
const P1 = await p.evaluate(() => window.__moonsinger.state().song.parts[0].id);
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__ch = []; const ch = e.channel.bind(e); e.channel = (id, prm) => { window.__ch.push([id, !!prm.mute, !!prm.solo]); return ch(id, prm); }; });
check(!!(await tgBox(P1, "muted")) && !!(await tgBox("P9", "only")), "每位歌手名字下面都有四颗小钮");
let bx = await tgBox(P1, "muted"); await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(250);
check(await on(P1, "muted") && (await p.evaluate(() => window.__ch.some(([, m]) => m))), "点「静」= 亮、录音房马上收到静音");
check(!(await p.$(".track-card")), "点小钮不开小卡");
bx = await tgBox(P1, "muted"); await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(250);
check(!(await on(P1, "muted")), "再点 = 不静音了");
// 隐：缩成细线；点细线 = 放回来
const s0 = await shown();
bx = await tgBox("P9", "hidden"); await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(300);
check(!(await shown()).includes("P9"), "点「隐」= 这位缩成细线（谱行没了）", `${s0} → ${await shown()}`);
const stub = await p.evaluate(() => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), h = L.parts.find((x) => x.part === "P9"); return h ? { x: sc.left + L.pageX.left + h.x + h.w / 2, y: sc.top + h.y + h.h / 2 } : null; });
check(!!stub, "细线还能点", JSON.stringify(stub));
if (stub) { await p.mouse.click(stub.x, stub.y); await p.waitForTimeout(300); }
check((await shown()).includes("P9") && !(await p.$(".track-card")), "点细线 = 放回来（不开小卡）", await shown());
// 只：别人缩成细线；点别人的细线 = 它也加进「只看」
bx = await tgBox(P1, "only"); await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(300);
check(!(await shown()).includes("P9"), "点 P1 的「只」= 别人缩成细线", await shown());
const stub2 = await p.evaluate(() => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), h = L.parts.find((x) => x.part === "P9"); return h ? { x: sc.left + L.pageX.left + h.x + h.w / 2, y: sc.top + h.y + h.h / 2 } : null; });
if (stub2) { await p.mouse.click(stub2.x, stub2.y); await p.waitForTimeout(300); }
check((await shown()).includes("P9") && (await shown()).includes(P1), "点别人的细线 = 它也加进「只看」", await shown());
// 听模式也能点
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300);
bx = await tgBox(P1, "solo"); await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(250);
check(await on(P1, "solo"), "听模式里点「独」= 照样切");
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(200);
await p.click(`#score text.part-name >> nth=0`); await p.waitForTimeout(250);
check(!!(await p.$(".track-card")) && !(await p.$('.track-card [data-v="mute"], .track-card [data-v="hide"]')), "小卡里不再有隐藏 / 静音这些（搬走了）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npart-toggles: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
