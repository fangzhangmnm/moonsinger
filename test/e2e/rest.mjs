// test/e2e/rest.mjs —— 真浏览器 E2E：休止和音一样能点、能选（长按 / 框选 / 把手）、能横拖改时值、能删；竖拖不改（没有音高）。鼠标 + 手指。
// created 2026-10-08 by Claude Opus 5.5（user「为什么休止符没法选择，休止符就这么没有人权吗，我感觉编辑的心智模型里面休止符也应该和普通音符没区别」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/rest.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const R = `<note><rest/><duration>1</duration><type>quarter</type></note>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("C", 5)}${R}${N("E", 5)}${N("F", 5)}</measure></part></score-partwise>`;
const b = await chromium.launch();
for (const touch of [false, true]) {
  const ctx = await b.newContext(touch ? { viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 800 } });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const cdp = touch ? await ctx.newCDPSession(p) : null;
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
  await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
  await p.waitForTimeout(300);
  const tag = touch ? "手指" : "鼠标";
  const restIdx = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].findIndex((t) => t.kind === "rest"); });
  const rest = async () => p.$eval("#score text.rest", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const st = () => p.evaluate(() => { const s = window.__moonsinger.state(); return { caret: s.caret, sel: s.sel, toks: s.song.papers[0].tracks[s.at.part].slice(3).map((t) => (t.kind === "rest" ? `r${t.dur}` : t.kind[0])).join(" ") }; });
  const hold = async (x, y, ms) => { if (touch) { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] }); await p.waitForTimeout(ms); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); } else { await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); } await p.waitForTimeout(200); };
  let r = await rest();
  await hold(r.x, r.y, 40);
  check((await st()).caret === restIdx + 1 && !(await st()).sel, `${tag}：轻点休止 = 光标到它后面`, JSON.stringify(await st()));
  await hold(r.x, r.y, 650);
  const s1 = await st();
  check(!!s1.sel && s1.sel.from === restIdx && s1.sel.to === restIdx + 1, `${tag}：长按休止 = 选中它`, JSON.stringify(s1.sel));
  check(await p.$$eval("#score text.rest.sel", (e) => e.length) === 1, `${tag}：选中的休止是蓝的`);
  check(await p.$$eval(".sel-handle:not([hidden])", (e) => e.length) === 2, `${tag}：选区两头有把手`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  if (!touch) {
    // 横拖改时值；竖拖不改音高
    r = await rest();
    const before = (await st()).toks;
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x, r.y - 60, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    check((await st()).toks === before, "鼠标：竖着拖休止 = 什么都不变（没有音高）", (await st()).toks);
    r = await rest();
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x + 50, r.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    check((await st()).toks !== before && /r\d+/.test((await st()).toks), "鼠标：横着拖休止 = 改时值", `${before} → ${(await st()).toks}`);
    await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
    // 框选从第一个音框到休止
    const heads = await p.$$eval("#score text.note", (es) => es.map((e) => { const q = e.getBoundingClientRect(); return { x: q.x, y: q.y }; }));
    r = await rest();
    await p.mouse.move(heads[0].x - 10, heads[0].y - 30); await p.mouse.down(); await p.mouse.move(r.x + 12, r.y + 40, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    const s2 = await st();
    check(!!s2.sel && s2.sel.to === restIdx + 1, "鼠标：框选框得住休止", JSON.stringify(s2.sel));
    // 选中休止删掉（先收掉框选：长按已经选中的 = 开选区菜单，是设计）
    await p.keyboard.press("Escape"); await p.evaluate(() => document.querySelector(".ctx-menu")?.remove()); await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, sel: null }); }); await p.waitForTimeout(150);
    r = await rest();
    await hold(r.x, r.y, 650);
    await p.keyboard.press("Backspace"); await p.waitForTimeout(150);
    check(!(await st()).toks.includes("r"), "选中休止按退格 = 删掉", (await st()).toks);
  }
  check(errs.length === 0, `${tag}：没有页面错误`, errs.join(" | "));
  await ctx.close();
}
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
