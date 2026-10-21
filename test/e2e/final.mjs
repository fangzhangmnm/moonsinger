// test/e2e/final.mjs —— 真浏览器 E2E：定稿 / 改稿（W-38；user 2026-10-13「写好了之后加锁，会渲染mp3，之后只能听，不能修改…gallery可以试听mp3不用开app」「定稿改稿同意」；
//   2026-10-16「定稿的时候得从多个窄接口上护栏住写入，甚至store级别」）。
//   歌库里新建 → 写几个音（小月相在测试里 = 静音块）→ ☰「定稿…」面板 → 定稿 → 四层护栏：① 模式钉在「听」、顶栏「定稿 1」② 打字 / 撤销 / 混音不动谱 ③ 歌名能改、封面能改
//   ④ 自动存进歌库的字节里有 final.mp3 + manifest.final → 回歌库：封面上 ▶ 亮、点了放（不打开那首）→ 改稿 → 能写了、下次存没有 mp3。
//   反证：把 main.ts update() 里 finalOn 那一行删掉 = 「打字不动谱」红；把 saveMxl 的指纹检查删掉 + 把 update 的护栏删掉 = 存出去的字节里 final 和谱对不上（这里核的是指纹对得上）。
// created 2026-10-16 by Claude Fable 5.1
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const title = () => p.textContent("#docTitle");
const saved = async () => { for (let i = 0; i < 80 && /•/.test((await title()) ?? ""); i++) await p.waitForTimeout(100); };
const notes = () => p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks[window.__moonsinger.state().at.part].filter((t) => t.kind === "note").map((t) => t.pitch.step).join(""));
const toasts = () => p.$$eval(".notice-stack .toast, .notice, [role=alert]", (es) => es.map((e) => e.textContent ?? ""));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(600);
// 进歌库、新建、写三个音（首笔安家）；小月相在测试里 = 静音块（同 transport.mjs）
await p.click("#libBtn"); await p.waitForTimeout(600);
await p.click('#galleryFull [data-v="new"]'); await p.click('#galleryFull [data-v="new-song"]'); await p.waitForTimeout(500);
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 2).fill(0.02), sr: 22050 }); });
await p.click("#score", { position: { x: 600, y: 200 } });
for (const k of ["Digit1", "Digit3", "Digit5"]) { await p.keyboard.press(k); await p.waitForTimeout(40); }
await p.waitForFunction(() => !!window.__moonsinger.identifier()); await saved();
const id = await p.evaluate(() => window.__moonsinger.identifier());
check(/\.mxl$/.test(id ?? "") && (await notes()) === "CEG", "歌库里新建 + 写了三个音", `${id} ${await notes()}`);
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(); m.set({ ...st, song: { ...st.song, title: "定稿前的名字" } }); }); await saved();
check((await p.evaluate(() => window.__moonsinger.final())) === null, "还没定稿");
// ☰ → 定稿… 面板 → 定稿
await p.click("#setBtn"); await p.waitForTimeout(150);
check(!!(await p.$('.main-menu [data-v="final"]')) && !(await p.$('.main-menu [data-v="unfinal"]')), "三条杠里有「定稿…」、没有「改稿」");
await p.click('.main-menu [data-v="final"]'); await p.waitForTimeout(200);
check(/定稿/.test(await p.$eval(".offer .offer-title", (e) => e.textContent ?? "")) && !!(await p.$('.offer [data-v="q:standard"]')), "定稿面板：音质 + 说明");
await p.click('.offer [data-v="go"]');
await p.waitForFunction(() => !!window.__moonsinger.final(), null, { timeout: 30000 });
const rec = await p.evaluate(() => window.__moonsinger.final());
check(rec.rev === 1 && rec.mp3.bytes > 1000 && rec.mp3.path === ".moonsinger/final.mp3" && rec.parts.length === 1 && typeof rec.core.hash === "string" && rec.fingerprint.length === 64, "定稿记录：第 1 版、mp3 字节、核心哈希、指纹", JSON.stringify({ rev: rec.rev, bytes: rec.mp3.bytes, core: rec.core, parts: rec.parts }));
check(rec.core.hash !== "dev" && /^[0-9a-f]{16}$/.test(rec.core.hash), "构建进去的核心哈希（不是 dev）", rec.core.hash);
check((await p.evaluate(() => window.__moonsinger.finalMp3()?.length)) === rec.mp3.bytes, "mp3 字节在 extras 里");
// ① 界面：模式钉在「听」、顶栏角标
check((await p.evaluate(() => window.__moonsinger.workspace().mode)) === "listen", "定稿 = 听模式");
check((await p.$eval("#fileBtn .final-badge", (e) => e.textContent ?? "")) === "定稿 1", "顶栏「定稿 1」");
check(await p.evaluate(() => document.body.classList.contains("doc-final")), "body.doc-final");
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(100);
check((await p.evaluate(() => window.__moonsinger.workspace().mode)) === "listen" && (await toasts()).some((t) => /定稿/.test(t)), "切到「音」被拒 + 说一句");
// ② 状态入口：打字 / 撤销 / 混音 / 歌手都不动
await p.keyboard.press("Escape"); await p.waitForTimeout(80); await p.keyboard.press("Digit2"); await p.waitForTimeout(80);
check((await notes()) === "CEG", "Esc 回不到写、打字不写谱（听模式本来就拦）");
const before = await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song.papers[0].tracks));
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(), pid = st.at.part, a = st.song.papers[0]; m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: a.tracks[pid].slice(0, -1) } }] } }); });
await p.waitForTimeout(100);
check((await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song.papers[0].tracks))) === before, "绕过键盘直接 set 删音 = 被 update() 拒绝（第 ② 层）");
await p.evaluate(() => window.__moonsinger.undo?.()); await p.keyboard.press("Control+z"); await p.waitForTimeout(100);
check((await notes()) === "CEG", "撤销被拒");
const gainBefore = await p.evaluate(() => JSON.stringify(window.__moonsinger.extras().studio));
await p.evaluate(() => window.__moonsinger.setMasterGain?.(-9) ?? window.__moonsinger.setMaster({ gainDb: -9 })); await p.waitForTimeout(100);
check((await p.evaluate(() => JSON.stringify(window.__moonsinger.extras().studio))) === gainBefore, "改总轨增益被拒（混音锁着）");
await p.evaluate(() => window.__moonsinger.setChunk("whole")); await p.waitForTimeout(100);
check((await p.evaluate(() => JSON.stringify(window.__moonsinger.extras().lounge))).indexOf('"whole"') < 0, "改歌手属性（分段唱）被拒");
check((await p.evaluate(() => window.__moonsinger.final())) !== null, "拒了几次之后还是定稿着");
// ③ 全冻（user 10-16「都冻同意，封面当然进」）：歌名也改不了；存的 mp3 带着 ID3 标签
await p.evaluate(() => { const m = window.__moonsinger, st = m.state(); m.set({ ...st, song: { ...st.song, title: "定稿的歌" } }); });
await p.waitForTimeout(100);
check((await p.evaluate(() => window.__moonsinger.state().song.title)) !== "定稿的歌" && (await p.evaluate(() => window.__moonsinger.final())) !== null, "歌名被拒（全冻）、定稿还在");
check((await p.evaluate(() => { const b = window.__moonsinger.finalMp3(); return b && String.fromCharCode(b[0], b[1], b[2]); })) === "ID3", "存的 mp3 带着 ID3 标签（发行的那一份）");
// 真 LAME（v0.13.2）：ID3 后面第一个帧头 = 联合立体声、192k、44.1k（编码器在 worker 里从 vendor/lame 载——这条守的是浏览器那条路真走通了，不只是 node 单元测试）
{ const h = await p.evaluate(() => { const b = window.__moonsinger.finalMp3(); if (!b) return null; let i = 10 + (((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f)); while (i < b.length - 4 && !(b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0)) i++; return { mode: ["stereo", "joint", "dual", "mono"][(b[i + 3] >> 6) & 3], kbps: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][(b[i + 2] >> 4) & 15], sr: [44100, 48000, 32000][(b[i + 2] >> 2) & 3] }; });
  check(h && h.mode === "joint" && h.kbps === 192 && h.sr === 44100, "定稿的 mp3 = 真 LAME 编的联合立体声 192k 44.1k（标准档）", JSON.stringify(h)); }
