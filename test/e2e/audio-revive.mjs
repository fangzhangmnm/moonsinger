// test/e2e/audio-revive.mjs —— 真浏览器 E2E（v0.16.32）：声音的三样新东西在电脑上「走得通、不出错、之后照样出声」。created 2026-11-08 by Claude Fable 5.1
//   ① 垫脚（src/singer/audio.ts ⑥，iPad 才开——这里用测试口子强开）：第一次按键 → 垫脚先起 → 时钟走稳 → 真正的那一个才起 → 垫脚关掉
//   ② 「重启声音」（⑤ 换出声口）：换完时钟照走、录音房照样在渲染、按键照样有声
//   ③ 「写着 running、时钟不走」（真机 v0.16.31：离开 3 分多钟回来没声音）：把时钟假装冻住 → 两次按键 → 自动换出声口、不行再 suspend + resume，全程不抛错
//   这些在 iPad 上管不管用，电脑上测不出来（电脑上声音设备起得干净、也不会被系统收走）——这里只守「这条路走得通」。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/audio-revive.mjs
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto((process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/") + "?primer=1"); await p.waitForTimeout(900);   // ?primer=1：电脑上平时不开垫脚，这里强开
const audio = () => p.evaluate(() => window.__moonsinger.diag().split("\n").filter((l) => l.includes("[audio]")).map((l) => l.replace(/^.*\[audio\] /, "")));
const clock = () => p.evaluate(() => { const c = window.__moonsinger.audioCtx(); return c ? { state: c.state, t: c.currentTime } : null; });
const moving = async () => { const a = await clock(); await p.waitForTimeout(250); const c = await clock(); return !!a && !!c && c.state === "running" && c.t > a.t; };
const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(120); await p.keyboard.up(k); };

// ① 垫脚
const before = await clock();
await p.click("#score"); await p.waitForTimeout(150); await tap("1");
await p.waitForTimeout(1500);
const a1 = await audio();
check(before !== null && before.state !== "running", "按键之前真正的那一个已经建好、停着（手势里才建的会被浏览器当场起起来，垫脚就来不及了）", JSON.stringify(before));
check(a1.some((l) => l.startsWith("primer: device up")), "垫脚先起、时钟走稳了才起真正的那一个", a1.filter((l) => l.startsWith("primer")).join(" | "));
{ const i = a1.findIndex((l) => l.startsWith("primer: device up")), j = a1.findIndex((l) => /^state \w+ → running/.test(l)); check(i >= 0 && j > i, "顺序：垫脚起来 → 真正的那一个 running", `${i} ${j}`); }
check(await moving(), "真正的那一个在跑、时钟在走");
check(a1.some((l) => l.startsWith("start burst (running)")), "照常量了这一次起来", a1.filter((l) => l.startsWith("start burst")).join(" | "));
await p.waitForTimeout(2600);
check((await audio()).some((l) => l === "primer: closed"), "量完之后垫脚关掉了（不留一个一直挂着的上下文）");

// ② 重启声音
const ok = await p.evaluate(() => window.__moonsinger.reviveAudio());
const a2 = await audio();
check(ok === true, "「重启声音」回 true（时钟在走）");
check(a2.some((l) => l.startsWith("revive (manual)") && l.includes("output re-created")), "换了出声口", a2.filter((l) => l.startsWith("revive")).join(" | "));
check(await moving(), "换完时钟照走");
await p.keyboard.down("3");
const voices = await p.evaluate(() => new Promise((res) => { const off = window.__moonsinger.engine.on("load", (i) => { if (i.voices > 0) { off(); res(i.voices); } }); setTimeout(() => { off(); res(0); }, 3500); }));
await p.keyboard.up("3");
check(voices > 0, "换完之后按键照样出声（录音房在渲染、有声音在响）", `voices ${voices}`);

// ③ 写着 running、时钟不走
await p.waitForTimeout(1600);   // 过了「同一秒半里只换一次」
await p.evaluate(() => { const c = window.__moonsinger.audioCtx(), t = c.currentTime; Object.defineProperty(c, "currentTime", { configurable: true, get: () => t }); });
await tap("1"); await p.waitForTimeout(600); await tap("2");
await p.waitForTimeout(800);
const a3 = await audio();
check(a3.some((l) => l.startsWith("key pressed while clock frozen")), "按键时发现时钟没走，记了一条", a3.filter((l) => l.startsWith("key pressed")).join(" | "));
check(a3.some((l) => l.startsWith("revive (frozen-key)")), "自动换出声口");
check(a3.some((l) => l.includes("→ suspend + resume")), "换完 0.5 秒时钟还不走（这里是假装的）= 退回 suspend + resume");
await p.evaluate(() => { delete window.__moonsinger.audioCtx().currentTime; });   // 把假冻结拿掉
await p.waitForTimeout(1800);
check(await moving(), "之后声音照常（suspend + resume 完上下文还在跑）", JSON.stringify(await clock()));
check(errs.length === 0, "全程没有页面错误", errs.slice(0, 3).join(" | "));
console.log(`\n${fail ? "✗" : "✓"} ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
