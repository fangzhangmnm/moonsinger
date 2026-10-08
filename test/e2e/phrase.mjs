// test/e2e/phrase.mjs —— 真浏览器 E2E（先 npm run build，再 npm run serve（8710），再 node test/e2e/phrase.mjs；借 WeebPaint 的 playwright，同 shell-smoke）。created 2026-10-08 by Claude Fable 5.1
// 句 / 隐藏的纸 / 范围 / 走带回顶栏 / 写字头 E2E。
import { chromium } from "./pw.mjs";
import os from "node:os"; import path from "node:path";
const OUT = path.join(os.tmpdir(), "moonsinger-e2e"); import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
try {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(500);
  const kinds = () => p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.slice(3).map((t) => t.kind === "note" ? "n" : t.kind === "rest" ? "r" : t.kind === "bar" ? "|" : t.kind === "phrase" ? "," : t.kind).join(" "));
  const systems = () => p.evaluate(() => new Set(window.__moonsinger.layout().systems.map((s) => s.sys)).size);
  check(await p.evaluate(() => !!document.querySelector("#bar #transport #playBtn") && !document.getElementById("stage").querySelector(".transport")), "走带回到顶栏中间");
  await p.click("#score", { position: { x: 300, y: 300 } });
  for (const k of ["Digit1", "Digit2", "Digit3", "Digit5"]) await p.keyboard.press(k);
  check(await p.$("svg .note.cur") != null, "刚写完：写字头（前一个音）亮着");
  // 轻点第一个音 → 光标，写字头不亮
  const ns = await p.$$eval("#score text.note", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  await p.mouse.click(ns[0].x, ns[0].y); await p.waitForTimeout(100);
  check(await p.$("svg .note.cur") == null, "轻点放的光标：前一个音不发蓝");
  await p.keyboard.press("End");
  // Shift+Enter = 句号（pad 符号层里那个键同一条命令）
  await p.keyboard.press("Shift+Enter"); await p.waitForTimeout(150);
  check((await kinds()) === "n n n n ,", "Shift+Enter = 句号", await kinds());
  for (const k of ["Digit6", "Digit5", "Digit3"]) await p.keyboard.press(k);
  await p.waitForTimeout(150);
  check((await systems()) === 1, "句不换行（还是一行谱）", String(await systems()));
  check(await p.$("svg .phrase-mark") != null, "画了小「。」");
  // 「|」两下 = 两根小节线（句号不绑小节线了）
  await p.keyboard.press("Enter"); await p.waitForTimeout(80); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
  check((await kinds()).endsWith("| |"), "按两下「|」= 两根小节线", await kinds());
  // 歌词里打句号 = 句
  await p.keyboard.press("Backspace"); await p.keyboard.press("Backspace"); await p.waitForTimeout(100);
  const ns2 = await p.$$eval("#score text.note", (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  const ly = await p.evaluate(() => { const L = window.__moonsinger.layout(), sh = document.querySelector("#score .sheet").getBoundingClientRect(); const h = L.lyrics[0]; return { x: sh.left + L.pageX.left + h.x, y: sh.top + h.y - L.sp * 0.5 }; });
  await p.mouse.click(ly.x, ly.y); await p.waitForTimeout(150);
  console.log("    [dbg] lyric open:", await p.evaluate(() => window.__moonsinger.view.lyrics.open), "click", JSON.stringify(ly), "kinds", await kinds());
  for (const ch of ["さ", "く", "ら", "。"]) { await p.keyboard.type(ch); await p.waitForTimeout(80); }
  await p.waitForTimeout(200);
  const k2 = await kinds(); check(k2.startsWith("n n n ,"), "歌词「さくら。」：第三个音后面插了句", k2);
  await p.keyboard.press("Escape");
  // 存 → 开：句来回（breath-mark）
  const bytes = await p.evaluate(() => Array.from(window.__moonsinger.bytes()));
  const back = await p.evaluate((arr) => { const o = window.__moonsinger.open("x.mxl", new Uint8Array(arr)); return o.song.papers[0].tracks.P1.slice(3).map((t) => t.kind === "phrase" ? "," : t.kind === "note" ? "n" : t.kind === "bar" ? "|" : t.kind).join(" "); }, bytes);
  check(back === (await kinds()), "存成 .mxl 再读：句号还在", `${back} vs ${await kinds()}`);
  const xml = await p.evaluate((arr) => window.__moonsinger.zipText(new Uint8Array(arr), ".moonsinger/papers/p1.musicxml"), bytes);
  const sj = await p.evaluate((arr) => window.__moonsinger.zipText(new Uint8Array(arr), ".moonsinger/score.json"), bytes);
  check(!/breath-mark/.test(xml) && /"phrases"/.test(sj), "句号不进 MusicXML，在 score.json 里");
  // pad 符号层：点「符」翻页、点「句号」插一个、自动翻回音键
  await p.click("#score", { position: { x: 300, y: 300 } }); await p.keyboard.press("End"); await p.waitForTimeout(100);   // 点谱 = pad 弹出来（歌词框收起时 pad 是藏着的）
  await p.click(".pad-tools [data-symbols]"); await p.waitForTimeout(100);
  check(await p.$(".pad-grid.symbols [data-sym=\"phrase\"]") != null, "pad 翻到符号层");
  await p.click(".pad-grid.symbols [data-sym=\"phrase\"]"); await p.waitForTimeout(150);
  check((await kinds()).endsWith(","), "符号层点「句号」= 插了一个", await kinds());
  check(await p.$(".pad-grid.symbols") == null, "插完翻回音键");
  // 纸：加第二张，隐藏它；本段视图默认 → 翻到它有说明；全部视图折叠
  await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(100);
  const p2 = await p.evaluate(() => window.__moonsinger.state().song.papers[1].id);
  await p.evaluate((id) => window.__moonsinger.setPaperHidden(id, true), p2); await p.waitForTimeout(100);
  check(/这张纸隐藏着/.test(await p.textContent("#score")), "本段视图进了隐藏的纸：顶上一行说明");
  await p.evaluate(() => window.__moonsinger.setScope("all")); await p.waitForTimeout(150);
  const txt = await p.textContent("#score");
  check(/隐藏 · 不放/.test(txt), "全部视图：隐藏的纸折叠成一条", "");
  const nSys = await p.evaluate(() => window.__moonsinger.layout().systems.filter((s) => s.paper === window.__moonsinger.state().song.papers[1].id).length);
  check(nSys === 0, "折叠的纸不画谱行", String(nSys));
  // 压平（播放 / 压平件）跳过隐藏的纸
  const flatLen = await p.evaluate(() => { const m = window.__moonsinger; return m.flatten().tokens.length; });
  const p1Len = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.length);
  check(flatLen === p1Len, "压平跳过隐藏的纸", `${flatLen} vs ${p1Len}`);
  // 连续 vs 分页：行宽（间距数）一样、每一行从哪个音到哪个音一样（边距不一样：连续 = 一圈窄边，分页 = 纸的真边距；屏幕上的像素可以不一样大——
  //   2026-10-08 Opus 5.5 改：user「非分页显示…能不能把页边距省了…但是行宽必须严格一样」，原来比像素宽度）
  await p.evaluate(() => {   // 一首 24 小节、带歌词的歌（八分 / 四分交替），排出好几行
    const N = (s, o, d, ty) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>${d}</duration><type>${ty}</type><lyric><syllabic>single</syllabic><text>啦</text></lyric></note>`, S = "CDEFGAB";
    let ms = "";
    for (let k = 0; k < 24; k++) { let body = k ? "" : `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
      for (let j = 0; j < (k % 3 ? 4 : 8); j++) body += k % 3 ? N(S[(k + j) % 7], 4, 2, "quarter") : N(S[(k + j) % 7], 5, 1, "eighth"); ms += `<measure number="${k + 1}">${body}</measure>`; }
    const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Vocals</part-name></score-part></part-list><part id="P1">${ms}</part></score-partwise>`;
    const m = window.__moonsinger; m.setPages(false); m.load(m.open("lines.musicxml", new TextEncoder().encode(xml)));
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__moonsinger.setScope("segment")); await p.waitForTimeout(100);
  const geo = () => p.evaluate(() => { const L = window.__moonsinger.layout(), rows = {}; for (const n of L.notes) (rows[n.system] ??= []).push(n.index); return { w: L.width / L.sp, left: L.pageX.left / L.sp, rows: Object.values(rows).map((r) => `${Math.min(...r)}-${Math.max(...r)}`).join(",") }; });
  const g1 = await geo();
  await p.evaluate(() => window.__moonsinger.setPages(true)); await p.waitForTimeout(150);
  const g2 = await geo();
  check(Math.abs(g1.w - g2.w) < 1e-9, "连续和分页的行宽（间距数）一样", `${g1.w} vs ${g2.w}`);
  check(g1.rows.split(",").length >= 4 && g1.rows === g2.rows, "连续和分页每一行的音一样（好几行）", `${g1.rows} / ${g2.rows}`);
  check(g1.left < g2.left, "连续的边距比纸边距窄", `${g1.left} vs ${g2.left}`);
  await p.evaluate(() => window.__moonsinger.setPages(false));
  check(errs.length === 0, "零页面错误", errs.join(" | ").slice(0, 200));
} finally { await b.close(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
