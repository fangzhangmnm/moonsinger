// test/e2e/float.mjs —— 真浏览器 E2E：大屏上键盘钉在右下角（键盘设计稿 ai-docs/20261113-keyboard-round-design.md 第四节 + 8.2，v0.17.52）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）
// 守：1920 宽 = 键盘钉在右下角（离右边 / 下边 12 px、宽 560）、谱照旧占满整宽、小条贴在键盘顶边；收起 = 小条回左下角、再开回原处；
//     听（混音台）照旧贴底；「布局…」里「位置」贴底 / 右下角 = 马上换、记在这台设备上（重开还在）；行 / 列重开还在；iPad 宽度「自动」永远贴底。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/float.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const A = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>P1</part-name></score-part></part-list><part id="P1">${Array.from({ length: 24 }, (_, k) => `<measure number="${k + 1}">${k ? "" : A}${N("C")}${N("D")}${N("E")}${N("F")}</measure>`).join("")}</part></score-partwise>`;
const base = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
async function boot() {
  await p.goto(base); await p.waitForTimeout(800);
  await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("notes"); }, XML); await p.waitForTimeout(300);
  await openPad();
}
async function openPad() { if (await p.evaluate(() => document.getElementById("padPanel").hidden)) { await p.click("#padTab"); await p.waitForTimeout(250); } }
const geo = () => p.evaluate(() => { const s = document.getElementById("stage"), sr = s.getBoundingClientRect(), r = document.getElementById("padPanel").getBoundingClientRect(), t = document.querySelector(".dock-tab").getBoundingClientRect(), sc = document.getElementById("score").getBoundingClientRect();
  return { side: s.dataset.side ?? "bottom", dock: s.dataset.dock, padHidden: document.getElementById("padPanel").hidden, w: Math.round(r.width), gapR: Math.round(sr.right - r.right), gapB: Math.round(sr.bottom - r.bottom), padTop: Math.round(r.top), padLeft: Math.round(r.left),
    tabL: Math.round(t.left), tabB: Math.round(t.bottom), stageW: Math.round(sr.width), stageL: Math.round(sr.left), stageB: Math.round(sr.bottom), scoreW: Math.round(sc.width) }; });
