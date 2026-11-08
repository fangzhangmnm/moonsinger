// test/e2e/typing-keys.mjs —— 真浏览器 E2E：光标在打字的框里 = 键一律归框（v0.16.14）。
// created 2026-11-07 by Claude Opus 5.5（user 11-07「改名的时候没法输入空格，被播放按钮劫持了。帮我系统性的查一下这反映了什么系统问题」）。
// 守：「听」模式里改文件名，空格 / 字母进框、不放；「写」模式里改文件名同样；混音台里改混音轨名字，空格进框、不放。框外按空格照常放 / 停。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/typing-keys.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
// 有没有被拿去放：走带钮的图标变成「停」= 按了放（准备期间也会变）
const playing = () => p.evaluate(() => document.querySelector("#dockPlay use, .play-btn use")?.getAttribute("href") === "#stop");
for (const [mode, label] of [["listen", "「听」"], ["notes", "「音」"]]) {
  await p.evaluate((m) => window.__moonsinger.setMode(m), mode); await p.waitForTimeout(200);
  await p.click("#fileBtn"); await p.waitForTimeout(200);
  const inp = await p.$("#fnIn");
  check(!!inp, `${label}：点文件名 = 改文件名的框`);
  if (!inp) continue;
  await p.fill("#fnIn", ""); await p.focus("#fnIn");
  await p.keyboard.type("my song a"); await p.waitForTimeout(250);
  check((await p.inputValue("#fnIn")) === "my song a", `${label}：框里打得进空格和字母`, await p.inputValue("#fnIn"));
  check(!(await playing()), `${label}：没被拿去放`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
}
// 框外：「听」里空格照常放 / 停（先写几个音、小月相换成静音，同 transport.mjs）
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(150);
for (let i = 0; i < 8; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(25); }
await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 12), sr: 22050 }); });
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(200);
await p.evaluate(() => document.getElementById("score")?.focus());
const eng = () => p.evaluate(() => window.__moonsinger.engine.playing);
const waitEng = async (want) => { for (let i = 0; i < 80; i++) { if ((await eng()) === want) return true; await p.waitForTimeout(80); } return false; };
await p.keyboard.press(" ");
const on = await waitEng(true);
await p.waitForTimeout(500); await p.keyboard.press(" ");
check(on && (await waitEng(false)), "框外：「听」里空格照常放、再按停", `${on}`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntyping-keys: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
