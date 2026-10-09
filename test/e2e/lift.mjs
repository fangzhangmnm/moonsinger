// test/e2e/lift.mjs —— 真浏览器 E2E：长按拖歌词（往左 = 合 / 早一个音起，往右 = 晚一个音起、空出来的变拖腔）、力度记号 / 渐强渐弱（点 = 小菜单、拖 = 挪）。
// created 2026-10-08 by Claude Opus 5.5（user「歌词的合能不能也改成长按拖动。不然每次点文本框是超级麻烦的」；鼠标按住直接拖，手指长按再拖，手指直接拖 = 滚动）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/lift.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (step, oct, lyr) => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>1</duration><type>quarter</type>${lyr ? `<lyric><syllabic>single</syllabic><text>${lyr}</text></lyric>` : ""}</note>`;
const D = (inner) => `<direction placement="below"><direction-type>${inner}</direction-type></direction>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Vocals</part-name></score-part></part-list><part id="P1">
<measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${D("<dynamics><p/></dynamics>")}${N("C", 5, "我")}${D('<wedge type="crescendo"/>')}${N("D", 5, "爱")}${N("E", 5, "你")}${D('<wedge type="stop"/>')}${D("<dynamics><f/></dynamics>")}${N("F", 5)}</measure>
<measure number="2">${N("G", 5)}${N("A", 5)}${N("B", 5)}${N("C", 6)}</measure></part></score-partwise>`;
const b = await chromium.launch();
async function page(touch) {
  const ctx = await b.newContext(touch ? { viewport: { width: 1024, height: 1200 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 900 } });
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
  p.cdp = touch ? await ctx.newCDPSession(p) : null;
  return p;
}
async function load(p) {
  await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); }, XML);
  await p.waitForTimeout(300);
}
const toks = (p) => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers.find((x) => x.id === s.at.paper).tracks[s.at.part]; });
const lyr = async (p) => (await toks(p)).filter((t) => t.kind === "note").map((t) => t.lyric ?? "_").join(" ");
const marks = async (p) => (await toks(p)).filter((t) => t.kind === "note" || t.kind === "dyn" || t.kind === "hairpin").map((t) => (t.kind === "note" ? "n" : t.kind === "dyn" ? t.value : t.dir === "cresc" ? "<" : ">")).join(" ");
const center = (p, sel, k = 0) => p.$$eval(sel, (es, k) => { const r = es[k].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, k);
const heads = (p) => p.$$eval("#score text.note", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.x }; }));
const undo = (p) => p.keyboard.press("Control+z");

