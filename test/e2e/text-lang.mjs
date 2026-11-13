// test/e2e/text-lang.mjs —— 真浏览器 E2E：谱上的字用哪种语言（施工单 12-4）。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。user「页面设置是不是也应该有一个语言，影响打印？还是打印的时候自己调语言？」→ 统筹定 = 歌里一项。
// 守：页面设置「版面」页「谱上的字」= 跟着界面 / 中文 / English；选了 = 歌里那一项变、谱上印出来的字（换气后面的「吸」）跟着变、能撤销；
//   导出乐谱的面板写着用哪种语言印、旁边能直接改（改的是同一项）；界面语言不变。
import { chromium } from "./pw.mjs";
import { pickOnPage, pick, ddValue } from "./dd.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 }, locale: "zh-CN" })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 一首小歌：三个音，第二个音后面换气 + 「吸」
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].slice(0, 3); let id = 7100;
  const n = (step, x = {}) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 5 }, dur: 1680, lyric: null, ...x });
  m.set({ ...st, song: { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [pid]: [...head, n("C"), n("D", { art: ["breath"], inhale: "soft" }), n("E")] } }] } });
});
await p.waitForTimeout(300);
const textLang = () => p.evaluate(() => window.__moonsinger.state().song.textLang);
const breathLabel = () => p.evaluate(() => [...document.querySelectorAll("#score text.breath-label")].map((e) => e.textContent).join(","));
check((await textLang()) === "ui", "新歌 = 跟着界面", await textLang());
check((await breathLabel()) === "吸", "中文界面、跟着界面：换气后面印「吸」", await breathLabel());
// 页面设置「版面」页
const openSheet = async () => { const c = await p.evaluate(() => { const r = document.querySelector("#score .score-overlay .ov-paper-chip")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }); await p.mouse.click(c.x, c.y); await p.waitForTimeout(200); };
await openSheet();
const onLayout = await p.$eval('[data-pg="tl"]', (el) => el.closest(".set-page")?.dataset.page);
check(onLayout === "layout", "「谱上的字」在页面设置「版面」页", onLayout);
await pickOnPage(p, '[data-pg="tl"]', "en"); await p.waitForTimeout(250);
check((await textLang()) === "en", "选 English = 歌里那一项变成 en", await textLang());
check((await breathLabel()) === "in", "谱上印出来的换气字变成英文", await breathLabel());
check(await p.evaluate(() => document.documentElement.dataset.lang) === "zh", "界面语言没变（还是中文）");
await p.click('.set-panel [data-panel-btn="close"]'); await p.waitForTimeout(150);
await p.keyboard.press("Control+z"); await p.waitForTimeout(250);
check((await textLang()) === "ui" && (await breathLabel()) === "吸", "能撤销（回到跟着界面）", `${await textLang()} ${await breathLabel()}`);
// 导出乐谱的面板
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="export"]'); await p.waitForTimeout(200);
await p.click('.offer [data-v="pdf"]'); await p.waitForTimeout(200);
check(!!(await p.$('.offer .pdf-lang [data-pd="tl"]')), "导出乐谱的面板里写着用哪种语言印");
check((await ddValue(p, '.offer [data-pd="tl"]')) === "ui", "面板上的值 = 歌里那一项（跟着界面）");
await pick(p, '.offer [data-pd="tl"]', "en"); await p.waitForTimeout(250);
check((await textLang()) === "en" && (await ddValue(p, '.offer [data-pd="tl"]')) === "en", "在面板上直接改 = 改的是歌里那一项", await textLang());
check(!!(await p.$('.offer [data-v="go"]')), "改完面板还开着，能接着生成");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntext-lang: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
