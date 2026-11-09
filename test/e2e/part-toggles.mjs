// test/e2e/part-toggles.mjs —— 真浏览器 E2E：声部名下面的两颗大钮（眼睛 / 喇叭；v0.16.22，取代 v0.16.17 的四颗小钮）。
// created 2026-11-08 by Claude Opus 5.5（user 11-07「你说的第三类就是一个播放控制，这些东西反而应该是独立的按钮，不应该藏在里面」；
//   11-08「首先它们非常的小，没法按…至少要比那些小扳手、本段这些东西大」「按是静音，长按或者双击是独奏」→ AI 提「点 = 静音 / 隐藏，长按（电脑右键）= 独奏 / 只看」→「按你说的做」）。
// 守：每个声部两颗钮、比纸角的控件大；点喇叭 = 静音（录音房马上收到）、再点 = 出声；点眼睛 = 隐藏（不排、不占地方，曲段名那一条上冒出「隐藏 N」）、点「隐藏 N」挑它 = 放回来；
//   长按眼睛 = 只看它（别人隐藏）、从「隐藏 N」放出别人 = 它也加进「只看」；听模式里长按喇叭 = 独奏、右键 = 再切；图标跟着状态换；小卡里没有这几样；不开小卡。
//   刀 1（2026-11-08）：钮在谱面上面那一层（DOM .ov-tg，src/ui/score-overlay.ts）；隐藏的声部不再缩成细线（施工单 §4 第 5 条）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/part-toggles.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(30); }
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), paper = s.song.papers[0], t = paper.tracks[s.at.part];   // 第二个声部（同一张纸上）
  m.set({ ...s, song: { ...s.song, parts: [...s.song.parts, { id: "P9", role: "r9", mic: "m9" }], papers: [{ ...paper, tracks: { ...paper.tracks, P9: t.map((x) => ({ ...x })) } }, ...s.song.papers.slice(1)] } }); });
await p.waitForTimeout(300);
const tgBox = (part, kind) => p.evaluate(([part, kind]) => { const L = window.__moonsinger.layout(), b = document.querySelector(`#score .score-overlay .ov-tg[data-part="${part}"][data-kind="${kind}"]`), r = b?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2, w: parseFloat(b.style.width), sp: L.sp, tp: L.tp ?? L.sp, pw: r.width } : null; }, [part, kind]);
const pv = (part) => p.evaluate((part) => window.__moonsinger.desk().parts?.[part] ?? {}, part);
const shown = () => p.evaluate(() => [...new Set(window.__moonsinger.layout().systems.map((r) => r.part))].join(","));
const icons = () => p.evaluate(() => [...document.querySelectorAll("#score .score-overlay .ov-tg use")].map((u) => u.getAttribute("href") ?? "").join(","));
const tap = async (bx) => { await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(250); };
const hold = async (bx) => { await p.mouse.move(bx.x, bx.y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(250); };
const P1 = await p.evaluate(() => window.__moonsinger.state().song.parts[0].id);
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__ch = []; const ch = e.channel.bind(e); e.channel = (id, prm) => { window.__ch.push([id, !!prm.mute, !!prm.solo]); return ch(id, prm); }; });
const kinds = await p.evaluate(() => [...document.querySelectorAll("#score .score-overlay .ov-tg")].map((t) => `${t.dataset.part}:${t.dataset.kind}`).join(","));
check(kinds === `${P1}:hidden,${P1}:muted,P9:hidden,P9:muted`, "每个声部两颗钮：眼睛 + 喇叭", kinds);
{ const a = await tgBox(P1, "hidden"), b = await tgBox("P9", "hidden"); check(!!a && !!b && Math.abs(a.x - b.x) < 1, "各位的眼睛钮上下对齐（对整个名字栏的中线；user 11-09「眼睛应该对齐」）", `${a?.x} vs ${b?.x}`); }
{ const bx = await tgBox(P1, "muted"); check(bx.w / bx.sp >= 2.95, "钮不比纸角的控件（3 个谱线间距）小（v0.16.33 起 3.0，图标比纸角钮的大；刀 2 试：跟谱）", `${(bx.w / bx.sp).toFixed(2)}`); }
// 刀 2：紧凑档的两颗钮跟着谱一起缩（user 11-09「紧凑档里两颗钮跟着谱一起缩小三成。试一下」——跟字放大会和上一位两行的名字挤在一起）
{ const a = await tgBox(P1, "muted"), s0 = await p.evaluate(() => window.__moonsinger.state());
  await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, paper: { ...(s.song.paper ?? { kind: "A5", widthMm: 148, heightMm: 210, marginMm: { l: 16, r: 16, t: 16, b: 16 } }), density: "compact" } } }); }); await p.waitForTimeout(400);
  const b = await tgBox(P1, "muted");
  check(!!b && b.sp < a.sp * 0.9 && Math.abs(b.pw - a.pw * (b.sp / a.sp)) < 1, "紧凑档：谱变小了、两颗钮跟着谱一起小", JSON.stringify({ cozy: [a.sp, a.pw], compact: [b?.sp, b?.pw] }));
  await p.evaluate((st) => window.__moonsinger.set(st), s0); await p.waitForTimeout(300); }