// ── 鼠标 ──
{
  const p = await page(false); await load(p);
  check(await lyr(p) === "我 爱 你 _ _ _ _ _", "载入", await lyr(p));
  check(await marks(p) === "p n < n n f n n n n n", "记号载入", await marks(p));
  // 1. 拖「爱」往右一个音
  let a = await center(p, "#score text.lyric", 1), h = await heads(p);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(h[2].x, a.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
  check(await lyr(p) === "我 ー 爱 你 _ _ _ _", "鼠标拖「爱」往右 = 晚一个音起，你被推到空位", await lyr(p));
  await undo(p); await p.waitForTimeout(150);
  check(await lyr(p) === "我 爱 你 _ _ _ _ _", "撤销 = 一步回去", await lyr(p));
  // 2. 拖「爱」往左 = 合
  a = await center(p, "#score text.lyric", 1); h = await heads(p);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(h[0].x, a.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
  check(await lyr(p) === "我‿爱 你 _ _ _ _ _ _", "鼠标拖「爱」往左 = 合", await lyr(p));
  await undo(p); await p.waitForTimeout(150);
  // 3. 轻点歌词 = 歌词框
  a = await center(p, "#score text.lyric", 1);
  await p.mouse.click(a.x, a.y); await p.waitForTimeout(150);
  check(await p.$eval(".lyric-input", (e) => !e.hidden), "轻点字 = 开歌词框");
  check(await lyr(p) === "我 爱 你 _ _ _ _ _", "轻点不改谱", await lyr(p));
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  // 4. 长按原地松手 = 选中这个音
  a = await center(p, "#score text.lyric", 2);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(150);
  const sel = await p.evaluate(() => window.__moonsinger.state().sel), t2 = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].findIndex((t) => t.lyric === "你"); });
  check(!!sel && sel.from === t2 && sel.to === t2 + 1, "长按字原地松手 = 选中它那个音", JSON.stringify(sel));
  check(await p.$eval(".lyric-input", (e) => e.hidden), "长按不开歌词框");
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  // 5. 点力度记号 = 小菜单；点 f = 改
  const dyns = await p.$$eval("#score text.dyn", (es) => es.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  check(dyns.length === 2, "两个力度字", String(dyns.length));
  await p.mouse.click(dyns[0].x, dyns[0].y); await p.waitForTimeout(150);
  check(await p.$$eval(".ctx-menu [data-v^='dyn:']", (e) => e.length) === 6, "点 p = 小菜单（6 个力度）");
  check(await p.$eval(".ctx-menu [data-v='dyn:p']", (e) => e.classList.contains("is-on")), "现在的 p 亮着");
  await p.click(".ctx-menu [data-v='dyn:mp']"); await p.waitForTimeout(150);
  check(await marks(p) === "mp n < n n f n n n n n", "改成 mp", await marks(p));
  await undo(p); await p.waitForTimeout(150);
  // 6. 拖 p 到第三个音
  h = await heads(p);
  const d0 = (await p.$$eval("#score text.dyn", (es) => es.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.x }; })))[0];
  await p.mouse.move(d0.x, d0.y); await p.mouse.down(); await p.mouse.move(d0.x + (h[2].l - h[0].l), d0.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
  check(await marks(p) === "n < n p n f n n n n n", "鼠标拖 p 到第三个音", await marks(p));
  await undo(p); await p.waitForTimeout(150);
  // 7. 拖 p 到 f 那个音 = 顶掉 f（湮灭 + 说一声）
  await p.mouse.move(d0.x, d0.y); await p.mouse.down(); await p.mouse.move(d0.x + (h[3].l - h[0].l), d0.y, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
  check(await marks(p) === "n < n n p n n n n n", "拖 p 到 f 那个音 = p 算数、f 去掉（渐强走一档）", await marks(p));
  const note = await p.$eval(".wb-notice, .notice, [class*=notice]", (e) => e.textContent).catch(() => "");
  check(/顺手去掉了 1 个/.test(note ?? ""), "说一声", note ?? "");
  await undo(p); await p.waitForTimeout(150);
  // 8. 点渐强 = 换方向
  const hp = await p.$$eval("#score path.hairpin", (es) => es.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  await p.mouse.click(hp[0].x, hp[0].y); await p.waitForTimeout(150);
  check(await p.$$eval(".ctx-menu [data-v^='dir:']", (e) => e.length) === 2, "点渐强 = 小菜单（两个方向）");
  await p.click(".ctx-menu [data-v='dir:dim']"); await p.waitForTimeout(150);
  check(await marks(p) === "p n > n n f n n n n n", "换成渐弱", await marks(p));
  const hp2 = await p.$$eval("#score path.hairpin", (es) => es.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));   // 换成渐弱以后 p > f 方向反着：发夹让出灰字的位置、变短了，重新量
  await p.mouse.click(hp2[0].x, hp2[0].y); await p.waitForTimeout(150);
  await p.click(".ctx-menu [data-v='del']"); await p.waitForTimeout(150);
  check(await marks(p) === "p n n n f n n n n n", "删除", await marks(p));
  check(p.errs.length === 0, "鼠标：没有页面错误", p.errs.join(" | "));
}
// ── 手指 ──
{
  const p = await page(true); await load(p);
  const touch = async (pts, holdMs) => {
    await p.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pts[0].x, y: pts[0].y, id: 1 }] });
    await p.waitForTimeout(holdMs);
    for (const q of pts.slice(1)) { await p.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: q.x, y: q.y, id: 1 }] }); await p.waitForTimeout(20); }
    const last = pts[pts.length - 1];
    await p.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(200);
    void last;
  };
  const path = (a, bx, n = 8) => Array.from({ length: n + 1 }, (_, k) => ({ x: a.x + ((bx - a.x) * k) / n, y: a.y }));
  // 9. 手指不长按就拖 = 滚动，不改谱
  let a = await center(p, "#score text.lyric", 1), h = await heads(p);
  await touch(path(a, h[2].x), 30);
  check(await lyr(p) === "我 爱 你 _ _ _ _ _", "手指直接拖 = 不改谱（滚动）", await lyr(p));
  // 10. 长按再拖 = 挪字
  a = await center(p, "#score text.lyric", 1); h = await heads(p);
  await touch(path(a, h[2].x), 600);
  check(await lyr(p) === "我 ー 爱 你 _ _ _ _", "手指长按「爱」往右拖 = 晚一个音起", await lyr(p));
  // 11. 长按「爱」（现在在第三个音）往左拖回去 = 早一个音起
  a = await p.$$eval("#score text.lyric", (es) => { const e = es.find((x) => x.textContent === "爱"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }); h = await heads(p);
  await touch(path(a, h[1].x), 600);
  check(await lyr(p) === "我 爱 ー 你 _ _ _ _", "往左拖回拖腔那个音 = 早一个音起，原来的变成它的拖腔", await lyr(p));
  // 12. 轻点力度字 = 小菜单
  const d0 = await center(p, "#score text.dyn", 0);
  await touch([d0], 40);
  check(await p.$$eval(".ctx-menu [data-v^='dyn:']", (e) => e.length) === 6, "手指轻点力度字 = 小菜单");
  await p.keyboard.press("Escape"); await p.evaluate(() => document.querySelector(".ctx-menu")?.remove());
  // 13. 手指长按力度字拖到第二个音
  const hd = await heads(p), dl = await p.$$eval("#score text.dyn", (es) => { const r = es[0].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await touch(path(dl, dl.x + (hd[1].l - hd[0].l)), 600);
  check(await marks(p) === "n p < n n f n n n n n", "手指长按 p 拖到第二个音（排在渐强前面）", await marks(p));
  check(p.errs.length === 0, "手指：没有页面错误", p.errs.join(" | "));
}
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
