// test/e2e/lyric-dash.mjs —— 歌词框里的「-」：回车和空格一样（单独一个 / 中日文后面 = 拖腔；字母后面 = 词没完）。
// created 2026-10-13 by Claude Opus 5.5（user「中文里面的-为什么不显示」「-空格显示 -回车不显示」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/lyric-dash.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, s = m.state(), TPQ = 1680, head = s.song.papers[0].tracks[s.at.part].slice(0, 3);
  let id = 9300; const n = (lyric) => ({ kind: "note", id: id++, pitch: { step: "E", alter: 0, octave: 5 }, dur: TPQ, lyric });
  const toks = [...head, n("月"), n(null), n("亮"), n(null), n("love"), n(null)];
  m.set({ ...s, song: { ...s.song, papers: s.song.papers.map((pp, i) => (i === 0 ? { ...pp, tracks: { ...pp.tracks, [s.at.part]: toks } } : pp)) }, caret: toks.length, nextId: id });
  m.setMode("lyrics");
});
await p.waitForTimeout(250);
const notes = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").map((t) => (t.lyric ?? "·") + (t.hyph ? "-" : "")).join(" "); });
const openNote = async (k) => {   // 点第 k 个音（只数音符）下面的歌词位
  const pt = await p.evaluate((k) => { const m = window.__moonsinger, L = m.layout(), s = m.state(), toks = s.song.papers[0].tracks[s.at.part], i = toks.map((t, j) => [t, j]).filter(([t]) => t.kind === "note")[k][1], n = L.notes.find((q) => q.index === i), sc = document.querySelector("#score .sheet").getBoundingClientRect(); return { x: sc.left + L.pageX.left + n.x + n.w / 2, y: sc.top + L.lyricY(n.system) }; }, k);
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200);
};
await openNote(1); await p.keyboard.press("Minus"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
check((await notes()).split(" ")[1] === "ー", "空音上打「-」回车 = 拖腔（以前回车什么都没写）", await notes());
await openNote(3); await p.keyboard.press("Minus"); await p.keyboard.press("Space"); await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
check((await notes()).split(" ")[3] === "ー", "空音上打「-」空格 = 拖腔（原来就对）", await notes());
await openNote(4); await p.evaluate(() => { document.querySelector(".lyric-input").value = "love-"; }); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
check((await notes()).split(" ")[4] === "love-", "字母后面的「-」回车 = 词没完（照旧）", await notes());
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
