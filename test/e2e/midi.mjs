// test/e2e/midi.mjs —— 真浏览器 E2E：MIDI 键盘（假的 Web MIDI 装进页面，琴键从页面里「按」）。created 2026-10-16 by Claude Opus 5.5
//   顶栏「MIDI」连接（W-42：开 app 不问；点钮 → 连接 → 浏览器的许可框假装点了允许；设置里那一行跟着变）→ 琴键写进谱（绝对音高、按调拼写）→ 单声的小月相同时按只写第一个 → 「弹」/ 词 / 听 只出声不写 → 拔掉报一声。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/midi.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
// 假的 Web MIDI：一台「Fake Piano」；浏览器还没记住许可（resume 不该自己连）；window.__midi.on / off / unplug 从测试里按
await ctx.addInitScript(() => {
  const port = { id: "fake-1", name: "Fake Piano", manufacturer: "Test", state: "connected", type: "input", onmidimessage: null };
  const access = { inputs: new Map([[port.id, port]]), onstatechange: null };
  let asked = 0;
  Object.defineProperty(navigator, "requestMIDIAccess", { value: () => { asked++; return Promise.resolve(access); }, configurable: true });
  const q = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (d) => (d && d.name === "midi" ? Promise.resolve({ state: "prompt" }) : q(d));
  const send = (...bytes) => port.onmidimessage?.({ data: new Uint8Array(bytes) });
  window.__midi = { on: (n, v = 100) => send(0x90, n, v), off: (n) => send(0x80, n, 0), asked: () => asked,
    unplug: () => { port.state = "disconnected"; access.onstatechange?.({ port }); } };
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(900);
check((await p.evaluate(() => window.__midi.asked())) === 0, "开 app 时浏览器没记住许可 = 不问、不连");

// 顶栏「MIDI」连接（W-42）
const chip = () => p.evaluate(() => { const b = document.getElementById("midiBtn"); return { shown: !!b && !b.hidden && b.offsetWidth > 0, cls: b?.className ?? "", title: b?.title ?? "" }; });
let c = await chip();
check(c.shown && c.cls.includes("m-off"), "顶栏露「MIDI」：还没连", c.cls);
await p.click("#midiBtn"); await p.waitForTimeout(150);
const menu = await p.textContent(".midi-menu");
check(menu.includes("点「连接」") && !!(await p.$('.midi-menu [data-v="connect"]')) && !!(await p.$('.midi-menu [data-v="hide"]')), "点开 = 说怎么连 + 「连接」/「我没有」", menu);
check((await p.evaluate(() => window.__midi.asked())) === 0, "点开小菜单还不问（点「连接」才问）");
await p.click('.midi-menu [data-v="connect"]'); await p.waitForTimeout(250);
c = await chip();
check((await p.evaluate(() => window.__midi.asked())) === 1 && c.cls.includes("m-on") && c.title.includes("Fake Piano"), "点连接 = 问一次、认出插着的琴，顶栏点亮", `${c.cls} · ${c.title}`);
check(!(await p.$(".midi-menu")), "点了连接小菜单收起");
check(await p.evaluate(() => { window.__midi.on(48); const hit = document.getElementById("midiBtn").classList.contains("hit"); window.__midi.off(48); return hit; }), "来一个音 = 顶栏的点闪一下");
// 设置里那一行跟着变
await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="settings"]'); await p.waitForTimeout(250);
const row = await p.textContent("#midiSt");
check(row.includes("Fake Piano") && !(await p.$('[data-v="midi:connect"]')), "设置里 MIDI 键盘一行 = 接着、没有「连接」钮", row);
await p.click('.settings-card [data-v="close"]'); await p.waitForTimeout(200);

// 写谱：读当前这条 track 上的音
const notes = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").map((t) => `${t.pitch.step}${t.pitch.alter > 0 ? "#".repeat(t.pitch.alter) : "b".repeat(-t.pitch.alter)}${t.pitch.octave}`); });
await p.evaluate(() => { const e = window.__moonsinger.engine; window.__aud = []; const on = e.auditionOn.bind(e); e.auditionOn = (...a) => { window.__aud.push(a[2]); return on(...a); }; });
const n0 = (await notes()).length;
await p.evaluate(() => window.__midi.on(60)); await p.waitForTimeout(60); await p.evaluate(() => window.__midi.off(60)); await p.waitForTimeout(80);
await p.evaluate(() => window.__midi.on(61)); await p.waitForTimeout(60); await p.evaluate(() => window.__midi.off(61)); await p.waitForTimeout(80);
let ns = await notes();
check(ns.length === n0 + 2 && ns.slice(-2).join(" ") === "C4 C#4", "琴键写进谱：中央 C = C4、黑键在 C 大调里写 C♯", ns.join(" "));
check((await p.evaluate(() => window.__aud.length)) >= 2, "写的时候也响", JSON.stringify(await p.evaluate(() => window.__aud)));

// 单声（新歌默认小月相）：同时按两个 = 只写第一个
await p.evaluate(() => { window.__midi.on(64); window.__midi.on(67); }); await p.waitForTimeout(60);
await p.evaluate(() => { window.__midi.off(64); window.__midi.off(67); }); await p.waitForTimeout(80);
ns = await notes();
check(ns.length === n0 + 3 && ns.at(-1) === "E4", "单声的声部同时按两个键 = 只写第一个（同 pad 的 50 ms 护栏）", ns.join(" "));
// 按住一个、隔开一会再按下一个（连奏）= 两个都写
await p.evaluate(() => window.__midi.on(65)); await p.waitForTimeout(150); await p.evaluate(() => window.__midi.on(67)); await p.waitForTimeout(60);
await p.evaluate(() => { window.__midi.off(65); window.__midi.off(67); }); await p.waitForTimeout(80);
ns = await notes();
check(ns.length === n0 + 5 && ns.slice(-2).join(" ") === "F4 G4", "连奏（前一个还按着、隔开了）= 两个都写", ns.join(" "));

// 「弹」= 只响不写
const song0 = await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song));
await p.keyboard.press("Backquote"); await p.waitForTimeout(150);
await p.evaluate(() => { window.__aud = []; window.__midi.on(72); }); await p.waitForTimeout(60); await p.evaluate(() => window.__midi.off(72)); await p.waitForTimeout(80);
check((await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song))) === song0, "「弹」开着：谱一点没动");
check((await p.evaluate(() => window.__aud.length)) >= 1, "「弹」开着：照样响");
await p.keyboard.press("Backquote"); await p.waitForTimeout(150);

