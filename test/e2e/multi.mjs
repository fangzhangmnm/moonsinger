// test/e2e/multi.mjs —— 真浏览器 E2E：选了好几行（设计稿 ai-docs/20261113-selection-rules-design.md 第六节，v0.17.49）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）
// 守：鼠标从空白拉框跨两位歌手 = 两行各一个框（只看起点）；上下移 = 两行一起移；音键 = 说一句、谱不变；复制 = 系统剪贴板一行一份；
//     在别处贴 = 两行一起贴、一样长不推后面、贴完选中贴上去的那块、一步撤销；往下行数不够 = 整块不贴、说为什么；
//     再来一遍（Ctrl / ⌘+D）= 贴到自己后面、选区跟过去；退格 = 每行变一样长的休止、不合拢。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/multi.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const R = `<note><rest/><duration>1</duration><type>quarter</type></note>`;
const ATTR = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const part = (id, o) => `<part id="${id}"><measure number="1">${ATTR}${N("C", o)}${N("D", o)}${N("E", o)}${N("F", o)}</measure><measure number="2">${R}${R}${R}${R}</measure></part>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Up</part-name></score-part><score-part id="P2"><part-name>Down</part-name></score-part></part-list>${part("P1", 5)}${part("P2", 4)}</score-partwise>`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML); await p.waitForTimeout(300);
const clearNotes = () => p.evaluate(() => document.querySelector(".notice-stack")?.replaceChildren());
const said = () => p.$$eval(".notice-stack .notice", (es) => es.map((e) => e.textContent).join(" | "));
await clearNotes();
// 每一行的音 / 休止：「C5 D5 … r r」（midi 号 / r + 长度），按谱上的顺序两行
const rows = () => p.evaluate(() => { const s = window.__moonsinger.state(), pp = s.song.papers[0]; return s.song.parts.map((pt) => (pp.tracks[pt.id] ?? []).filter((t) => t.kind === "note" || t.kind === "rest").map((t) => (t.kind === "rest" ? `r${t.dur}` : `${t.pitch.midi ?? t.pitch.step + t.pitch.octave}`)).join(" ")); });
const multi = () => p.evaluate(() => { const m = window.__moonsinger.state().multi; return m ? { parts: m.parts.length, t0: m.t0, t1: m.t1 } : null; });
const Q = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.song.parts[0].id].find((t) => t.kind === "note").dur; });
// 拉框：从下面那位第 k 个音右边、谱下面的空白起，拉到上面那位第一个音左上方
async function boxRows(k) {
  const pts = await p.evaluate((k) => { const m = window.__moonsinger, L = m.layout(), parts = m.state().song.parts.map((x) => x.id), cb = (x, y) => m.view.clientBox({ x, y, w: 0, h: 0 });
    const of = (pid) => L.notes.filter((n) => L.systems[n.system].part === pid && L.systems[n.system].sys === 0).sort((a, b) => a.x - b.x);
    const up = of(parts[0]), dn = of(parts[1]), su = L.systems[up[0].system], sd = L.systems[dn[0].system], e = dn[k - 1];
    const s = cb(e.x + e.w + 4, sd.staffTop + 4 * L.sp + 15), t = cb(up[0].x - 6, su.staffTop - L.sp);
    return { x0: s.left, y0: s.top, x1: t.left, y1: t.top }; }, k);
  await clearNotes(); await p.mouse.move(pts.x0, pts.y0); await p.mouse.down(); await p.mouse.move(pts.x1, pts.y1, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(250);
}
const r0 = await rows();
// 1. 框两位歌手的前两个音 = 选了好几行
await boxRows(2);
let m = await multi();
check(!!m && m.parts === 2 && m.t0 === 0 && m.t1 === 2 * Q, "从空白拉框跨两位歌手 = 两行 × 前两拍", JSON.stringify(m));
check(await p.$$eval("#score .selbox", (e) => e.length) === 2, "每一行各画一个框");
check(await p.evaluate(() => !document.querySelector(".sel-bar").hidden && /2 行/.test(document.querySelector(".sel-bar").textContent)), "选区条露着、写「2 行」");
// 2. 上移 = 两行一起移
await p.keyboard.press("ArrowUp"); await p.waitForTimeout(150);
let r1 = await rows();
check(r1[0] !== r0[0] && r1[1] !== r0[1] && r1[0].split(" ").slice(2).join(" ") === r0[0].split(" ").slice(2).join(" "), "↑ = 两行选中的一起往上一级，框外的不动", `${r0} → ${r1}`);
check(!!(await multi()), "移完选区还在");
await p.keyboard.press("ArrowDown"); await p.waitForTimeout(150);
check(JSON.stringify(await rows()) === JSON.stringify(r0), "↓ = 回来");
// 3. 音键 = 说一句、谱不变
await clearNotes(); await p.keyboard.press("Digit1"); await p.waitForTimeout(150);
check(JSON.stringify(await rows()) === JSON.stringify(r0) && /整块操作/.test(await said()), "音键 = 不写、说「只能整块操作」", await said());
// 4. 复制：系统剪贴板 = 一行一份简谱
await clearNotes(); await p.keyboard.press("Control+c"); await p.waitForTimeout(200);
check(/复制了 2 行/.test(await said()), "Ctrl+C = 复制了 2 行", await said());
const clipText = await p.evaluate(() => navigator.clipboard.readText().catch(() => "?"));
check(clipText === "?" || clipText.split("\n").length === 2, "系统剪贴板一行一份（两行）", JSON.stringify(clipText));
// 5. 点上面那位第二小节第一个休止（光标到它后面 = 第二小节第 2 拍）→ 贴
// 纸面坐标 → 屏幕：用谱面自己的换算（clientBox：纸的位置 + 页边距 + 缩放）
const restAt = (pi, k) => p.evaluate(([pi, k]) => { const m = window.__moonsinger, L = m.layout(), pid = m.state().song.parts[pi].id;
  const rs = L.rests.filter((n) => L.systems[n.system].part === pid).sort((a, b) => L.systems[a.system].sys - L.systems[b.system].sys || a.x - b.x), r = rs[k];
  const c = m.view.clientBox({ x: r.x, y: r.y, w: r.w, h: 0 }); return { x: (c.left + c.right) / 2, y: c.top }; }, [pi, k]);
let pt = await restAt(0, 0);
await clearNotes(); await p.mouse.click(pt.x, pt.y); await p.mouse.move(5, 5); await p.waitForTimeout(200);
check(!(await multi()), "点别处 = 多行选区收掉");
await clearNotes(); await p.keyboard.press("Control+v"); await p.waitForTimeout(250);
const r2 = await rows();
check(r2[0].split(" ").slice(4).join(" ") === `r${Q} ${r0[0].split(" ")[0]} ${r0[0].split(" ")[1]} r${Q}` && r2[1].split(" ").slice(4).join(" ") === `r${Q} ${r0[1].split(" ")[0]} ${r0[1].split(" ")[1]} r${Q}`, "贴 = 两行一起落在第二小节第 2 拍，一样长、后面不挪", JSON.stringify(r2));
check(r2[0].split(" ").length === r0[0].split(" ").length, "总长不变（只换掉两个休止）");
m = await multi();
check(!!m && m.parts === 2 && m.t0 === 5 * Q && m.t1 === 7 * Q, "贴完选中贴上去的那一块", JSON.stringify(m));
check(/贴了 2 行/.test(await said()), "说「贴了 2 行」", await said());
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check(JSON.stringify(await rows()) === JSON.stringify(r0), "一步撤销回到贴之前");
// 6. 光标在下面那位（往下只有一行）→ 贴不下 = 整块不贴、说为什么
pt = await restAt(1, 0);
await clearNotes(); await p.mouse.click(pt.x, pt.y); await p.mouse.move(5, 5); await p.waitForTimeout(200);
await clearNotes(); await p.keyboard.press("Control+v"); await p.waitForTimeout(250);
check(JSON.stringify(await rows()) === JSON.stringify(r0) && /贴不下/.test(await said()) && /2 行/.test(await said()), "往下行数不够 = 整块不贴、说为什么", await said());
// 7. 再来一遍：框整个第一小节两行 → Ctrl+D = 第二小节变成一样的、选区跟过去
await boxRows(4);
m = await multi();
check(!!m && m.t0 === 0 && m.t1 === 4 * Q, "框整个第一小节两行", JSON.stringify(m));
await p.keyboard.press("Control+d"); await p.waitForTimeout(250);
const r3 = await rows();
check(r3[0] === `${r0[0].split(" ").slice(0, 4).join(" ")} ${r0[0].split(" ").slice(0, 4).join(" ")}` && r3[1] === `${r0[1].split(" ").slice(0, 4).join(" ")} ${r0[1].split(" ").slice(0, 4).join(" ")}`, "Ctrl+D = 第二小节两行都变成第一小节的样子", JSON.stringify(r3));
m = await multi();
check(!!m && m.t0 === 4 * Q && m.t1 === 8 * Q, "选区跟到贴上去的那一块", JSON.stringify(m));
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
// 8. 退格 = 每行变一样长的休止、不合拢
await boxRows(2);
await p.keyboard.press("Backspace"); await p.waitForTimeout(200);
const r4 = await rows();
check(r4.every((r, i) => r.split(" ").slice(0, 2).join(" ") === `r${Q} r${Q}` && r.split(" ").slice(2).join(" ") === r0[i].split(" ").slice(2).join(" ")), "退格 = 两行选中的变成一样长的休止、后面不挪", JSON.stringify(r4));
check(!!(await multi()), "退格完选区还在");
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check(!(await multi()), "Esc = 收掉");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
