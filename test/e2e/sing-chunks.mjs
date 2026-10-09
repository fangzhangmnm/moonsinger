// test/e2e/sing-chunks.mjs —— 真浏览器 E2E：月读分段唱（默认每句）。月读换成记账的假唱：每段一次、带 raw（宿主自己拼、整首最后归一化）；
// 再放 = 全部复用（0 次）；编排里重复的纸 = 不再唱；改一个音 = 只重唱那一句；一整首 = 一次、不带 raw。
// created 2026-10-08 深夜 by Claude Opus 5.5（user「对我也觉得分开唱复用」「月读至少拆成句级别」「开关是歌手的属性，可以有不同的粒度」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 两张纸：A = 两句（中间一拍休止），B = 一句；编排 A B A。
// 2026-10-09（实时试听刀 1）句只在休止处切、**不在纸界切**（user「曲段的边界算句子吧…也许还是同意可以跨曲段句子…听你的试试」）：
//   B 的「うた」后面没有休止、直接接回 A 的「かな」→ 一句「しいうたかな」跨了两张纸；最后一个 A 的「しい」自己一句。
await p.evaluate(() => {
  const m = window.__moonsinger; m.addPaper();
  const st = m.state(), pid = st.song.parts[0].id; let id = 5000;
  const n = (step, ly) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: ly }), r = () => ({ kind: "rest", id: id++, dur: 1680 });
  const [a, b2] = st.song.papers, head = (pp) => pp.tracks[pid].slice(0, 3);
  m.set({ ...st, song: { ...st.song, arrangement: "A B A", papers: [{ ...a, tracks: { [pid]: [...head(a), n("C", "か"), n("D", "な"), r(), n("E", "し"), n("F", "い")] } }, { ...b2, tracks: { [pid]: [...head(b2), n("G", "う"), n("A", "た")] } }] } });
  m.setScope("all");
  window.__sings = [];
  m.singer.sing = async (score, prog, extra = {}) => { window.__sings.push({ n: score.SCORE.length, raw: !!extra.raw, kana: score.SCORE.map((e) => e.kana).join("") }); return { samples: new Float32Array(22050).fill(0.05 * window.__sings.length), sr: 22050 }; };
});
// 放 = 块都喂进录音房、走带在放（2026-10-09 实时试听刀 1：不再有「拼成一条」）；放起来就停
const play = async () => { await p.evaluate(() => { window.__sings = []; }); await p.click("#playBtn");   // 主键 |▶ = 从起点放（v0.9.19）
  let played = false; for (let i = 0; i < 60; i++) { if (await p.evaluate(() => window.__moonsinger.engine.playing)) { played = true; break; } await p.waitForTimeout(100); } await p.waitForTimeout(150); await p.click("#playBtn").catch(() => {}); await p.waitForTimeout(100); return p.evaluate((played) => ({ sings: window.__sings, played }), played); };
let r1 = await play();
check(r1.sings.length === 3 && r1.sings.every((s) => s.raw), "每句：かな ｜ しいうたかな（跨纸一句）｜ しい = 唱 3 次（重复的内容不再唱），都带 raw", JSON.stringify(r1.sings));
check(r1.sings.map((s) => s.kana).sort().join("|") === "かな|しい|しいうたかな", "各段的字（只在休止处切开，纸界不切；顺序 = 从光标起按距离，刀 2）", r1.sings.map((s) => s.kana).join("|"));
check(r1.played === true, "块喂齐了、走带放起来了", String(r1.played));
let r2 = await play();
check(r2.sings.length === 0, "再放 = 全部复用（一次都不唱）", JSON.stringify(r2.sings));
// 改第二句一个音 → 只重唱那一句
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), pid = st.song.parts[0].id, a = st.song.papers[0], t = a.tracks[pid].slice(); const k = t.findIndex((x) => x.lyric === "し"); t[k] = { ...t[k], pitch: { step: "B", alter: 0, octave: 4 } }; m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: t } }, ...st.song.papers.slice(1)] } }); });
let r3 = await play();
check(r3.sings.length === 2 && r3.sings.every((s) => s.kana.includes("し")), "改「し」的音 = 只重唱含它的两句（跨纸那句 + 末尾那句），「かな」不动", JSON.stringify(r3.sings));
// 一整首：一次、不带 raw
await p.evaluate(() => window.__moonsinger.setChunk("whole"));
let r4 = await play();
check(r4.sings.length === 1, "一整首 = 唱 1 次（一块）", JSON.stringify(r4.sings));
// 边算边放（刀 2；user「第一句好了就开播 嗯」）：每句唱 350 ms，三句新内容 → 走带在全部唱完之前就放起来；到了没唱好的那句会等，唱好接着放
await p.evaluate(() => window.__moonsinger.setChunk("phrase"));
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.song.parts[0].id, a = st.song.papers[0], t = a.tracks[pid].map((x) => (x.kind === "note" && x.lyric ? { ...x, lyric: x.lyric === "か" ? "さ" : x.lyric === "し" ? "き" : x.lyric } : x));   // 换歌词 = 新的键
  m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: t } }, ...st.song.papers.slice(1)] } });
  window.__sings = []; window.__sungAt = [];
  m.singer.sing = async (score) => { await new Promise((ok) => setTimeout(ok, 350)); window.__sings.push({ kana: score.SCORE.map((e) => e.kana).join("") }); window.__sungAt.push(performance.now()); return { samples: new Float32Array(22050 * 2).fill(0.05), sr: 22050 }; };
});
await p.waitForTimeout(900);   // 预唱会先唱光标附近（quiet）；等它过去再按播放，看的是播放的预卷
await p.evaluate(() => { window.__sings = []; window.__sungAt = []; });
await p.click("#playBtn");   // 主键 |▶ = 从起点（开头）放
let startedAt = -1, sungWhenStarted = -1;
for (let i = 0; i < 80; i++) { if (await p.evaluate(() => window.__moonsinger.engine.playing)) { startedAt = Date.now(); sungWhenStarted = await p.evaluate(() => window.__sings.length); break; } await p.waitForTimeout(50); }
check(startedAt > 0, "放起来了");
const total = await p.evaluate(() => { const tl = window.__moonsinger.engine.timeline; return tl.tracks.filter((t) => t.kind === "clips").reduce((n, t) => n + t.clips.length, 0); });
check(total >= 3 && sungWhenStarted < total, `开播时还没全唱完（开播时 ${sungWhenStarted} / ${total} 句，边放边唱）`);
await p.waitForTimeout(1500);
check((await p.evaluate(() => window.__sings.length)) + (await p.evaluate(() => [...new Set(window.__sings.map((s) => s.kana))].length)) >= 0 && (await p.evaluate(() => window.__moonsinger.engine.timeline.tracks.filter((t) => t.kind === "clips").every((t) => t.clips.every((c) => window.__moonsinger.engine.hasChunk(c.key))))), "后面的边放边唱完了");
await p.click("#playBtn").catch(() => {}); await p.waitForTimeout(100);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
