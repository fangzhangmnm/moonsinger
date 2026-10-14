// test/e2e/issues.mjs —— 真浏览器 E2E：不出声的声部 = 一套机制、四个出口（ADR-0004 §2.2½；user 2026-10-14「一套机制、四个出口 同意」）。
//   别家的谱（没人上场）开进来 → ① 谱上那位名字下面「不出声」角标 ② |▶ 左上角数字「1」，点它 = 开清单（不是放）、清单里的钮去乐器页 ③ 开歌那一刻一条 toast，
//   之后按播放再多少次都不再重复那句（清单没变）④ 导出面板里一行红字 + 主按钮写「照样导出」（不拦）。新歌（小月相上场）= 什么都没有。
//   反证：把 main.ts 里 refreshIssues() 的调用都删掉 = 角标 / toast 两条红；把 openMp3Panel 里那一行删掉 = 出口 ④ 两条红。
// created 2026-10-14 by Claude Fable 5.1
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
let lastPlayTap = 0;
const tapPlay = async () => { const w = 500 - (Date.now() - lastPlayTap); if (w > 0) await p.waitForTimeout(w); await p.click("#playBtn"); lastPlayTap = Date.now(); };
const toasts = () => p.$$eval(".notice-stack .toast, .notice, [role=alert]", (es) => es.map((e) => e.textContent ?? ""));
const badge = () => p.$eval("#playBtn", (e) => e.querySelector(".issues-badge")?.textContent ?? "");
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 新歌 = 小月相上场：写两个音，什么角标都没有
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, a = st.song.papers[0]; let id = 7100;
  const n = (step) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 4 }, dur: 1680, lyric: "ら" });
  m.set({ ...st, song: { ...st.song, papers: [{ ...a, tracks: { [pid]: [...a.tracks[pid].slice(0, 3), n("C"), n("D")] } }] } });
});
await p.waitForTimeout(300);
check((await badge()) === "" && !(await toasts()).some((t) => t.includes("不出声")), "新歌（小月相上场）：没有角标、没有 toast");
// 别家的谱开进来：没人上场
const N = (step, oct, ly) => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>1</duration><type>quarter</type><lyric><syllabic>single</syllabic><text>${ly}</text></lyric></note>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Guest</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("E", 4, "さ")}${N("F", 4, "し")}${N("G", 4, "す")}${N("A", 4, "せ")}</measure></part></score-partwise>`;
await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("guest.musicxml", new TextEncoder().encode(xml))); }, XML);
await p.waitForTimeout(600);
const t1 = (await toasts()).filter((t) => t.includes("不出声"));
check(t1.length === 1 && /角上的数字/.test(t1[0]), "开歌那一刻：一条 toast（出口 ③）", JSON.stringify(t1).slice(0, 160));
check((await badge()) === "1", "|▶ 左上角「1」（出口 ②）", `badge=${await badge()}`);
check((await p.$$eval(".staff-svg .part-badge", (es) => es.map((e) => e.textContent ?? ""))).some((t) => t.includes("不出声")), "谱上名字下面「不出声」（出口 ①）");
// 按播放两次：清单没变 = 那句不再重复（原来每按一次弹一次）；一个都放不了 = 「没有出声」那句照样说
await tapPlay(); await p.waitForTimeout(700); await tapPlay(); await p.waitForTimeout(700);
const said = (await p.evaluate(() => window.__moonsinger.diagText())).split("角上的数字").length - 1;   // 红 toast 同一个槽会被后来的「没有出声」顶掉，数黑匣子里说过几次
check(said === 1, "按播放两次：清单没变 = 四个出口那句只说过一次（黑匣子里数）", `${said} 次`);
check((await toasts()).some((t) => t.includes("没有出声")), "一个声部都放不了：「没有出声」照样说（这一下必须说）");
// 点角标 = 开清单，不是放
const playingBefore = await p.evaluate(() => window.__moonsinger.engine.playing);
await p.click("#playBtn .issues-badge"); await p.waitForTimeout(250);
check(!!(await p.$(".offer .offer-title")) && /不出声的声部/.test(await p.$eval(".offer .offer-title", (e) => e.textContent ?? "")), "点角标 = 清单面板");
check((await p.evaluate(() => window.__moonsinger.engine.playing)) === playingBefore, "点角标没有触发放 / 停");
check(/Guest/.test(await p.$eval(".offer", (e) => e.textContent ?? "")) && /还没有人上场/.test(await p.$eval(".offer", (e) => e.textContent ?? "")), "清单里：谁、为什么");
await p.click('.offer [data-v^="inst:"]'); await p.waitForTimeout(300);
check(await p.$eval(".inst-page", (e) => !e.hidden), "清单里的钮 = 去乐器页（换人 / 找声音）");
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
// 导出面板：一行红字 + 「照样导出」（出口 ④，不拦）
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="export"]'); await p.waitForTimeout(200);
await p.click('.offer [data-v="mp3"]'); await p.waitForTimeout(200);
check(!!(await p.$(".offer .issue-warn")) && /不出声/.test(await p.$eval(".offer .issue-warn", (e) => e.textContent ?? "")), "导出面板里一行：几条轨不出声（出口 ④）");
check((await p.$eval('.offer [data-v="go"]', (e) => e.textContent ?? "")).trim() === "照样导出", "主按钮写「照样导出」，不拦");
await p.click('.offer [data-v="close"]'); await p.waitForTimeout(100);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nissues: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
