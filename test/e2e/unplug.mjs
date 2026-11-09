// test/e2e/unplug.mjs —— 真浏览器 E2E：「弹」（拔插头）拔着 = 键盘上所有会往谱上写的键都断开，不只是音键（键盘总闸 src/app/input-gate.ts，v0.16.52）。
// created 2026-11-09 by Claude Fable 5.1（user「我发现插头断掉的时候，你其他的一些像零啊、横杠啊这些东西还是有。所以说，其实那个拔插头的功能…没有做好」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/unplug.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const A = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>P1</part-name></score-part></part-list><part id="P1">${Array.from({ length: 2 }, (_, k) => `<measure number="${k + 1}">${k ? "" : A}${N("C")}${N("D")}${N("E")}${N("F")}</measure>`).join("")}</part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 760 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("notes"); }, XML); await p.waitForTimeout(500);
const track = () => p.evaluate(() => { const s = window.__moonsinger.state(); return JSON.stringify(s.song.papers[0].tracks[s.at.part]); });
const st = () => p.evaluate(() => { const s = window.__moonsinger.state(); return { caret: s.caret, sel: s.sel, unit: s.input.unit }; });
const press = async (k) => { await p.keyboard.press(k); await p.waitForTimeout(60); };
const plugOn = () => p.evaluate(() => ({ btn: !!document.querySelector("#padPanel .impro-pad.is-on"), panel: document.getElementById("padPanel").classList.contains("is-unplugged") }));
// 光标放在中间（第 3 个音后面），焦点给谱
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), toks = s.song.papers[0].tracks[s.at.part]; let n = 0, i = 0; for (; i < toks.length && n < 3; i++) if (toks[i].kind === "note") n++; m.set({ ...s, caret: i, sel: null }); document.getElementById("score").focus(); }); await p.waitForTimeout(200);

// 接着的时候：0 写休止（留着这一步，后面试撤销）
const t0 = await track(); await press("Digit0"); const t1 = await track();
check(t1 !== t0, "（前提）接着的时候 0 = 写一个休止");

// 拔
await press("Backquote");
{ const o = await plugOn(); check(o.btn && o.panel, "` = 拔开：「弹」钮亮、键盘标成拔着", JSON.stringify(o)); }
const writeKeys = ["Digit0", "Minus", "Enter", "Shift+Enter", "Backspace", "Delete", "ArrowUp", "ArrowDown", "Shift+ArrowUp", "Shift+ArrowDown", "Quote", "Comma", "Digit1", "Shift+Digit2", "Control+x", "Control+v"];
for (const k of writeKeys) { await press(k); const t = await track(); check(t === t1, `拔着按 ${k}：谱没变`); if (t !== t1) break; }
// 读的照常：挪光标、选中、升降锁（输入状态）
{ const a = await st(); await press("ArrowLeft"); const c = await st(); check(c.caret === a.caret - 1, "拔着按 ←：光标照样挪", `${a.caret} → ${c.caret}`); }
{ await press("Shift+ArrowLeft"); const c = await st(); check(!!c.sel, "拔着按 Shift+←：照样选中", JSON.stringify(c.sel)); await p.evaluate(() => { const m = window.__moonsinger; m.set({ ...m.state(), sel: null }); }); }
{ const a = await st(); await press("Digit8"); const c = await st(); check(c.unit !== a.unit, "拔着按 8：长短基线（输入状态，不是谱）照样动", `${a.unit} → ${c.unit}`); await press("Digit9"); }
check((await track()) === t1, "上面这些读的动作之后谱还是没变");
// 键盘上的撤销：最后一步是谱上的（那个休止）= 停住，「弹」钮晃一下
{ await p.keyboard.press("Control+z"); const nudged = await p.evaluate(() => !!document.querySelector("#padPanel .impro-pad.nudge")); await p.waitForTimeout(80);
  check((await track()) === t1, "拔着按 Ctrl+Z：谱上的这一步不撤"); check(nudged, "被挡下 = 「弹」钮晃一下（不弹字）"); }
// 触屏键盘上写的那一排：灰掉、点不动；硬点也不写
{ const o = await p.evaluate(() => { const b = document.querySelector('#padPanel [data-cmd="rest"]'); if (!b) return null; const cs = getComputedStyle(b); return { pe: cs.pointerEvents, op: Number(cs.opacity) }; });
  check(!!o && o.pe === "none" && o.op < 0.5, "拔着：键盘上「休止」那一排灰掉、点不动", JSON.stringify(o));
  await p.evaluate(() => { for (const sel of ['[data-cmd="rest"]', '[data-cmd="extend"]', '[data-cmd="bar"]', '[data-cmd="backspace"]']) { const b = document.querySelector("#padPanel " + sel); if (!b) continue; for (const t of ["pointerdown", "pointerup", "click"]) b.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true })); } }); await p.waitForTimeout(150);
  check((await track()) === t1, "绕过样式硬点休止 / 延长 / 小节线 / 退格：谱也没变（总闸在后面兜着）"); }

// 接回去：照常写、照常撤
await press("Backquote");
{ const o = await plugOn(); check(!o.btn && !o.panel, "再按 ` = 接回去", JSON.stringify(o)); }
await press("Control+z"); check((await track()) === t0, "接回去之后 Ctrl+Z：那个休止撤掉了");
await press("Digit0"); check((await track()) !== t0, "接回去之后 0 又能写休止");
{ const o = await p.evaluate(() => { const b = document.querySelector('#padPanel [data-cmd="rest"]'); return b ? getComputedStyle(b).pointerEvents : null; }); check(o !== "none", "键盘上「休止」那一排又点得动了", String(o)); }
check(errs.length === 0, "页面零报错", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