// 词 / 听：只出声
for (const m of ["lyrics", "listen"]) {
  await p.click(`.mode-seg [data-mode="${m}"]`); await p.waitForTimeout(200);
  await p.evaluate(() => { window.__aud = []; window.__midi.on(74); }); await p.waitForTimeout(60); await p.evaluate(() => window.__midi.off(74)); await p.waitForTimeout(80);
  check((await p.evaluate(() => JSON.stringify(window.__moonsinger.state().song))) === song0 && (await p.evaluate(() => window.__aud.length)) >= 1, `${m === "lyrics" ? "词" : "听"}：只出声、不写`);
}
await p.click('.mode-seg [data-mode="notes"]'); await p.waitForTimeout(200);

// 按着的时候拔掉 = 松开 + 报一声，之后再按不写
await p.evaluate(() => window.__midi.on(60)); await p.waitForTimeout(60);
const before = (await notes()).length;
await p.evaluate(() => window.__midi.unplug()); await p.waitForTimeout(150);
check((await p.textContent("body")).includes("MIDI 键盘拔掉了：Fake Piano"), "拔掉 = 报一声");
await p.evaluate(() => window.__midi.on(62)); await p.waitForTimeout(80);
check((await notes()).length === before, "拔掉之后的消息不接");

c = await chip();
check(c.shown && c.cls.includes("m-idle"), "拔掉 = 顶栏空心点（开着，没插琴）", c.cls);
check(errs.length === 0, "页面没有报错", errs.join(" | "));

// 「我没有 MIDI 键盘」= 这台浏览器顶栏不露，刷新也不露；没有 Web MIDI（iPad / iPhone）= 不露
{
  const c2 = await b.newContext({ viewport: { width: 1100, height: 900 } });
  await c2.addInitScript(() => { Object.defineProperty(navigator, "requestMIDIAccess", { value: () => Promise.reject(new Error("nope")), configurable: true }); });
  const q = await c2.newPage(); await q.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await q.waitForTimeout(900);
  const shown = () => q.evaluate(() => { const b = document.getElementById("midiBtn"); return !!b && !b.hidden; });
  await q.click("#midiBtn"); await q.waitForTimeout(150); await q.click('.midi-menu [data-v="hide"]'); await q.waitForTimeout(150);
  check(!(await shown()), "「我没有」= 顶栏不露");
  await q.reload(); await q.waitForTimeout(900);
  check(!(await shown()), "刷新了也不露（这台浏览器记住）");
  await c2.close();
  const c3 = await b.newContext({ viewport: { width: 1100, height: 900 } });
  await c3.addInitScript(() => { Object.defineProperty(navigator, "requestMIDIAccess", { value: undefined, configurable: true }); });
  const r = await c3.newPage(); await r.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await r.waitForTimeout(900);
  check(await r.evaluate(() => document.getElementById("midiBtn")?.hidden === true), "没有 Web MIDI 的浏览器 = 顶栏不露");
  await c3.close();
}
await b.close();
console.log(`\nmidi: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
