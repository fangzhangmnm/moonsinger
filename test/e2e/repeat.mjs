// test/e2e/repeat.mjs —— 真浏览器 E2E：谱内反复 / 跳转（pad 符号层「反复」菜单插、谱上画、放的时候展开、点开小菜单改 / 删）。
// created 2026-10-09 by Claude Opus 5.5（user「顺便一提谱内的循环和标准的dc这种是不是支持下也不难？…就是普通记谱软件支持的那种。这样，不超过sheet边界」「你先把三个小件做了」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 两小节（A / B 各四个四分音符），光标在谱头后面
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].slice(0, 3); let id = 7000;
  const notes = (ly) => Array.from({ length: 4 }, (_, k) => ({ kind: "note", id: id++, pitch: { step: "CDEF"[k], alter: 0, octave: 5 }, dur: 1680, lyric: k ? null : ly }));
  m.set({ ...st, caret: 3, sel: null, song: { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [pid]: [...head, ...notes("A"), ...notes("B")] } }] } });
});
const shape = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].slice(3).map((t) => t.kind === "note" ? (t.lyric ?? "n") : t.kind === "bar" ? (t.repeat ?? "|") + (t.times ? "x" + t.times : "") : t.kind === "nav" ? (t.what === "ending" ? `[${t.nums.join(".")}]` : t.what) : t.kind).join(" "); });
const order = () => p.evaluate(() => window.__moonsinger.flatten().tokens.filter((t) => t.kind === "note" && t.lyric).map((t) => t.lyric).join(" "));
const menu = async (v) => {
  if (!(await p.$(".pad-grid.symbols"))) { await p.click('.pad-head [data-kbswitch]'); await p.waitForTimeout(80); }
  await p.click('.pad-head [data-sympage="mark"]'); await p.waitForTimeout(80);
  await p.click('[data-sym="repeat"]'); await p.waitForTimeout(150);
  await p.click(`.repeat-menu [data-v="${v}"]`); await p.waitForTimeout(150);
};
check(!!(await p.evaluate(() => true)), "开好了");
await menu("bar:start");
check((await shape()).startsWith("start A"), "光标在纸头：插 |:", await shape());
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, caret: s.song.papers[0].tracks[s.at.part].length }); });
await menu("bar:end");
check((await shape()).endsWith("end"), "光标在末尾：插 :|", await shape());
check(await order() === "A B A B", "放的时候展开：A B A B", await order());
await menu("bar:end:3");
check((await shape()).endsWith("endx3"), "光标挨着那条 :| = 改成 ×3（不新插）", await shape());
check(await order() === "A B A B A B", "×3：放三遍", await order());
check(await p.$$eval("#score text.repeat-bar, #score .repeat-bar", (e) => e.length) >= 2, "谱上画了反复记号（|: 和 :|）");
check(/×3/.test(await p.$eval("#score", (e) => e.textContent)), "谱上写「×3」");
// D.C.：插在末尾 → 放完三遍再从头（跳回来之后不再反复）
await menu("nav:dc");
check((await shape()).endsWith("endx3 dc"), "插 D.C.", await shape());
check(await order() === "A B A B A B A B", "D.C.：跳回开头、不再反复", await order());
// 点谱上的「D.C.」：小菜单（换成 D.C. al Fine / 删）
const dc = await p.$$eval("#score text.nav-mark", (es) => { const e = es.find((x) => x.textContent === "D.C."); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(dc.x, dc.y); await p.waitForTimeout(200);
check(!!(await p.$(".nav-menu")), "点谱上的 D.C. = 它的小菜单");
await p.click('.nav-menu [data-v="del"]'); await p.waitForTimeout(150);
check(!(await shape()).includes("dc"), "删掉", await shape());
// 第二位歌手那一行写的不起作用：画灰
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), pid = s.at.part, toks = s.song.papers[0].tracks[pid];
  m.set({ ...s, song: { ...s.song, parts: [...s.song.parts, { id: "P9", role: "r9", mic: "m9" }], papers: [{ ...s.song.papers[0], tracks: { ...s.song.papers[0].tracks, P9: [...toks.slice(0, 3), { kind: "nav", id: 7900, what: "dc" }, ...toks.slice(3).filter((t) => t.kind === "note").map((t) => ({ ...t, id: t.id + 500 }))] } }] } });
});
await p.waitForTimeout(200);
check(await p.$$eval("#score text.nav-mark.art-mute", (e) => e.some((x) => x.textContent === "D.C.")), "第二位那一行的 D.C. 画灰（只看最上面那位）");
check(await order() === "A B A B A B", "第二位的 D.C. 不起作用", await order());
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
