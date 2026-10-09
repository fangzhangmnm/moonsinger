// test/e2e/scroll.mjs —— 真浏览器 E2E（iPad 竖屏、手指）：歌词框开着时手指滚谱 = 框不收、焦点不走（系统键盘不收回、视图不被拽回去）；
//   谱下面留一整屏空白；跟随光标不贴底（下面留大约一行）；光标在行末的音后面画在这一行末尾。
// created 2026-10-08 by Claude Opus 5.5（user「每次打日文还是跟八年抗战一样，有一个滚动的bug就是歌词输入模式滚动会导致键盘弹回来，然后白滚。
//   然后另外做一个护栏：滚动的时候页面下面还是留一整页白」「然后打字的自动对齐也不要靠着最下面，而是倒数第二排之类的，打音符也是」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/scroll.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`, S = "CDEFGAB";
let ms = ""; for (let k = 0; k < 40; k++) { let body = k ? "" : `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`; for (let j = 0; j < 4; j++) body += N(S[(k + j) % 7], 4); ms += `<measure number="${k + 1}">${body}</measure>`; }
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1">${ms}</part></score-partwise>`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 744, height: 1133 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const cdp = await ctx.newCDPSession(p);
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(300);
await p.evaluate(() => { document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(200);
// 点第 3 个音下面（歌词那一行）开歌词框
const n3 = await p.$$eval("#score text.note", (ts) => { const r = ts[2].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y }; });
const ly = await p.evaluate(() => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(); return sc.top + L.lyricY(0) * 1; });
await p.touchscreen.tap(n3.x, ly - 4); await p.waitForTimeout(300);
const open0 = await p.$eval(".lyric-input", (e) => !e.hidden && document.activeElement === e);
check(open0, "点歌词那一行 = 歌词框开着、有焦点");
await p.keyboard.type("あ"); await p.waitForTimeout(200);
const top0 = await p.$eval("#score", (e) => e.scrollTop);
// 手指往上推（滚动谱）
const sx = 400, sy = 700;
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: sx, y: sy, id: 1 }] });
for (let k = 1; k <= 10; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: sx, y: sy - k * 40, id: 1 }] }); await p.waitForTimeout(16); }
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(400);
const top1 = await p.$eval("#score", (e) => e.scrollTop);
check(top1 > top0 + 200, "滚动生效", `${top0} → ${top1}`);
await p.waitForTimeout(500);
const top2 = await p.$eval("#score", (e) => e.scrollTop);
check(Math.abs(top2 - top1) < 2, "滚了不被拽回去（不白滚）", `${top1} → ${top2}`);
check(await p.$eval(".lyric-input", (e) => !e.hidden && document.activeElement === e), "滚的时候歌词框还开着、焦点还在（键盘不收）");
// 轻点谱面空白 = 收框（原有规矩）
await p.touchscreen.tap(700, 400); await p.waitForTimeout(300);
check(await p.$eval(".lyric-input", (e) => e.hidden), "轻点谱面 = 收起歌词框");
// 一整页白：能滚到内容下面一整屏
const g = await p.$eval("#score", (e) => ({ sh: e.scrollHeight, ch: e.clientHeight, sheet: e.querySelector(".sheet").getBoundingClientRect().height }));
check(g.sh >= g.sheet + g.ch - 2, "下面留一整页白", JSON.stringify(g));
// 跟随光标不贴着最下面：光标一路往右挪（写音模式的 →），每次看光标那一行下面留没留出大约一行
await p.evaluate(() => { document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(200);
let worst = Infinity, moved = 0;
for (let k = 0; k < 90; k++) {
  await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: Math.min(s.caret + 1, s.song.papers[0].tracks[s.at.part].length) }); });
  const g2 = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), el = document.querySelector("#score"), sh = el.querySelector(".sheet"); if (!L.head) return null;
    const row = L.systems[L.head.system], z = 1, top = sh.offsetTop + row.top * z, bot = sh.offsetTop + row.bottom * z; return { gap: el.scrollTop + el.clientHeight - bot, rowH: bot - top, h: el.clientHeight, st: el.scrollTop }; });
  if (!g2) continue;
  if (g2.st > 0) { moved++; worst = Math.min(worst, g2.gap - Math.min(g2.rowH, g2.h * 0.3)); }
}
check(moved > 0, "光标往下走，视图跟着滚了", String(moved));
check(worst > -2, "跟着滚的时候光标那一行下面留着大约一行（不贴底）", `最差差了 ${worst.toFixed(1)} px`);
// 光标在一行最后一个音后面（后面还有下一行）= 画在这一行末尾，不在下一行开头（user 2026-10-08「然后到行末的时候光标应该在行末而不是下一行开头？」）
const ends = await p.evaluate(() => { const L = window.__moonsinger.layout(); const bySys = new Map(); for (const n of L.notes) { const c = bySys.get(n.system); if (!c || n.index > c.index) bySys.set(n.system, n); } return [...bySys.values()].slice(0, -1).slice(0, 4).map((n) => ({ index: n.index, system: n.system, x: n.x })); });
let lineEndOk = 0;
for (const e of ends) {
  await p.evaluate((i) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: i + 1, sel: null }); }, e.index); await p.waitForTimeout(60);
  const h = await p.evaluate(() => window.__moonsinger.layout().head);
  if (h && h.system === e.system && h.x > e.x) lineEndOk++;
}
check(ends.length >= 2 && lineEndOk === ends.length, "光标在行末的音后面 = 画在这一行末尾", `${lineEndOk}/${ends.length}`);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
