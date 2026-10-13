// test/e2e/sing-stale.mjs —— 真浏览器 E2E（W-37）：上一首歌还在唱的那一句，换歌之后才失败回来 = 静默丢掉，不出「唱不了」红框、不往录音房塞空块。
//   user 2026-10-13「刚才放日文版团子大家族的时候我点了几下出了红框说没法唱…所以是我换文件了旧的cache乱了对吧」。
//   做法：A 歌（月读）按播放 → 假唱把 A 那一句挂着不回；换成 B 歌、按播放（pumpQuiet 回到 false）；这时让 A 那一句以「拍数对不上」失败 →
//   修前：singOne 的失败分支不看键还在不在这首歌，按「现在」的 pumpQuiet 报了红框 + 塞空块；修后：键不在 chunkPlans 里 = 什么都不做。
//   反证：把 main.ts singOne 失败分支里「!chunkPlans.has(key) → return」那行删掉 = 第一条红。
// created 2026-10-13 by Claude Fable 5.1
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
let lastPlayTap = 0;
const tapPlay = async () => { const w = 500 - (Date.now() - lastPlayTap); if (w > 0) await p.waitForTimeout(w); await p.click("#playBtn"); lastPlayTap = Date.now(); };
const toasts = () => p.$$eval(".notice-stack .toast, .notice, [role=alert]", (es) => es.map((e) => e.textContent ?? "").join(" | "));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// A 歌：新歌默认月读上场；写两个字「かな」。假唱：含「かな」的那一句挂着（把 reject 交给 window.__staleReject），别的句子马上回静音。
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.song.parts[0].id; let id = 7000;
  const n = (step, ly) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: ly });
  const a = st.song.papers[0];
  m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: [...a.tracks[pid].slice(0, 3), n("C", "か"), n("D", "な")] } }] } });
  window.__sings = []; window.__staleReject = null;
  m.singer.sing = (score) => { const kana = score.SCORE.map((e) => e.kana).join(""); window.__sings.push(kana);
    if (kana.includes("かな")) return new Promise((_ok, rej) => { window.__staleReject = rej; });
    return Promise.resolve({ samples: new Float32Array(22050), sr: 22050 }); };
});
await tapPlay();
let hung = false; for (let i = 0; i < 50; i++) { if (await p.evaluate(() => !!window.__staleReject)) { hung = true; break; } await p.waitForTimeout(100); }
check(hung, "A 歌按播放：月读开始唱「かな」那一句（假唱挂着不回）", JSON.stringify(await p.evaluate(() => window.__sings)));
// 换成 B 歌（别家的谱，没人上场 = 不唱）；按播放让 pumpQuiet 回到 false（真播放的口径）
const N = (s, o, ly) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>${ly}</text></lyric></note>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("E", 4, "さ")}${N("F", 4, "し")}${N("G", 4, "す")}${N("A", 4, "せ")}</measure></part></score-partwise>`;
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("b.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(400);
check((await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.some((t) => t.lyric === "さ"))), "换成了 B 歌");
await tapPlay(); await p.waitForTimeout(600);
const before = await toasts();
// 现在让 A 那一句失败回来（引擎的英文原话）
await p.evaluate(() => { window.__staleReject?.(new Error("32 sung syllables in the text, 23 in the score")); });
await p.waitForTimeout(600);
const after = await toasts();
check(!/唱不了/.test(after), "上一首那一句换歌后才失败 = 不报「唱不了」红框（静默丢掉）", `之前「${before}」之后「${after}」`);
check(!(await p.evaluate(() => { const m = window.__moonsinger; return m.engine.playing && m.state().song.papers[0].tracks.P1.some((t) => t.lyric === "か"); })), "没有把上一首放起来");
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