await saved();
check(!/•/.test(await title()), "定稿后照样自动存（没被第 ④ 层拦）", await title());
// ④ 存出去的字节：有 final.mp3 entry、manifest.final、指纹对得上（开回来还是定稿的）
const saved1 = await p.evaluate(async (id) => { const m = window.__moonsinger, bl = await m.store().zip(id, { mode: "existing" }).open(); const bytes = new Uint8Array(await bl.arrayBuffer()); const o = m.open("x.mxl", bytes); return { list: m.zipList(bytes), manifest: JSON.parse(m.zipText(bytes, ".moonsinger/manifest.json")), final: o.extras.final, mp3: o.extras.finalMp3?.length ?? 0, notices: o.notices }; }, id);
check(saved1.list.includes(".moonsinger/final.mp3") && saved1.list.indexOf(".moonsinger/final.mp3") < saved1.list.indexOf(".moonsinger/manifest.json"), "存出去的 zip 里有 final.mp3（排在总目录前面）", saved1.list.join(","));
check(saved1.manifest.final?.rev === 1 && saved1.manifest.finalRev === 1 && typeof saved1.manifest.core?.hash === "string", "manifest.final / finalRev / core", JSON.stringify(saved1.manifest.final?.core));
check(!!saved1.final && saved1.mp3 === rec.mp3.bytes && saved1.notices.length === 0, "开回来：定稿记录在、指纹对得上、mp3 字节在", saved1.notices.join(" | "));
// 导出 mp3 = 定稿的那一份（面板不再有音质）
await p.click("#setBtn"); await p.waitForTimeout(120); await p.click('.main-menu [data-v="export"]'); await p.waitForTimeout(150); await p.click('.offer [data-v="mp3"]'); await p.waitForTimeout(150);
check(!(await p.$('.offer [data-v="q:standard"]')) && /定稿的那一份/.test(await p.$eval(".offer", (e) => e.textContent ?? "")), "导出面板：定稿的那一份，不重渲");
await p.click('.offer [data-v="close"]'); await p.waitForTimeout(100);
// 歌库：封面上 ▶ 亮、点了放（不打开那首）
await p.click("#libBtn"); await p.waitForTimeout(800);
const actionSel = `.gallery-tile:has(.gallery-tile-name[title="${id}"]) .gallery-tile-action.ready`;   // 图库包 0.8.0：ui.tileAction 画的钮（事实到了才有）
await p.waitForSelector(actionSel, { timeout: 8000 }).catch(() => null);
check(!!(await p.$(actionSel)), "歌库卡片：定稿的封面上 ▶ 亮着（包的动作钮）");
const tileSel = `.gallery-tile:has(.gallery-tile-name[title="${id}"])`;
const actIcon = () => p.$eval(actionSel, (e) => e.querySelector("use")?.getAttribute("href") ?? "");
check((await p.$eval(`${tileSel} .ms-cover-final`, (e) => e.textContent).catch(() => null)) === "定稿 1", "封面底栏印「定稿 1」");
await p.click(actionSel); await p.waitForTimeout(900);
check(!(await p.evaluate(() => document.getElementById("galleryFull").hidden)), "点 ▶ 没有打开那首（还在歌库）");
check(!(await p.$eval(".ms-player", (e) => e.hidden)) && /定稿 1/.test(await p.$eval(".ms-player-title", (e) => e.textContent ?? "")), "底边出了播放条（歌名 · 定稿 1）");
const playingId = await p.evaluate(() => window.__moonsinger.gallery()?.playing());
check(playingId === id || (await p.evaluate(() => !document.querySelector(".ms-player").hidden)), "在放这首（或至少装进了播放器）", `playing=${playingId}`);
// 锁屏（系统媒体控件，src/app/song-player.ts）：开始放了才登记；歌名 / 图 / 在放报给系统；循环钮在播放条上
const msNow = () => p.evaluate(() => ({ title: navigator.mediaSession.metadata?.title ?? null, art: navigator.mediaSession.metadata?.artwork?.length ?? 0, state: navigator.mediaSession.playbackState }));
const stem = id.replace(/^.*\//, "").replace(/\.mxl$/, "");
if (playingId === id) { const m = await msNow(); check(m.title === stem && m.art > 0 && m.state === "playing", "锁屏控件：歌名 / 图 / 在放", JSON.stringify(m)); check((await actIcon()) === "#pause", "放着：卡片上的 ▶ 变成 ⏸", await actIcon()); }
else console.log("  · 这个浏览器没放出声（无头）：锁屏控件那一条跳过");
check((await p.$eval(".ms-player-loop", (e) => e.getAttribute("aria-pressed"))) === "false", "循环钮：默认关");
await p.click('.ms-player [data-p="loop"]'); await p.waitForTimeout(60);
check((await p.evaluate(() => window.__moonsinger.gallery().playerState().loop)) && (await p.$eval(".ms-player-loop", (e) => e.getAttribute("aria-pressed"))) === "true", "点「循环」= 开（播放器跟着、钮上看得出）");
// 从头放（user 2026-10-17「gallery播放没有从头再来的功能，我有时候想从头听」）：|▶ 在播放条最左
check(/从头放/.test(await p.$eval('.ms-player [data-p="restart"]', (e) => e.title)), "播放条有「从头放」钮");
await p.waitForTimeout(600); await p.click('.ms-player [data-p="restart"]'); await p.waitForTimeout(80);
{ const ps = await p.evaluate(() => window.__moonsinger.gallery().playerState()); check(ps.key === id && ps.time < 0.4, "点「从头放」= 回到开头、还装着这首", JSON.stringify(ps)); }
await p.click('.ms-player [data-p="close"]'); await p.waitForTimeout(100);
check(await p.$eval(".ms-player", (e) => e.hidden), "✕ = 停、播放条收起");
check((await actIcon()) === "#play", "停了：卡片上变回 ▶", await actIcon());
{ const m = await msNow(); check(m.title === null && m.state === "none", "停了 = 锁屏控件收走", JSON.stringify(m)); }
// 打开那首 → 改稿 → 能写了；存出去没有 mp3
await p.click(`.gallery-tile:not(.folder) >> nth=0`); await p.waitForTimeout(600);
check((await p.evaluate(() => window.__moonsinger.identifier())) === id && (await p.evaluate(() => window.__moonsinger.workspace().mode)) === "listen", "打开定稿的歌 = 听模式");
await p.click("#setBtn"); await p.waitForTimeout(120);
check(!!(await p.$('.main-menu [data-v="unfinal"]')), "三条杠里是「改稿…」");
await p.click('.main-menu [data-v="unfinal"]'); await p.waitForTimeout(150);
check(/改稿/.test(await p.$eval(".offer .offer-title", (e) => e.textContent ?? "")), "改稿先问一句");
await p.click('.offer [data-v="ok"]'); await p.waitForTimeout(200);
check((await p.evaluate(() => window.__moonsinger.final())) === null && (await p.evaluate(() => window.__moonsinger.workspace().mode)) !== "listen" && !(await p.$("#fileBtn .final-badge")), "改稿 = 记录没了、回到写、角标没了");
await p.click("#score", { position: { x: 600, y: 200 } }); await p.keyboard.press("End"); await p.keyboard.press("Digit2"); await p.waitForTimeout(100);
check((await notes()) === "CEGD", "改稿后能写了", await notes());
await saved();
const saved2 = await p.evaluate(async (id) => { const m = window.__moonsinger, bl = await m.store().zip(id, { mode: "existing" }).open(); const bytes = new Uint8Array(await bl.arrayBuffer()); return { list: m.zipList(bytes), manifest: JSON.parse(m.zipText(bytes, ".moonsinger/manifest.json")) }; }, id);
check(!saved2.list.includes(".moonsinger/final.mp3") && saved2.manifest.final === undefined && saved2.manifest.finalRev === 1, "改稿后存出去：没有 mp3 entry、没有 final、finalRev 留着 1", saved2.list.join(","));
// 再定稿 = 第 2 版
await p.evaluate(() => window.__moonsinger.finalize("small")); await p.waitForFunction(() => window.__moonsinger.final()?.rev === 2, null, { timeout: 30000 });
const rec2 = await p.evaluate(() => window.__moonsinger.final());
check(rec2.rev === 2 && rec2.mp3.stereo === false && rec2.mp3.kbps === 64 && rec2.fingerprint !== rec.fingerprint, "再定稿 = 第 2 版（小文件；谱变了指纹也变了）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nfinal: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