async function layoutPick(sel) {
  await p.click('#padPanel [data-knob="more"]'); await p.waitForTimeout(150);
  await p.click('#padPanel [data-open="layout"]'); await p.waitForTimeout(150);
  if (await p.$(`.offer.pad-layout ${sel}`)) { await p.click(`.offer.pad-layout ${sel}`); await p.waitForTimeout(250); }
  const v = await p.evaluate(() => [...document.querySelectorAll(".offer.pad-layout .lay-v")].map((e) => e.textContent));
  await p.click('.offer.pad-layout [data-v="close"]'); await p.waitForTimeout(150);
  return v;
}
await boot();
// 1. 1920 宽：钉在右下角
let g = await geo();
check(g.side === "float" && g.dock === "keys", "1920 宽 + 音 = 键盘钉在右下角", JSON.stringify(g));
check(g.gapR === 12 && g.gapB === 12 && g.w === 560, "离右边 / 下边 12 px、宽 560", `${g.gapR} ${g.gapB} ${g.w}`);
check(g.scoreW === g.stageW, "谱照旧占满整宽（键盘浮在上面）", `${g.scoreW} / ${g.stageW}`);
check(Math.abs(g.tabB - g.padTop) <= 1 && g.tabL >= g.padLeft, "小条贴在键盘顶边", `${g.tabB} vs ${g.padTop}`);
const at = { top: g.padTop, left: g.padLeft };
// 2. 收起 / 再开
await p.click("#padPanel .hide-pad"); await p.waitForTimeout(250);
g = await geo();
check(g.padHidden && g.tabL - g.stageL < 40 && g.stageB - g.tabB < 40, "收起 = 小条回左下角", JSON.stringify(g));
await openPad(); g = await geo();
check(g.padTop === at.top && g.padLeft === at.left, "再开 = 回到原处", `${g.padLeft},${g.padTop}`);
// 3. 听 = 混音台照旧贴底
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(300);
if (await p.evaluate(() => document.querySelector("#stage .studio")?.hidden ?? true)) { await p.click("#padTab"); await p.waitForTimeout(300); }
const mix = await p.evaluate(() => { const s = document.getElementById("stage"), sr = s.getBoundingClientRect(), el = document.querySelector("#stage .studio:not([hidden])"); const r = el?.getBoundingClientRect(); return { dock: s.dataset.dock, w: r ? Math.round(r.width) : -1, stageW: Math.round(sr.width), bottom: r ? Math.round(sr.bottom - r.bottom) : -1 }; });
check(mix.dock === "studio" && Math.abs(mix.w - mix.stageW) <= 2 && mix.bottom <= 1, "听 = 混音台照旧贴底、占满整宽", JSON.stringify(mix));
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(250); await openPad();
// 4. 位置：贴底 → 马上换、重开还在
await layoutPick('[data-place="bottom"]');
g = await geo();
check(g.side !== "float" && g.w === g.stageW, "「位置 贴底」= 马上贴底", JSON.stringify(g));
const cols0 = (await layoutPick('[data-cstep="1"]'))[1];
await boot(); g = await geo();
check(g.side !== "float", "贴底记在这台设备上：重开还是贴底", g.side);
const cols1 = (await layoutPick('[data-v="none"]'))[1];
check(cols1 === cols0, "列数（布局里改的）重开还在", `${cols0} → ${cols1}`);
await layoutPick('[data-cstep="-1"]');
await layoutPick('[data-place="auto"]');
g = await geo();
check(g.side === "float", "改回「自动」= 1920 宽又钉回右下角", g.side);
// 5. iPad 宽度：自动 = 贴底；右下角 = 浮起来，重开还在
await p.setViewportSize({ width: 1180, height: 820 }); await p.waitForTimeout(300);
g = await geo();
check(g.side !== "float", "iPad 横屏宽度 + 自动 = 不浮", g.side);
await p.setViewportSize({ width: 820, height: 1180 }); await p.waitForTimeout(300);
g = await geo();
check(g.side !== "float", "iPad 竖屏宽度 + 自动 = 不浮", g.side);
await layoutPick('[data-place="corner"]');
g = await geo();
check(g.side === "float" && g.gapR === 12 && g.gapB === 12, "iPad 宽度 +「右下角」= 钉在右下角", JSON.stringify(g));
await boot(); g = await geo();
check(g.side === "float", "右下角重开还在", g.side);
// 6. 光标那一行被浮窗盖住 = 写一个音之后谱往上滚、这一行露在键盘上沿上面（右边的音被盖着才管）
const cov = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), s = m.state(), pr = document.getElementById("padPanel").getBoundingClientRect(), el = document.getElementById("score");
  const pick = L.notes.filter((n) => n.system === 5 && m.view.clientBox({ x: n.x, y: 0, w: 0, h: 0 }).left > pr.left + 20).sort((a, b) => b.x - a.x)[0]; if (!pick) return null;
  m.set({ ...s, caret: pick.index - 1, sel: null });
  const sys = L.systems[pick.system], box = m.view.clientBox({ x: pick.x, y: sys.top, w: 0, h: sys.bottom - sys.top }); el.scrollTop += box.bottom - (pr.top + 120);
  return { padTop: Math.round(pr.top) }; });
await p.waitForTimeout(300);
await p.evaluate(() => window.__moonsinger.run({ k: "caret", d: 1 })); await p.waitForTimeout(400);   // 光标右移一格：还在这一行的右边（被盖着的地方）
const after = await p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), h = L.head, sys = L.systems[h.system], b = m.view.clientBox({ x: h.x, y: sys.top, w: 0, h: sys.bottom - sys.top }); return { bottom: Math.round(b.bottom), x: Math.round(b.left) }; });
check(!!cov && after.bottom <= cov.padTop, "光标那一行被浮窗盖住 = 挪一下光标就往上滚、露在键盘上沿上面", `${JSON.stringify(cov)} → ${JSON.stringify(after)}`);
await layoutPick('[data-place="auto"]');
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
