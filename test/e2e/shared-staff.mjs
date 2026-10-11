// test/e2e/shared-staff.mjs —— 真浏览器 E2E：合租（v0.10.24）：歌手牌里挂到别人上 = 画在主人那一行、名字跟在主人下面；点房客的名字 = 拆开来写。
// created 2026-10-10 by Claude Opus 5.5（user「合租还是有主人吧，这样钢琴小花可以挂钢琴上」「…主要就是总览监视用。所以撞一起就撞」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/shared-staff.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const N = (s, o, d = 2, t = "quarter") => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>${d}</duration><type>${t}</type></note>`;
const part = (id, notes) => `<part id="${id}"><measure number="1"><attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${notes}</measure></part>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part><score-part id="P2"><part-name>Flute</part-name></score-part><score-part id="P3"><part-name>Violin</part-name></score-part></part-list>` +
  part("P1", N("C", 5) + N("E", 5) + N("G", 5) + N("C", 6)) + part("P2", N("E", 4) + N("G", 4) + N("A", 4) + N("B", 4)) + part("P3", N("A", 4, 4, "half") + N("F", 4, 4, "half")) + `</score-partwise>`;
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(300);
const rowsOf = (id) => p.evaluate((id) => window.__moonsinger.layout().systems.filter((r) => r.part === id).length, id);
const focus = () => p.evaluate(() => window.__moonsinger.state().at.part);
// 先把光标放到 Violin（别让 Flute 是现在在写的那位——在写的那位拆开）
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, part: "P3" } }); }); await p.waitForTimeout(150);
await p.click("#score text.part-name >> text=Flute", { button: "right" }); await p.waitForTimeout(200);
check(!!(await p.$(".track-card select[data-hostsel]")), "Flute 的歌手牌里有「合租」");
await p.selectOption(".track-card select[data-hostsel]", "P1"); await p.waitForTimeout(250);
await p.keyboard.press("Escape"); await p.mouse.click(1380, 840); await p.waitForTimeout(150);
// 一家里有谁在写 = 整家拆开（user「host也应该只读，只有展开时才能编辑」）：去 Violin 那儿写 = Piano + Flute 叠成一行
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, part: "P3" } }); }); await p.waitForTimeout(200);
const parts = await p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => `${x.id}${x.host ? "<" + x.host : ""}`).join(","));
check(parts === "P1,P2<P1,P3", "挂到 Piano 上 = 存成 host、排在 Piano 后面", parts);
check((await rowsOf("P2")) === 0 && (await rowsOf("P1")) > 0, "Flute 没有自己的谱行了（画在 Piano 那一行上）");
const names = await p.$$eval("#score text.part-name", (es) => es.map((e) => e.textContent).join("|"));
check(names.includes("Piano") && names.includes("Flute") && names.includes("Violin"), "名字：Piano 下面跟着 Flute", names);
// 叠起来的那一行只读：点在上面 = 不放光标、不写（说一声点名字）
{ const pt = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), z = sh.width / L.width, r = L.systems[L.sharedRows[0]];
    return { x: sh.left + (L.pageX.left + 300) * z, y: sh.top + (r.staffTop + 20) * z }; });
  const before = await p.evaluate(() => JSON.stringify(window.__moonsinger.state().at));
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250);
  const after = await p.evaluate(() => JSON.stringify(window.__moonsinger.state().at));
  check(JSON.parse(after).part === "P1" && (await rowsOf("P2")) > 0, "「音」里点叠起来的那一行 = 展开这一家、光标去 Piano（v0.10.32，user「音输入模式下应该点开合租的五线谱能展开」）", `${before} → ${after}`);
  await p.evaluate(() => { const m = window.__moonsinger, st = m.state(); m.set({ ...st, at: { ...st.at, part: "P3" } }); }); await p.waitForTimeout(200);
  check((await rowsOf("P2")) === 0, "光标去 Violin = 又叠回去"); }
await p.click("#score text.part-name >> text=Flute"); await p.waitForTimeout(250);
check((await focus()) === "P2" && (await rowsOf("P2")) > 0, "点 Flute 的名字 = 去写它、整家拆开（有自己的谱行）", await focus());
// 听模式 = 每一家都叠起来（不看光标在哪；v0.10.29，user「每一家点开收拢的ux怎么算」→「12 同意」）；回到写的模式 = 光标在哪家哪家展开
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(250);
check((await focus()) === "P2" && (await rowsOf("P2")) === 0, "听模式：光标还在 Flute，也叠起来", String(await rowsOf("P2")));
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(250);
check((await rowsOf("P2")) > 0, "回到「音」：光标在的那一家又拆开");
// 展开着的那一家左边一条括号；点它 = 光标挪到这一家后面紧挨着的那位（Violin）→ 叠回去（v0.10.29）
{ const pt = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(), z = sh.width / L.width, f = L.families[0]; return f ? { x: sh.left + (L.pageX.left + f.x + f.w / 2) * z, y: sh.top + (f.y + f.h / 2) * z } : null; });
  check(!!pt && !!(await p.$("#score path.family-bracket")), "展开着的一家左边有括号");
  if (pt) { await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); }
  check((await focus()) === "P3" && (await rowsOf("P2")) === 0 && !(await p.$("#score path.family-bracket")), "点括号 = 光标去 Violin、这一家叠回去", await focus()); }
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nshared-staff: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
