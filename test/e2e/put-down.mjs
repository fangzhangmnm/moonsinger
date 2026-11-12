// test/e2e/put-down.mjs —— 真浏览器 E2E：放下手里的歌 = 出声的也停（施工单第五节 2026-11-12，user「首先是你退回图库的时候，播放应该停掉吧」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。「放下手里的歌」只有一个收尾点（src/app/main.ts putDownSong）：进歌库、打开另一首、新建都经过它。
//   守：编辑器里开着循环放（不会自己放完），然后 ① 打开另一首 ② 新建（三条杠「新建」）——走带都停了（改之前两个都接着响）。进歌库那个出口在 render-cache.mjs。
//   小月相在测试里不唱（静音块，同 transport.mjs）。跑：npm run build → npm run serve（8710）→ node test/e2e/put-down.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch(), errs = [];
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>P</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`;
for (const exit of ["打开另一首", "新建"]) {
  const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
  for (let i = 0; i < 12; i++) { await p.click(`.pad-key[data-k] >> nth=${i % 5}`); await p.waitForTimeout(25); }
  await p.evaluate(() => { window.__moonsinger.singer.sing = async () => ({ samples: new Float32Array(22050 * 12), sr: 22050 }); });
  const playing = () => p.evaluate(() => window.__moonsinger.engine.playing);
  const until = async (want, ms = 4000) => { const t0 = performance.now(); for (;;) { const v = await playing(); if (v === want || performance.now() - t0 > ms) return v; await p.waitForTimeout(80); } };
  await p.click("#playBtn", { button: "right" }); await p.waitForTimeout(80); await p.click('.ctx-menu [data-v="loop"]'); await p.waitForTimeout(100);
  await p.click("#playBtn");
  check(await until(true), `${exit}之前：循环放着`);
  if (exit === "打开另一首") await p.evaluate((xml) => { const m = window.__moonsinger; m.load(m.open("other.musicxml", new TextEncoder().encode(xml))); }, XML);
  else {   // 改过没存的无地稿：新建先问一句，答「不存」
    await p.click("#setBtn"); await p.waitForTimeout(150); await p.click('.main-menu [data-v="new"]'); await p.waitForTimeout(300);
    const ask = await p.$(".offer button:has-text('不存')") ?? await p.$(".offer button:has-text('丢掉')"); if (ask) await ask.click();
    check(!(await p.$(".offer")), "新建：问的那一句答了、面板收了");
  }
  check((await until(false, 1500)) === false, `${exit} = 走带停了（改之前接着响）`);
  await p.context().close();
}
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`put-down: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
