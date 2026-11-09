#!/usr/bin/env node
// scripts/render-video.mjs —— 带谱视频：一首 .mxl → mp4（谱面占满画面、播放线跟着声音走），不用在 iPad 上录屏。created 2026-11-09 by Claude Opus 5.5
//   user 2026-11-09「你能不能有一个系统的方法帮我做带谱子的视频而不依赖我在ipad上面录」「因为是headless了，所以可以全屏五线谱」「用新的app的排版录」。
// 怎么做（三步，都不另写一套谱 / 播放线）：
//   ① 声音 + 逐格位置：scripts/render-song.mjs（和 app 同一个发声核心）渲出 wav，同时写出每一格播放线在哪（--frames；第 k 格 = 声音的第 k/fps 秒）。
//   ② 画面：无头浏览器开 app 本身（npm run build && npm run serve），「听」模式、全部曲段、连续排法，谱面占满整个画面；
//      每格把播放线交给 app 画（__moonsinger.playheadAt = 播放时每帧走的同一个 ScoreView.setPlayhead），画面和上一格一样就不重截。
//      翻谱：app 照常决定滚不滚、滚到哪（followPlay / turnTo 调 scrollTo smooth）；这里只把那一下平滑滚动按格画出来（浏览器自己的平滑滚动跟不上逐格截图）。
//   ③ 拼：ffmpeg 按每张图停多少秒拼起来 + ① 的声音 → mp4（H.264 + AAC）。
// 用法：
//   npm run build && npm run serve        （另开一个终端；或 PORT=… BIND=127.0.0.1 bash scripts/serve.sh）
//   node scripts/render-video.mjs 歌.mxl [--out=歌.mp4] [--size=1920x1080] [--fps=30] [--lead=0.6] [--zoom=1] [--locale=en-US] [--theme=light|dark] [--base=http://127.0.0.1:8710/] [--keep=目录]
//   --lead = 提前翻谱的秒数（app 默认 0.6）；--zoom = 谱面缩放（>1 = 谱大一点、一屏行数少）；--keep = 中间产物（声音、逐格位置、截图）留在这个目录。
//   --until=秒 = 只出前这么多秒（看样子用）。--piper= / --sounds= 原样交给 render-song.mjs。
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process"; import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2), opt = (k, d = null) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = argv.find((a) => !a.startsWith("--"));
if (!file) { console.error("用法：node scripts/render-video.mjs 歌.mxl [--out=x.mp4] [--size=1920x1080] [--fps=30] [--lead=0.6] [--zoom=1] [--locale=en-US] [--theme=light] [--base=http://127.0.0.1:8710/] [--keep=目录]"); process.exit(2); }
const say = (m) => process.stderr.write(`[video] ${m}\n`);
const out = path.resolve(opt("out") ?? `${file.replace(/\.(mxl|musicxml|xml)$/i, "")}.mp4`);
const [W, H] = opt("size", "1920x1080").split("x").map(Number), fps = Number(opt("fps", "30")), lead = opt("lead", "0.6"), zoom = Number(opt("zoom", "1"));
const base = opt("base", "http://127.0.0.1:8710/"), locale = opt("locale", "en-US"), theme = opt("theme", "light");
const keep = opt("keep"), work = keep ? path.resolve(keep) : fs.mkdtempSync(path.join(os.tmpdir(), "moonsinger-video-"));
fs.mkdirSync(path.join(work, "shots"), { recursive: true });
const t0 = performance.now(), secs = () => ((performance.now() - t0) / 1000).toFixed(1);

