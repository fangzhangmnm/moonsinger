// test/e2e/link-open.mjs —— 真浏览器 E2E：从链接打开（`?file=<链接>`，src/sources/link.ts + main.ts openFromLink）。created 2026-11-11 by Claude Opus 5.5
//   user 11-11「先支持裸链接。能支持几家就几家」。网盘用 Playwright 拦截冒充（不连外网）：回的头里带不带放行跨站读，和真网盘量出来的一样。
//   守的事：没点「打开」之前一个请求都不发；地址栏的 file= 当场拿掉；Dropbox 分享页换成直链（分享页本身一次都不碰）；GitHub 页面换成原始文件；
//   Google Drive 不去请求、说清楚；拿回网页 / 对方不放行 / 点「算了」= 说清楚或什么都不做，原来开着的歌不动。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/link-open.mjs
import { readFileSync } from "node:fs";
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const MXL = readFileSync(new URL("../fixtures/format/v2-2-2-2/sample.mxl", import.meta.url));
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0"><work><work-title>Link Tune</work-title></work><part-list><score-part id="P1"><part-name>Voice</part-name></score-part></part-list>
<part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
<note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><type>half</type></note></measure></part></score-partwise>`;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
const hits = [];   // 冒充的网站收到的每一个请求
const cors = { "access-control-allow-origin": "*" };
await ctx.route(/^https:\/\/(www\.dropbox\.com|github\.com|drive\.google\.com|docs\.google\.com)\//, (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><html>share page</html>" }); });
await ctx.route(/^https:\/\/dl\.dropboxusercontent\.com\//, (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, headers: cors, contentType: "application/octet-stream", body: MXL }); });
await ctx.route(/^https:\/\/raw\.githubusercontent\.com\//, (r) => { hits.push(r.request().url()); return r.fulfill({ status: 200, headers: cors, contentType: "text/plain", body: XML }); });
await ctx.route(/^https:\/\/songs\.example\//, (r) => {
  const u = r.request().url(); hits.push(u);
  if (u.endsWith("/page.mxl")) return r.fulfill({ status: 200, headers: cors, contentType: "text/html", body: "<!DOCTYPE html><html><body>not a file</body></html>" });
  if (u.endsWith("/nocors.mxl")) return r.abort("failed");   // 对方不放行跨站读：Playwright 冒充回文件时会自己补放行头，模拟不出来；对页面来说和断网是同一种失败（fetch 抛 TypeError），用它代
  if (u.endsWith("/gone.mxl")) return r.fulfill({ status: 404, headers: cors, body: "" });
  return r.fulfill({ status: 200, headers: cors, contentType: "application/octet-stream", body: MXL });
});

const open = async (link) => {
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  hits.length = 0;
  await p.goto(BASE + "?file=" + link); await p.waitForFunction(() => !!window.__moonsinger, null, { timeout: 20000 });
  return { p, errs };
};
const sheet = (p) => p.waitForSelector(".offer .offer-title:has-text('从链接打开这首歌？')", { timeout: 5000 }).then(() => true, () => false);
const toasts = (p) => p.$$eval(".notice-stack .toast, .notice, [role=alert]", (es) => es.map((e) => e.textContent ?? "").join(" | "));
const noteCount = (p) => p.evaluate(() => window.__moonsinger.state().song.papers.flatMap((pp) => Object.values(pp.tracks)).flat().filter((t) => t.kind === "note").length);
const title = (p) => p.evaluate(() => window.__moonsinger.state().song.title ?? "");

// 1. Dropbox 分享页链接（没编码、带自己的 & 参数）→ 问 → 打开 → 读的是直链
{
  const { p, errs } = await open("https://www.dropbox.com/scl/fi/abc123/Sample%20Song.mxl?rlkey=k1&dl=0");
  check(await sheet(p), "Dropbox：开机先问「从链接打开这首歌？」");
  const msg = await p.textContent(".offer .offer-msg");
  check(/Dropbox/.test(msg) && msg.includes("www.dropbox.com/scl/fi/abc123/Sample%20Song.mxl?rlkey=k1&dl=0"), "问的时候写着从哪个网站、原链接整条", msg.slice(0, 160));
  check(hits.length === 0, "没点「打开」之前一个请求都没发", hits.join(" "));
  check(!(await p.evaluate(() => location.search.includes("file="))), "地址栏里的 file= 已经拿掉（刷新不再问）", await p.evaluate(() => location.href));
  await p.click(".offer button[data-v='ok']");
  await p.waitForFunction(() => window.__moonsinger.state().song.title === "冻结样本", null, { timeout: 8000 }).catch(() => undefined);
  check((await title(p)) === "冻结样本" && (await noteCount(p)) > 0, "打开了链接里那首（冻结样本）", `${await title(p)} · ${await noteCount(p)} 个音`);
  check(hits.length === 1 && hits[0].startsWith("https://dl.dropboxusercontent.com/scl/fi/abc123/Sample%20Song.mxl?rlkey=k1") && !/[?&]dl=/.test(hits[0]), "只请求了一次，去的是 Dropbox 直链（rlkey 带着、dl 去掉）；分享页一次都没碰", hits.join(" "));
  check(/从 Dropbox 打开了/.test(await toasts(p)), "提示：从 Dropbox 打开了，是一份拷贝", await toasts(p));
  check(errs.length === 0, "没有报错", errs.join(" | "));
  await p.close();
}
// 2. GitHub 页面链接（编码过的）→ 原始文件；没压缩的 MusicXML 也认
{
  const { p } = await open(encodeURIComponent("https://github.com/someone/songs/blob/main/tunes/link-tune.musicxml"));
  check(await sheet(p), "GitHub：先问");
  await p.click(".offer button[data-v='ok']");
  await p.waitForFunction(() => window.__moonsinger.state().song.title === "Link Tune", null, { timeout: 8000 }).catch(() => undefined);
  check((await title(p)) === "Link Tune" && (await noteCount(p)) === 3, "打开了 GitHub 上那首（没压缩的 MusicXML，三个音）", `${await title(p)} · ${await noteCount(p)}`);
  check(hits.length === 1 && hits[0] === "https://raw.githubusercontent.com/someone/songs/main/tunes/link-tune.musicxml", "去的是 raw.githubusercontent.com", hits.join(" "));
  await p.close();
}
// 3. 点「算了」= 一个请求都不发、原来的歌不动
{
  const { p } = await open("https://songs.example/a.mxl");
  check(await sheet(p), "裸链接：先问");
  const before = await noteCount(p);
  await p.click(".offer button[data-v='no']"); await p.waitForTimeout(600);
  check(hits.length === 0 && (await noteCount(p)) === before, "点「算了」：一个请求都没发、开着的那首没变", hits.join(" "));
  await p.close();
}
// 4. Google Drive：不问、不请求、说清楚
{
  const { p } = await open("https://drive.google.com/file/d/abc/view?usp=sharing");
  await p.waitForTimeout(800);
  check(!(await sheet(p)) && hits.length === 0, "Google Drive：不问、一个请求都不发", hits.join(" "));
  check(/Google Drive 不让别的网页直接读/.test(await toasts(p)), "说清楚 Google Drive 读不了、换哪几家", await toasts(p));
  await p.close();
}
// 5. 拿回来的是网页 / 对方不放行跨站读 / 404 = 说清楚，原来的歌不动
for (const [file, want, name] of [["page.mxl", /给的是一个网页/, "拿回网页"], ["nocors.mxl", /不让别的网页读/, "对方不放行跨站读 / 断网"], ["gone.mxl", /不在了/, "404"]]) {
  const { p } = await open(`https://songs.example/${file}`);
  await sheet(p);
  const before = await noteCount(p);
  await p.click(".offer button[data-v='ok']"); await p.waitForTimeout(1200);
  check(want.test(await toasts(p)) && (await noteCount(p)) === before, `${name}：说清楚，开着的那首没变`, (await toasts(p)).slice(0, 160));
  await p.close();
}
// 6. 英文界面（系统语言 en-US）：问的那一面是英文
{
  const ectx = await b.newContext({ viewport: { width: 1200, height: 800 }, locale: "en-US" });
  await ectx.route(/^https:\/\/songs\.example\//, (r) => r.fulfill({ status: 200, headers: cors, contentType: "application/octet-stream", body: MXL }));
  const p = await ectx.newPage();
  await p.goto(BASE + "?file=https://songs.example/a.mxl"); await p.waitForFunction(() => !!window.__moonsinger, null, { timeout: 20000 });
  check(await p.waitForSelector(".offer .offer-title:has-text('Open this song from a link?')", { timeout: 5000 }).then(() => true, () => false), "英文界面：问的那一面是英文");
  await p.click(".offer button[data-v='ok']");
  await p.waitForFunction(() => window.__moonsinger.state().song.title === "冻结样本", null, { timeout: 8000 }).catch(() => undefined);
  check(/Opened a\.mxl from songs\.example/.test(await toasts(p)), "英文界面：打开后的提示是英文", await toasts(p));
  await ectx.close();
}

await b.close();
console.log(`\nlink-open: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
