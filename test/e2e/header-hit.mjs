// test/e2e/header-hit.mjs —— 真浏览器 E2E：谱头（谱号 / 调号 / 拍号）好点中（v0.16.7）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「拍号和调号你非常难点中，你有什么办法吗？优化一下他们的碰撞箱」）。
// 守：C 大调（调号没有升降号，原来只剩一条窄缝）里，点在三个框之间的缝里 / 框上面一点点 = 打开离得最近的那一样；拍号右边过去一点不被谱头抢。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/header-hit.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
// 第一行的谱号 / 调号 / 拍号框（换成屏幕坐标，同 clef.mjs）
const boxes = await p.evaluate(() => {
  const m = window.__moonsinger, L = m.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect();
  const to = (b) => ({ x: sc.left + L.pageX.left + b.x, y: sc.top + b.y, w: b.w, h: b.h });
  const c = L.clefs.find((x) => x.kind === "start" && x.system === 0), k = L.marks.find((x) => x.kind === "key" && x.system === 0), t = L.marks.find((x) => x.kind === "time" && x.system === 0);
  return { sp: L.sp, clef: to(c), key: to(k), time: to(t), fifths: m.state().song.papers[0].tracks[m.state().at.part].find((x) => x.kind === "key").fifths };
});
check(boxes.fifths === 0, "新歌 = C 大调（调号没有升降号）", String(boxes.fifths));
const { sp, clef, key, time } = boxes;
// 菜单是固定定位：offsetParent 永远是 null，按占不占地方判断「开着」
const open = () => p.evaluate(() => { const ed = document.querySelector(".mark-ed"), menu = document.querySelector(".ctx-menu"); return { ed: ed && !ed.hidden ? document.querySelector(".mark-in").value : null, menu: !!menu && !menu.hidden && menu.getBoundingClientRect().width > 0 }; });
const close = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(150); await p.mouse.click(5, 880); await p.waitForTimeout(100); };
const tap = async (x, y) => { await p.mouse.click(x, y); await p.waitForTimeout(250); const r = await open(); await close(); return r; };
const midY = key.y + key.h / 2;

const gapKT = time.x - (key.x + key.w);
if (gapKT > 1) { const r = await tap(key.x + key.w + gapKT * 0.3, midY); check(!!r.ed && r.ed.startsWith("1="), "调号和拍号之间的缝里、偏调号 = 打开调号", JSON.stringify(r)); }
else check(true, "调号和拍号之间没有缝（跳过）");
{ const r = await tap(key.x + key.w / 2, key.y - 0.6 * sp); check(!!r.ed && r.ed.startsWith("1="), "调号框上面一点 = 打开调号", JSON.stringify(r)); }
{ const r = await tap(time.x + time.w / 2, time.y - 0.6 * sp); check(!!r.ed && r.ed.includes("/"), "拍号框上面一点 = 打开拍号", JSON.stringify(r)); }
{ const gapCK = key.x - (clef.x + clef.w); if (gapCK > 1) { const r = await tap(clef.x + clef.w + gapCK / 2, midY); check(!!r.ed && r.ed.startsWith("1="), "谱号和调号之间的缝 = 调号（离得近；窄的那个多分一点地方）", JSON.stringify(r)); } else check(true, "谱号和调号之间没有缝（跳过）"); }
{ const r = await tap(clef.x + clef.w * 0.4, midY); check(r.menu && !r.ed, "点在谱号上 = 谱号菜单（不被调号抢）", JSON.stringify(r)); }
{ const r = await tap(time.x + time.w + 1.5 * sp, midY); check(!r.ed && !r.menu, "拍号右边过去一点 = 不被谱头抢（照常放光标）", JSON.stringify(r)); }
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nheader-hit: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