// ── ① 声音 + 逐格位置 ──
const wav = path.join(work, "audio.wav"), framesJson = path.join(work, "frames.json");
const pass = argv.filter((a) => a.startsWith("--piper=") || a.startsWith("--sounds="));
say("渲声音…");
const rs = spawnSync(process.execPath, [path.join(ROOT, "scripts/render-song.mjs"), path.resolve(file), `--out=${wav}`, `--frames=${framesJson}`, `--fps=${fps}`, `--lead=${lead}`, ...pass], { stdio: ["ignore", "inherit", "pipe"], encoding: "utf8" });
for (const l of (rs.stderr ?? "").split("\n")) if (l.startsWith("[render]") && !/混音… \d+%/.test(l)) process.stderr.write(l + "\n");
if (rs.status !== 0) { process.stderr.write(rs.stderr ?? ""); say("渲声音失败，没出视频"); process.exit(1); }
const F = JSON.parse(fs.readFileSync(framesJson, "utf8"));
const until = opt("until"); if (until) { F.frames = F.frames.slice(0, Math.round(Number(until) * fps)); F.secs = F.frames.length / fps; }   // 只出前 N 秒（看样子用）
say(`声音 ${F.secs.toFixed(1)} s · ${F.frames.length} 格（${secs()} s）`);

