// scripts/snap-song.mjs —— 样张：把一首歌在无头浏览器里按「全部曲段 · 连续」排出来，截一张谱面的图（排谱改动前后对着看）。created 2026-11-08 by Claude Fable 5.1
//   用法：npm run build && npm run serve（8710）→ node scripts/snap-song.mjs <歌.mxl> <出.png> [--width=1024] [--segment] [--pages] [--base=http://127.0.0.1:8710/]
//   默认 1024 宽（iPad 竖屏）、全部曲段、连续排法；--segment = 本段；--pages = 分页（= 打印预览）。
import { readFileSync } from "node:fs";
import { chromium } from "../test/e2e/pw.mjs";
const args = process.argv.slice(2), pos = args.filter((a) => !a.startsWith("--")), opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split("=").slice(1).join("=");
const [file, out] = pos; if (!file || !out) { console.error("usage: snap-song.mjs <song.mxl> <out.png> [--width=1024] [--segment] [--pages] [--base=…]"); process.exit(2); }
const width = Number(opt("width", 1024)), base = opt("base", "http://127.0.0.1:8710/");
const bytes = readFileSync(file);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width, height: 1400 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(base); await p.waitForTimeout(800);
await p.evaluate(([name, arr]) => { const m = window.__moonsinger; m.load(m.open(name, new Uint8Array(arr))); }, [file.split("/").pop(), Array.from(bytes)]);
await p.waitForTimeout(600);
await p.evaluate(([seg, pages]) => { const m = window.__moonsinger; m.setScope?.(seg ? "segment" : "all"); m.setPages?.(!!pages); m.setScroll?.(false); }, [args.includes("--segment"), args.includes("--pages")]);
await p.waitForTimeout(900);
const sheet = await p.$("#score .sheet") ?? await p.$("#score svg");
await sheet.screenshot({ path: out });
const L = await p.evaluate(() => { const l = window.__moonsinger.layout(); return { systems: l.systems.length, w: Math.round(l.width), h: Math.round(l.height), sp: l.sp }; });
console.log(`${out}: ${L.systems} 行谱, ${L.w}×${L.h} px, sp ${L.sp}${errs.length ? `; 页面报错: ${errs.join(" | ")}` : ""}`);
await b.close();
