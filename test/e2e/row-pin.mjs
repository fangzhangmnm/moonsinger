// test/e2e/row-pin.mjs —— 真浏览器 E2E：正在写的那一行钉在屏幕上（防抖）。created 2026-11-09 by Claude Opus 5.5
//   user 11-09「如果行距动态的话编辑的时候你每个输入都在上下抖就不大好」→「屏幕上把你正在写的那一行钉住不动 同意」：上面的行长高（写了很高的音），
//   光标那一行在新排版里往下挪了，滚动跟着补，屏幕上不动；换一首歌不钉。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/row-pin.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><type>quarter</type></note>`, S = "CDEFGAB";
const part = (id) => { let ms = ""; for (let k = 0; k < 8; k++) { let body = k ? "" : `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`; for (let j = 0; j < 4; j++) body += N(S[(k + j) % 7], 4); ms += `<measure number="${k + 1}">${body}</measure>`; } return `<part id="${id}">${ms}</part>`; };
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>${part("P1")}${part("P2")}</score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 700 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("t.musicxml", new TextEncoder().encode(xml))); m.setMode("notes"); }, XML);
await p.waitForTimeout(300);
// 光标放到第二位（B）那一行中间
// 两位的谱号定死、不自动八度线（不然很高的音会被自动换成高八度谱号 / 八度线，那一行不长高）
// v0.16.88 按段：纸头写高音谱号记号 + 这一段关自动八度线
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), p2 = s.song.parts[1].id; let k = 0;
  const papers = s.song.papers.map((pp) => ({ ...pp, looks: Object.fromEntries(Object.keys(pp.tracks).map((id) => [id, { autoOttava: false }])), tracks: Object.fromEntries(Object.entries(pp.tracks).map(([id, t]) => [id, [...t.slice(0, 3), { kind: "clef", id: 90000 + k++, clef: "G" }, ...t.slice(3)]])) }));
  m.set({ ...s, song: { ...s.song, papers }, at: { paper: s.song.papers[0].id, part: p2 }, caret: 9, sel: null }); });
await p.waitForTimeout(300);
// 光标那一行在屏幕上的 y = 谱的图在屏幕上的顶 + 那一行第五线（排版的 px × 缩放）
const caretY = () => p.evaluate(() => { const m = window.__moonsinger, L = m.layout(), s = m.state(), svg = document.querySelector("#score svg"), r = L.systems.find((x) => x.part === s.at.part && x.sys === 0); if (!svg || !r) return null; const b = svg.getBoundingClientRect(), z = b.height / L.height; return Math.round((b.top + r.staffTop * z) * 10) / 10; });
const rowTop = () => p.evaluate(() => { const L = window.__moonsinger.layout(), s = window.__moonsinger.state(); const r = L.systems.find((x) => x.part === s.at.part && x.sys === 0); return r ? r.staffTop : null; });
const y0 = await caretY(), t0 = await rowTop();
check(y0 !== null && t0 !== null, "光标在第二位那一行、看得见", JSON.stringify({ y0, t0 }));
// 上面那一行（A）写成很高的音：A 那一行往上长高，B 那一行在排版里往下挪
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), p1 = s.song.parts[0].id, pid = s.song.papers[0].id;
  m.set({ ...s, song: { ...s.song, papers: s.song.papers.map((q) => (q.id === pid ? { ...q, tracks: { ...q.tracks, [p1]: q.tracks[p1].map((t) => (t.kind === "note" ? { ...t, pitch: { step: "C", alter: 0, octave: 7 } } : t)) } } : q)) } }); });
await p.waitForTimeout(400);
const y1 = await caretY(), t1 = await rowTop();
check(t1 !== null && t0 !== null && t1 - t0 > 5, "上面那一行长高了：光标那一行在排版里往下挪了", `${t0} → ${t1}`);
check(y1 !== null && y0 !== null && Math.abs(y1 - y0) < 1.5, "光标那一行在屏幕上没动（滚动补了）", `${y0} → ${y1}`);
check(errs.length === 0, "没有页面错误", errs.join(" | "));
await b.close();
console.log(`row-pin: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
