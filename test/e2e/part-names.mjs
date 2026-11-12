// test/e2e/part-names.mjs —— 真浏览器 E2E：声部显示成什么（谱面分家 5½ → 施工单 12-4 重做）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。12-4（2026-11-12）：名字和乐器分开（user「全部声部里面翻译没有跟，以及好好想一下声部到底要不要自动翻译」→ 统筹提议 → user「同意」）。
//   守：① 没起名字的声部 = 乐器的叫法，按「谱上的字」那一项的语言（跟着界面 = 界面语言）：中文界面 Flute → 长笛、简写也是中文；英文界面 Flute / Fl.
//       ② 新歌默认那一位 = 目录里的人声：中文「人声」、英文「Voice」。
//       ③ 文件里写的东西不许取决于是哪台设备：两种界面下存出去的 .mxl 每一份文件都一样（除了存盘时刻）。
//       ④ 「谱上的字」钉成和界面相反的语言：谱上、「全部声部」下拉、小卡、混音台卡片四处是同一个叫法。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/part-names.mjs（MS_E2E_BASE 可改地址）
import fs from "node:fs";
import { chromium } from "./pw.mjs";
import { ddOptions } from "./dd.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const bytes = [...fs.readFileSync(new URL("../fixtures/songs/once-upon-a-tale.mxl", import.meta.url))];
const b = await chromium.launch();
const scoreNames = (p) => p.evaluate(() => window.__moonsinger.layout().prims.filter((x) => /part-name/.test(x.cls ?? "") && !/abbr/.test(x.cls ?? "")).map((x) => x.s));
/** 一种界面语言开 Once：谱上的名字 / 简写、存出去的字节；然后把「谱上的字」钉成 other，四处的叫法。 */
const run = async (locale, other) => {
  const ctx = await b.newContext({ locale, viewport: { width: 1200, height: 900 } }), p = await ctx.newPage(), errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(800);
  const fresh = await scoreNames(p);   // 新歌：默认那一位
  await p.evaluate((x) => { const m = window.__moonsinger; m.load(m.open("song.mxl", new Uint8Array(x))); }, bytes);
  await p.waitForTimeout(400);
  const out = { fresh, lang: await p.evaluate(() => document.documentElement.dataset.lang), names: await scoreNames(p), abbrs: await p.evaluate(() => window.__moonsinger.layout().prims.filter((x) => /part-name abbr/.test(x.cls ?? "")).map((x) => x.s)), bytes: await p.evaluate(() => window.__moonsinger.saveBytes()), errs };
  // 「谱上的字」钉成另一种语言（走页面设置同一个口子：setTextLang + 看法），四处一起看
  await p.evaluate((l) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, textLang: l } }); }, other); await p.waitForTimeout(400);
  out.cross = { score: await scoreNames(p), drop: (await ddOptions(p, "#partSel")).map((x) => x.label) };
  await p.click("#score text.part-name >> nth=0"); await p.waitForTimeout(250);
  out.cross.card = await p.$eval(".part-card .tc-head b", (e) => e.textContent); await p.mouse.click(5, 5); await p.waitForTimeout(150);
  await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(400);
  out.cross.mixer = await p.$$eval(".studio .strip-name", (es) => es.map((e) => e.textContent));
  await ctx.close(); return out;
};
const zh = await run("zh-CN", "en"), en = await run("en-US", "zh");
check(zh.lang === "zh" && en.lang === "en", "两种界面语言", `${zh.lang} / ${en.lang}`);
check(zh.names.includes("长笛") && zh.names.includes("直笛") && zh.names.includes("小鼓") && !zh.names.includes("Flute"), "中文界面、跟着界面：没起名字的声部写乐器的中文叫法（长笛、直笛、小鼓）", zh.names.join(" "));
check(en.names.includes("Flute") && en.names.includes("Recorder") && en.names.includes("Kick drum") && !en.names.includes("长笛"), "英文界面：英文叫法 = 老歌原来印的（Kick drum 照旧，不变成目录后来的 Bass Drum）", en.names.join(" "));
check(zh.abbrs.length > 0 && zh.abbrs.some((x) => /长笛/.test(x)) && !zh.abbrs.includes("Fl."), "中文界面：第二行起的简写也是中文（按定宽缩）", zh.abbrs.join(" "));
check(en.abbrs.includes("Fl.") && en.abbrs.includes("BD"), "英文界面：简写 = 按值存的目录简写（Fl.、BD），不等目录加载", en.abbrs.join(" "));
check(zh.fresh.includes("人声") && en.fresh.includes("Voice"), "新歌默认那一位 = 目录里的人声：中文「人声」、英文「Voice」", `${zh.fresh.join(" ")} / ${en.fresh.join(" ")}`);
{ const { unzipSync } = await import("../../vendor/fflate/fflate.esm.js"); const za = unzipSync(new Uint8Array(zh.bytes)), zb = unzipSync(new Uint8Array(en.bytes));
  const norm = (k, u) => (/\.(musicxml|json)$/.test(k) ? new TextEncoder().encode(new TextDecoder().decode(u).replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/g, "<存盘时刻>")) : u);   // 存盘时刻每次存都不一样，和语言无关：抹掉再比
  for (const z of [za, zb]) for (const k of Object.keys(z)) z[k] = norm(k, z[k]);
  const diff = [...new Set([...Object.keys(za), ...Object.keys(zb)])].filter((k) => !za[k] || !zb[k] || za[k].length !== zb[k].length || za[k].some((v, i) => v !== zb[k][i]));
  if (diff.length) for (const k of diff.slice(0, 3)) { const ta = new TextDecoder().decode(za[k] ?? new Uint8Array()), tb = new TextDecoder().decode(zb[k] ?? new Uint8Array()); let i = 0; while (i < ta.length && ta[i] === tb[i]) i++; console.log(`    ${k}: …${ta.slice(Math.max(0, i - 60), i + 60)}… / …${tb.slice(Math.max(0, i - 60), i + 60)}…`); }
  check(zh.bytes.length > 0 && !diff.length, "文件不取决于设备：两种界面下存出去的 .mxl 每一份文件都一样（除了存盘时刻；<part-name> 只看歌自己）", diff.join(" ")); }
for (const [r, word, ui] of [[zh, "Flute", "中文界面 + 谱上的字 = English"], [en, "长笛", "英文界面 + 谱上的字 = 中文"]]) {
  const c = r.cross;
  check(c.score.includes(word) && c.drop.includes(word) && c.card === word && c.mixer.includes(word), `${ui}：谱上、「全部声部」下拉、小卡、混音台卡片同一个叫法「${word}」`, JSON.stringify(c));
}
check(!zh.errs.length && !en.errs.length, "没有页面错误", [...zh.errs, ...en.errs].join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
