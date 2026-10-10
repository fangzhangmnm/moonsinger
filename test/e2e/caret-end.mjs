// test/e2e/caret-end.mjs —— 真浏览器 E2E（鼠标、「音」模式）：光标在行界的两个画法取决于点在哪里。
//   点一行最后一个音 / 点它右边的空白 = 光标画在这一行末尾；点下一行开头 = 画在下一行开头；方向键走过去 / 写音 = 回到默认（下一行开头）。
// created 2026-10-10 by Claude Opus 5.5（user「然后我希望光标能同时支持一行的末尾和下一行的开头两个位置取决于点在哪里，你可以看一下我的wishlist」；
//   账本 wishlist「换行的时候光标又可以在行头又可以在行尾，取决于你怎么点的」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/caret-end.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`, S = "CDEFGAB";
let ms = "";
for (let k = 0; k < 24; k++) {
  let body = k ? "" : `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
  for (let j = 0; j < 4; j++) body += N(S[(k + j) % 7], 4 + ((k + j) % 2));
  ms += `<measure number="${k + 1}">${body}</measure>`;
}
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1">${ms}</part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("notes"); }, XML);
if (await p.$eval(".pad-panel", (e) => e.hidden)) { await p.click("#padTab"); await p.waitForTimeout(150); }   // 打开有音的歌 = 键盘先收着（v0.10.21）：这个测试要键盘
// 别家的谱每个小节线都读成人插的「|」；在 app 里写的歌小节线是自动画的（不进串）→ 去掉「|」，换行处的光标位置 = 上一行最后一个音后面 = 下一行第一个音前面
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), pid = s.song.papers[0].id;
  m.set({ ...s, caret: 3, sel: null, song: { ...s.song, papers: s.song.papers.map((q) => (q.id === pid ? { ...q, tracks: { ...q.tracks, [s.at.part]: q.tracks[s.at.part].filter((t) => t.kind !== "bar") } } : q)) } }); });
await p.waitForTimeout(300);
await p.evaluate(() => { document.querySelector("#score").scrollTop = 0; }); await p.waitForTimeout(150);
// 排版坐标 → 屏幕坐标（.sheet 的左上角 + 排版 px；桌面不缩放）
const geo = () => p.evaluate(() => {
  const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect();
  const rows = [...new Set(L.notes.map((n) => n.system))].sort((a, b) => a - b);
  const lastOf = (r) => L.notes.filter((n) => n.system === r).reduce((a, n) => (n.index > a.index ? n : a));
  const firstOf = (r) => L.notes.filter((n) => n.system === r).reduce((a, n) => (n.index < a.index ? n : a));
  const mid = (r) => { const s = L.systems[r]; return sc.top + (s.staffTop + (s.bottom - s.staffTop) * 0.25); };
  return { left: sc.left + L.pageX.left, top: sc.top, rows, row0: { last: lastOf(rows[0]), y: mid(rows[0]) }, row1: { first: firstOf(rows[1]), y: mid(rows[1]) },
    lastRow: { last: lastOf(rows[rows.length - 1]) }, endSlots: L.slots.filter((s) => s.end).length, right: L.pageX.right };
});
const state = () => p.evaluate(() => { const s = window.__moonsinger.state(), L = window.__moonsinger.layout(); return { caret: s.caret, sel: !!s.sel, head: L.head }; });
const g = await geo();
check(g.rows.length >= 3, "谱排成了好几行", String(g.rows.length));
check(g.endSlots >= 2, "每个换行处都有一个行末落点", String(g.endSlots));
const n0 = g.row0.last, n1 = g.row1.first;
check(n1.index === n0.index + 1, "下一行第一个音紧跟着上一行最后一个音（同一个光标位置）", `${n0.index} / ${n1.index}`);
// ① 点上一行最后一个音 = 光标在它后面、画在这一行末尾
await p.mouse.click(g.left + n0.x + n0.w / 2, g.top + n0.y); await p.waitForTimeout(150);
let s = await state();
check(s.caret === n0.index + 1 && !s.sel, "点一行最后一个音 = 光标到它后面", JSON.stringify({ caret: s.caret }));
check(s.head && s.head.system === n0.system && s.head.x > n0.x + n0.w, "…画在这一行末尾（不是下一行开头）", JSON.stringify(s.head));
// ② 方向键走一步再回来 = 回到默认（下一行开头）
await p.keyboard.press("ArrowRight"); await p.waitForTimeout(80); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(120);
s = await state();
check(s.caret === n0.index + 1 && s.head?.system === n1.system, "方向键走过去 = 画在下一行开头", JSON.stringify(s.head));
// ③ 先把光标挪走，再点上一行最后一个音右边的空白 = 光标在它后面（原来落在它前面）、画在行末
await p.mouse.click(g.left + n1.x + n1.w / 2 + 2, g.top + n1.y); await p.waitForTimeout(120);
const endX = await p.evaluate((sys) => window.__moonsinger.layout().slots.find((q) => q.end && q.system === sys)?.x ?? null, n0.system);
check(endX !== null && endX > n0.x + n0.w, "行末落点在最后一个音右边", `${endX} vs ${n0.x + n0.w}`);
await p.mouse.click(g.left + endX + 6, g.row0.y); await p.waitForTimeout(150);
s = await state();
check(s.caret === n0.index + 1, "点上一行行末的空白 = 光标在最后一个音后面（不再落到它前面）", JSON.stringify({ caret: s.caret, want: n0.index + 1 }));
check(s.head?.system === n0.system && Math.abs(s.head.x - endX) < 1.5, "…画在这一行末尾", JSON.stringify(s.head));
// ④ 点下一行开头（第一个音左边的空白）= 同一个光标位置，画在下一行开头
await p.mouse.click(g.left + n1.x - 6, g.row1.y); await p.waitForTimeout(150);
s = await state();
check(s.caret === n0.index + 1 && s.head?.system === n1.system, "点下一行开头 = 同一个位置、画在下一行开头", JSON.stringify({ caret: s.caret, head: s.head }));
// ⑤ 再点回行末，然后写一个音 = 光标挪了、回到默认（新写的音照常排）
await p.mouse.click(g.left + endX + 6, g.row0.y); await p.waitForTimeout(150);
check((await state()).head?.system === n0.system, "再点行末 = 又画回行末");
// 撤销 / 重画（别的东西变了、光标没挪）不改画法：切一下自动小节线开关以外最简单的 = 重新设一遍同一个状态
await p.evaluate(() => { const m = window.__moonsinger; m.set({ ...m.state() }); }); await p.waitForTimeout(100);
check((await state()).head?.system === n0.system, "光标没挪的重画 = 还在行末");
await p.keyboard.press("5"); await p.waitForTimeout(150);
s = await state();
const lenAfter = await p.evaluate(() => { const st = window.__moonsinger.state(); return st.song.papers[0].tracks[st.at.part].length; });
check(s.caret === n0.index + 2, "写了一个音 = 光标在新音后面", JSON.stringify({ caret: s.caret, len: lenAfter }));
// ⑥ 最后一行最后一个音后面没有下一行：点它照常（画在它后面这一行）
await p.keyboard.press("Control+z"); await p.waitForTimeout(150);
const lg = await geo(), nl = lg.lastRow.last;
await p.evaluate((y) => { const el = document.querySelector("#score"); el.scrollTop = Math.max(0, y - 200); }, nl.y); await p.waitForTimeout(150);
const lg2 = await geo();
await p.mouse.click(lg2.left + nl.x + nl.w / 2, lg2.top + nl.y); await p.waitForTimeout(150);
s = await state();
check(s.caret === nl.index + 1 && s.head?.system === nl.system, "最后一行最后一个音：光标在它后面、同一行", JSON.stringify({ caret: s.caret, head: s.head }));
check(!errs.length, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ncaret-end: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
