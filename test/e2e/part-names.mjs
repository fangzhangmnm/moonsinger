// test/e2e/part-names.mjs —— 真浏览器 E2E：谱上的声部名跟界面语言（谱面分家 5½，愿望单 W-71；统筹细则 = 施工单第三节「5½」）。
//   中文界面：名字就是目录里那件乐器自己的名字的声部 = 显示目录里的中文名（Flute → 长笛），简写跟着；英文界面照旧。只管显示：两种界面下存出去的 .mxl 字节一样。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/part-names.mjs（MS_E2E_BASE 可改地址）
import fs from "node:fs";
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const bytes = [...fs.readFileSync(new URL("../fixtures/songs/once-upon-a-tale.mxl", import.meta.url))];
const b = await chromium.launch();
/** 一种界面语言开 Once：谱上的声部名（第一行全名、第二行起简写）+ 存出去的字节。目录是点开才取的，等它到了（名字变了）再量。 */
const run = async (locale, want) => {
  const ctx = await b.newContext({ locale, viewport: { width: 1200, height: 900 } }), p = await ctx.newPage(), errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(800);
  await p.evaluate((x) => { const m = window.__moonsinger; m.load(m.open("song.mxl", new Uint8Array(x))); }, bytes);
  const names = () => p.evaluate(() => window.__moonsinger.layout().prims.filter((x) => /part-name/.test(x.cls ?? "") && !/abbr/.test(x.cls ?? "")).map((x) => x.s));
  for (let i = 0; i < 40 && !(await names()).includes(want); i++) await p.waitForTimeout(150);
  const out = { lang: await p.evaluate(() => document.documentElement.lang), names: await names(), abbrs: await p.evaluate(() => window.__moonsinger.layout().prims.filter((x) => /part-name abbr/.test(x.cls ?? "")).map((x) => x.s)), bytes: await p.evaluate(() => window.__moonsinger.saveBytes()), errs };
  await ctx.close(); return out;
};
const zh = await run("zh-CN", "长笛"), en = await run("en-US", "Flute");
check(zh.lang === "zh-CN" && en.lang === "en", "两种界面语言", `${zh.lang} / ${en.lang}`);
check(zh.names.includes("长笛") && zh.names.includes("直笛") && zh.names.includes("小鼓"), "中文界面：谱上的名字是目录里的中文名（Flute → 长笛、Recorder → 直笛、Snare drum → 小鼓）", zh.names.join(" "));
check(!zh.names.includes("Flute"), "中文界面：没有英文的 Flute 了");
check(en.names.includes("Flute") && en.names.includes("Recorder") && !en.names.includes("长笛"), "英文界面：照旧英文", en.names.join(" "));
check(zh.abbrs.length > 0 && zh.abbrs.some((x) => /长笛/.test(x)) && !zh.abbrs.some((x) => x === "Fl."), "中文界面：第二行起的简写也是中文（按定宽缩，不用英文的 Fl.）", zh.abbrs.join(" "));
check(en.abbrs.includes("Fl."), "英文界面：简写照旧 Fl.", en.abbrs.join(" "));
{ const { unzipSync } = await import("../../vendor/fflate/fflate.esm.js"); const za = unzipSync(new Uint8Array(zh.bytes)), zb = unzipSync(new Uint8Array(en.bytes));
  const norm = (k, u) => (/\.(musicxml|json)$/.test(k) ? new TextEncoder().encode(new TextDecoder().decode(u).replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/g, "<存盘时刻>")) : u);   // 存盘时刻（encoding-date、manifest 里的时间）每次存都不一样，和语言无关：抹掉再比
  for (const z of [za, zb]) for (const k of Object.keys(z)) z[k] = norm(k, z[k]);
  const diff = [...new Set([...Object.keys(za), ...Object.keys(zb)])].filter((k) => !za[k] || !zb[k] || za[k].length !== zb[k].length || za[k].some((v, i) => v !== zb[k][i]));
  if (diff.length) for (const k of diff.slice(0, 3)) { const ta = new TextDecoder().decode(za[k] ?? new Uint8Array()), tb = new TextDecoder().decode(zb[k] ?? new Uint8Array()); let i = 0; while (i < ta.length && ta[i] === tb[i]) i++; console.log(`    ${k}: …${ta.slice(Math.max(0, i - 60), i + 60)}… / …${tb.slice(Math.max(0, i - 60), i + 60)}…`); }
  check(zh.bytes.length > 0 && !diff.length, "只管显示：两种界面下存出去的 .mxl 每一份文件都一样（除了存盘时刻；歌里的名字、MusicXML 里的名字不动）", diff.join(" ")); }
check(!zh.errs.length && !en.errs.length, "没有页面错误", [...zh.errs, ...en.errs].join(" | "));
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