// ── ② 画面 ──
const { chromium } = await import("../test/e2e/pw.mjs");
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale, colorScheme: theme === "dark" ? "dark" : "light" })).newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(base); await p.waitForTimeout(800);
const bytes = fs.readFileSync(file);
await p.evaluate(([name, arr]) => { const m = window.__moonsinger; m.load(m.open(name, new Uint8Array(arr))); }, [path.basename(file), Array.from(bytes)]);
await p.waitForTimeout(600);
await p.evaluate(() => { const m = window.__moonsinger; m.setMode("listen"); m.setScope?.("all"); m.setPages?.(false); m.setScroll?.(false);
  const st = m.state(); m.set({ ...st, caret: 0, sel: null, lead: undefined });   // 光标挪回开头：存档时光标停在全曲末尾 = 最后一行五线延到右边（给写的人留地方，印出来没有）
});
// 谱面占满画面 = 印出来的谱 + 播放线：
//   顶栏藏掉；覆盖层（编辑器的钮 / 曲段切换 / 空着的占位提示，src/ui/score-overlay.ts）藏掉；缩放读数钮藏掉；
//   排版器打了 ann 的「只给写谱人看的披露」藏掉——和 PDF 不印的是同一张名单（src/export/score-pdf.ts SKIP）；
//   动画关掉（小节底色的「闪一下」是按时间走的，逐格截不到）
await p.addStyleTag({ content: `
  #bar, .zoom-reset, .ov-i, .ov-nav, .ov-placeholder, .ov-stub, #score .ann { display: none !important; }
  #score { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483000 !important; overflow: hidden !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
` });
await p.evaluate(() => window.dispatchEvent(new Event("resize")));
await p.waitForTimeout(900);
// 缩放：纸宽撑满画面宽，但最高的那一行谱（一行所有声部）放在翻谱的落点也要整行看得见；--zoom 再乘在上面
const Z = await p.evaluate((userZoom) => {
  const m = window.__moonsinger, sheet = document.querySelector("#score .sheet"), mul0 = Number(sheet.style.zoom || 1), rw = sheet.getBoundingClientRect().width;
  const L = m.layout(), g = new Map();
  for (const r of L.systems) { const k = `${r.paper}:${r.sys}`, v = g.get(k) ?? [Infinity, -Infinity]; v[0] = Math.min(v[0], r.inkTop ?? r.top); v[1] = Math.max(v[1], r.inkBottom ?? r.bottom); g.set(k, v); }
  const maxH = Math.max(...[...g.values()].map(([a, b]) => b - a)) * mul0, byW = (innerWidth * 0.985) / rw, byH = (innerHeight * 0.75) / maxH;   // 0.75 = app 翻谱把正在放的那一行放在上沿 20%（score-view followPlay）、下沿要在 95% 以内——最高的一行在那个落点也要整行看得见（v1 用 0.9：1080 高刚好够，接了品牌条只剩 968 高就切掉最下面那条谱；user 11-09「滚动错了，被banner遮住了」）
  const r = Math.min(byW, byH) * userZoom, phys = m.zoomInfo().phys * r;
  m.zoomTo(phys);
  document.querySelector("#score").style.background = getComputedStyle(sheet).backgroundColor;   // 纸两边露出来的那一窄条也是纸色（不露 app 的桌面色）
  return { phys, byW, byH, rows: g.size };
}, zoom);
await p.waitForTimeout(600);
say(`缩放 ${Math.round(Z.phys * 100)}%（按宽 ×${Z.byW.toFixed(2)}、按最高一行 ×${Z.byH.toFixed(2)}，取小的${zoom !== 1 ? `，再 ×${zoom}` : ""}；${Z.rows} 行谱）`);
// 翻谱：接住 app 的平滑滚动，按格画
await p.evaluate(() => {
  const el = document.querySelector("#score"), orig = el.scrollTo.bind(el);
  const S = (window.__vid = { anim: null });
  el.scrollTo = (o, y) => {
    if (typeof o !== "object") return orig(o, y);
    if (o.behavior === "smooth") { S.anim = { top0: el.scrollTop, left0: el.scrollLeft, top1: o.top ?? el.scrollTop, left1: o.left ?? el.scrollLeft, k: 0 }; return; }
    S.anim = null; orig({ ...o, behavior: "instant" });
  };
  el.scrollTop = 0; el.scrollLeft = 0;
});
const ANIM = Math.max(1, Math.round(0.35 * fps));   // 一次平滑翻谱画几格（≈ 浏览器平滑滚动的时长）
const step = (fr) => p.evaluate(([fr, ANIM]) => {
  const m = window.__moonsinger, S = window.__vid, el = document.querySelector("#score");
  m.playheadAt(fr ? fr.p : null, fr ? fr.a : null);
  // 编辑器标「光标在哪」的颜色摘掉（光标那个音 cur、光标所在声部的名字 focus、点开的记号管的音 in-span、指着的 hot），回到印出来的墨色
  for (const d of el.querySelectorAll(".staff-svg .cur, .staff-svg .part-name.focus, .staff-svg .in-span, .staff-svg .hot")) d.classList.remove("cur", "focus", "in-span", "hot");
  if (S.anim) {
    const a = S.anim, t = Math.min(1, ++a.k / ANIM), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    el.scrollTop = a.top0 + (a.top1 - a.top0) * e; el.scrollLeft = a.left0 + (a.left1 - a.left0) * e;
    if (t >= 1) S.anim = null;
  }
  return `${Math.round(el.scrollTop)},${Math.round(el.scrollLeft)}|` + [...el.querySelectorAll(".playhead,.play-hl,.play-bar")].map((d) => d.className + d.style.cssText).join("|");
}, [fr, ANIM]);
const shots = []; let last = null;
for (let k = 0; k < F.frames.length; k++) {
  const sig = await step(F.frames[k]);
  if (sig !== last) { last = sig; const f = path.join(work, "shots", `${String(shots.length).padStart(5, "0")}.png`); await p.screenshot({ path: f }); shots.push({ f, k }); }
  if (k % (fps * 10) === 0) say(`画面 ${(k / fps).toFixed(0)} / ${F.secs.toFixed(0)} s · ${shots.length} 张（${secs()} s）`);
}
await b.close();
if (errs.length) say(`页面报错：${errs.join(" | ")}`);
say(`画面 ${shots.length} 张（${secs()} s）`);

// ── ③ 拼 ──
const list = path.join(work, "shots.txt"), n = F.frames.length;
const lines = ["ffconcat version 1.0"];
shots.forEach((s, i) => { const k1 = i + 1 < shots.length ? shots[i + 1].k : n; lines.push(`file '${s.f.replace(/'/g, "'\\''")}'`, `duration ${((k1 - s.k) / fps).toFixed(6)}`); });
lines.push(`file '${shots[shots.length - 1].f.replace(/'/g, "'\\''")}'`);   // concat 的老规矩：最后一张再写一次，不然最后的 duration 不算
fs.writeFileSync(list, lines.join("\n") + "\n");
const ff = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-i", wav,
  "-map", "0:v", "-map", "1:a", "-r", String(fps), "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "stillimage",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",   // PNG 是 RGB：显式按 bt709 转、打标记（不写 = ffmpeg 拿 bt601 矩阵转，颜色偏）
  "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], { stdio: "inherit" });
if (ff.status !== 0) { say("ffmpeg 失败"); process.exit(1); }
if (!keep) fs.rmSync(work, { recursive: true, force: true });
say(`写好了：${out}（${(fs.statSync(out).size / 1e6).toFixed(1)} MB · ${secs()} s）`);
