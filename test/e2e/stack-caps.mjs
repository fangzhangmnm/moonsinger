// test/e2e/stack-caps.mjs —— 真浏览器 E2E：「叠」= 锁定式 + 改一个音（v0.10.5；ai-docs/20261010-keyboard-selection-rules.md）。created 2026-10-10 by Claude Opus 5.5
//   user「叠音模式也应该只有capslock没有shift，每次都会弄错，所以不要shift模式」；键盘 × 选区「叠这个字就用来选中上个，然后你也可以调时长」「不，我说的就是退格，不过在这个context下面可以改图标」→「同意」。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/stack-caps.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name><score-instrument id="P1-I1"><instrument-name>Piano</instrument-name><instrument-sound>keyboard.piano</instrument-sound></score-instrument><midi-instrument id="P1-I1"><midi-program>1</midi-program></midi-instrument></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note><note><rest/><duration>4</duration><type>half</type></note><note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note></measure></part></score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
// 能叠音的声部 = SoundFont 引擎（canStack）；测试环境里没有音色库，载入时直接把这个角色的候选标成 SoundFont（只为过「能不能叠」这一关，不放音）
await p.evaluate((xml) => { const m = window.__moonsinger, o = m.open("t.musicxml", new TextEncoder().encode(xml)), r = o.song.parts[0].role; for (const c of o.extras.lounge[r].candidates) c.instrument = { engine: "soundfont", bank: 0, program: 0, source: { embedded: null, subsetBytes: 0, subsetSha256: "e2e", origin: { name: "e2e.sf2", fileSha256: "e2e", bytes: 0 } } }; m.load(o); }, XML);
await p.waitForTimeout(300);
const toks = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note" || t.kind === "rest").map((t) => t.kind === "rest" ? `r${t.dur}` : `${[t.pitch, ...(t.chord ?? [])].map((q) => q.step).join("+")}${t.dur}`).join(" "); });
const sel = () => p.evaluate(() => window.__moonsinger.state().sel);
const stackOn = () => p.evaluate(() => document.querySelector(".pad-panel [data-stack]").classList.contains("lock"));
const bsText = () => p.evaluate(() => document.querySelector('.pad-panel [data-cmd="backspace"]').textContent);
const stk = () => p.dispatchEvent(".pad-panel [data-stack]", "pointerdown", { pointerId: 1, isPrimary: true, button: 0 });
// 光标放到 C 后面（第一个音后面）
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part], i = t.findIndex((x) => x.kind === "note"); m.set({ ...s, sel: null, caret: i + 1 }); });
await p.waitForTimeout(150);
const t0 = await toks();
check(!(await stackOn()) && (await bsText()) === "", "平时：叠不亮、⌫ 是退格图标", t0);
await stk(); await p.waitForTimeout(150);
const s1 = await sel();
check(!!s1 && s1.to - s1.from === 1 && (await stackOn()), "按一下叠 = 选中光标前那个音（C）、叠亮着", JSON.stringify(s1));
check((await bsText()).includes("短一步"), "改一个音时 ⌫ 写「短一步」", await bsText());
// 试听：录音房的按键试听记下来（测试里没有音色库：假装库在）
await p.evaluate(() => { const e = window.__moonsinger.engine; e.hasBank = () => true; e.presetIndex = () => 0; window.__aud = []; e.auditionOn = (src, _inst, key) => window.__aud.push([src, key]); });
await p.focus("#score"); await p.keyboard.press("3"); await p.waitForTimeout(150);
check((await toks()).startsWith("E+C") || (await toks()).startsWith("C+E"), "按 3 = 叠上 E（XOR）", await toks());
{ const aud = await p.evaluate(() => window.__aud.splice(0)), last = aud.filter(([s]) => !String(s).includes("~")).at(-1)?.[0], group = aud.filter(([s]) => s === last || String(s).startsWith(`${last}~`));
  check(group.length === 2 && new Set(group.map(([, k]) => k)).size === 2, "叠上之后试听 = 整个和弦一起响（C 和 E 两个音，不只是旧的那个）", JSON.stringify(aud)); }
await p.keyboard.press("3"); await p.keyboard.press("1"); await p.waitForTimeout(150);
check((await toks()).startsWith("r"), "再按 3、按 1 = 拿掉 E、拿掉最后一个 C = 一样长的休止", await toks());
await p.keyboard.press("5"); await p.waitForTimeout(150);
check((await toks()).startsWith("G"), "休止上按 5 = 变回音（G）", await toks());
await stk(); await p.waitForTimeout(150);
check(!(await sel()) && !(await stackOn()), "再按一下叠 = 回到光标、叠不亮");
await p.keyboard.press("2"); await p.waitForTimeout(150);
check((await toks()).split(" ")[1] === "D840" && (await toks()).split(" ")[2] === "r2520" && (await toks()).split(" ")[3] === "D1680", "光标后是休止 = 写音覆盖休止（D 八分吃掉二分休止里的一个八分，剩三个八分，后面的 D 不挪）", await toks());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nstack-caps: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
