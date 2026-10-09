// test/e2e/sing-chunks.mjs —— 真浏览器 E2E：月读分段唱（默认每句）。月读换成记账的假唱：每段一次、带 raw（宿主自己拼、整首最后归一化）；
// 再放 = 全部复用（0 次）；编排里重复的纸 = 不再唱；改一个音 = 只重唱那一句；一整首 = 一次、不带 raw。
// created 2026-10-08 深夜 by Claude Opus 5.5（user「对我也觉得分开唱复用」「月读至少拆成句级别」「开关是歌手的属性，可以有不同的粒度」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 两张纸：A = 两句（中间一拍休止），B = 一句；编排 A B A
await p.evaluate(() => {
  const m = window.__moonsinger; m.addPaper();
  const st = m.state(), pid = st.song.parts[0].id; let id = 5000;
  const n = (step, ly) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: ly }), r = () => ({ kind: "rest", id: id++, dur: 1680 });
  const [a, b2] = st.song.papers, head = (pp) => pp.tracks[pid].slice(0, 3);
  m.set({ ...st, song: { ...st.song, arrangement: "A B A", papers: [{ ...a, tracks: { [pid]: [...head(a), n("C", "か"), n("D", "な"), r(), n("E", "し"), n("F", "い")] } }, { ...b2, tracks: { [pid]: [...head(b2), n("G", "う"), n("A", "た")] } }] } });
  m.setScope("all");
  window.__sings = [];
  m.singer.sing = async (score, prog, extra = {}) => { window.__sings.push({ n: score.SCORE.length, raw: !!extra.raw, kana: score.SCORE.map((e) => e.kana).join("") }); return { samples: new Float32Array(22050).fill(0.05 * window.__sings.length), sr: 22050 }; };
  window.__played = null; m.singer.play = (r) => { window.__played = r.samples.length / r.sr; };
});
const play = async () => { await p.evaluate(() => { window.__sings = []; window.__played = null; }); await p.click("#playBtn"); for (let i = 0; i < 40; i++) { if (await p.evaluate(() => window.__played !== null)) break; await p.waitForTimeout(100); } await p.click("#playBtn").catch(() => {}); return p.evaluate(() => ({ sings: window.__sings, played: window.__played })); };
let r1 = await play();
check(r1.sings.length === 3 && r1.sings.every((s) => s.raw), "每句：A 两句 + B 一句 = 唱 3 次（第二个 A 不再唱），都带 raw", JSON.stringify(r1.sings));
check(r1.sings.map((s) => s.kana).join("|") === "かな|しい|うた", "各段的字（休止处切开）", r1.sings.map((s) => s.kana).join("|"));
check(r1.played > 0, "拼好放出来", String(r1.played));
let r2 = await play();
check(r2.sings.length === 0, "再放 = 全部复用（一次都不唱）", JSON.stringify(r2.sings));
// 改第二句一个音 → 只重唱那一句
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), pid = st.song.parts[0].id, a = st.song.papers[0], t = a.tracks[pid].slice(); const k = t.findIndex((x) => x.lyric === "し"); t[k] = { ...t[k], pitch: { step: "B", alter: 0, octave: 4 } }; m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: t } }, ...st.song.papers.slice(1)] } }); });
let r3 = await play();
check(r3.sings.length === 1 && r3.sings[0].kana.includes("し"), "改一个音 = 只重唱那一句", JSON.stringify(r3.sings));
// 一整首：一次、不带 raw
await p.evaluate(() => window.__moonsinger.setChunk("whole"));
let r4 = await play();
check(r4.sings.length === 1 && !r4.sings[0].raw, "一整首 = 唱 1 次、不带 raw（以前的唱法）", JSON.stringify(r4.sings));
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