let bx = await tgBox(P1, "muted"); await tap(bx);
check((await pv(P1)).muted && (await p.evaluate(() => window.__ch.some(([, m]) => m))) && /volume-mute/.test(await icons()), "点喇叭 = 静音、录音房马上收到、图标换成静音的喇叭");
check(!(await p.$(".track-card")), "点钮不开小卡");
bx = await tgBox(P1, "muted"); await tap(bx);
check(!(await pv(P1)).muted, "再点 = 出声");
// 眼睛：点 = 隐藏（缩成细线）；点细线 = 放回来
const s0 = await shown();
bx = await tgBox("P9", "hidden"); await tap(bx);
check(!(await shown()).includes("P9") && !!(await p.$("#score .score-overlay .ov-hidden")), "点眼睛 = 这位不排、不占地方（谱行没了），曲段那一条上冒出「隐藏 N」", `${s0} → ${await shown()}`);
check(!(await p.$("#score svg .part-stub")), "不再有细行");
const fromHidden = async (id) => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-hidden")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });   // 点「隐藏 N」→ 小菜单里点这位
  if (!c) return false; await tap(c); const it = await p.$(`.ctx-menu.hidden-list [data-v="${id}"]`); if (!it) return false; await it.click(); await p.waitForTimeout(250); return true; };
const ok1 = await fromHidden("P9");
check(ok1 && (await shown()).includes("P9") && !(await p.$(".track-card")), "「隐藏 N」里点它 = 放回来（不开小卡）", await shown());
// 长按眼睛 = 只看它；点别人的细线 = 它也加进「只看」
bx = await tgBox(P1, "hidden"); await hold(bx);
check((await pv(P1)).only && !(await shown()).includes("P9") && /visibility-only/.test(await icons()), "长按眼睛 = 只看它（别人隐藏、图标换成只看的眼睛）", await shown());
check(!(await p.$(".ctx-menu")), "长按钮不开空白处的小菜单");
const ok2 = await fromHidden("P9");
check(ok2 && (await shown()).includes("P9") && (await shown()).includes(P1), "「隐藏 N」里放出别人 = 它也加进「只看」", await shown());
// 听模式：长按喇叭 = 独奏；右键 = 再切回去
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300);
bx = await tgBox(P1, "muted"); await hold(bx);
check((await pv(P1)).solo && /volume-solo/.test(await icons()) && !(await p.$(".ctx-menu")), "听模式里长按喇叭 = 独奏（不开「从这儿放」那个菜单）");
await p.mouse.click(bx.x, bx.y, { button: "right" }); await p.waitForTimeout(250);
check(!(await pv(P1)).solo, "右键喇叭 = 独奏关掉（同长按）");
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(200);
await p.click(`#score text.part-name >> nth=0`); await p.waitForTimeout(250);
check(!!(await p.$(".track-card")) && !(await p.$('.track-card [data-v="mute"], .track-card [data-v="hide"]')), "小卡里没有隐藏 / 静音这些（在名字下面）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npart-toggles: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
