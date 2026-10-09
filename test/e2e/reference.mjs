// test/e2e/reference.mjs —— 真浏览器 E2E：参考窗（v0.8；@internal/reference-window 0.3.2，接缝 src/app/reference-host.ts）。
// 守：菜单开窗 = 给焦点；粘贴看焦点（窗有焦点 = 进窗、谱有焦点 = 不进窗）；窗有焦点时按键不写谱；加卡 = 标脏、不进撤销；存了再开都在（窗的位置也在）；
//   单张超过 4 MB 先问、取消 = 不加；参考清单比这一版新 = 明说、原样写回。
// created 2026-10-08 深夜 by Claude Opus 5.5（user「现在主要就是对着截图打谱哈哈哈」「文字也支持，反正就是无脑一包直接用」）
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/reference.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const H = () => p.evaluate(() => { const r = window.__moonsinger.refHost; return { open: r.isOpen(), focus: r.hasFocus(), n: r.count(), dirty: window.__moonsinger.dirty() }; });
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(60);
await p.click("#setBtn"); await p.waitForTimeout(150);
await p.click('.main-menu [data-v="ref"]'); await p.waitForTimeout(250);
let h = await H();
check(h.open && h.focus, "菜单「参考窗」= 开窗、给焦点", JSON.stringify(h));
// 窗有焦点：粘贴一张图 → 进窗
const paste = (kind) => p.evaluate(async (kind) => {
  const dt = new DataTransfer();
  if (kind === "image") { const c = document.createElement("canvas"); c.width = 160; c.height = 90; const g = c.getContext("2d"); g.fillStyle = "#357"; g.fillRect(0, 0, 160, 90); dt.items.add(new File([await new Promise((ok) => c.toBlob(ok, "image/png"))], "shot.png", { type: "image/png" })); }
  else dt.setData("text/plain", "Am F C G（副歌和声）");
  (document.activeElement ?? document.body).dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise((ok) => setTimeout(ok, 250));
}, kind);
const notes0 = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").length; });
await paste("image"); h = await H();
check(h.n === 1, "窗有焦点：粘贴图片 = 进窗", JSON.stringify(h));
await paste("text"); h = await H();
check(h.n === 2, "窗有焦点：粘贴文字 = 一张文字卡（和声笔记）", JSON.stringify(h));
await p.keyboard.press("Digit3"); await p.waitForTimeout(100);
const notes1 = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "note").length; });
check(notes1 === notes0, "窗有焦点：按数字键不写谱", `${notes0} → ${notes1}`);
check(h.dirty, "加卡 = 歌脏了（要存）");
// 撤销：撤的是谱，卡还在
await p.keyboard.press("Escape"); await p.waitForTimeout(100);
h = await H(); check(!h.focus && h.open, "Esc = 焦点回谱、窗留着", JSON.stringify(h));
await p.click("#undoBtn"); await p.waitForTimeout(150);
h = await H(); check(h.n === 2, "撤销不动参考窗的卡", JSON.stringify(h));
// 谱有焦点：粘贴不进窗
await paste("image"); h = await H();
check(h.n === 2, "谱有焦点：粘贴不进窗", JSON.stringify(h));
// 存了再开
const re = await p.evaluate(async () => {
  const m = window.__moonsinger; await m.refHost.settled(); const bytes = m.bytes(), list = m.zipList(bytes).filter((x) => x.includes("references")).sort();
  m.load(m.open("x.mxl", bytes)); await new Promise((ok) => setTimeout(ok, 300));
  return { list, n: m.refHost.count(), open: m.refHost.isOpen(), dirty: m.dirty() };
});
check(re.n === 2 && re.open && !re.dirty, "存了再开：两张卡、窗开着、不脏", JSON.stringify(re));
check(re.list.includes(".moonsinger/references/manifest.json") && re.list.some((x) => x.endsWith(".png")), "文件里有 .moonsinger/references/（清单 + 图）", re.list.join(","));
// 超过 4 MB：先问，取消 = 不加
const big = p.evaluate(async () => { const f = new File([new Uint8Array(4.2 * 1024 * 1024)], "huge.png", { type: "image/png" }); await window.__moonsinger.refHost.importFiles([f]); });
await p.waitForTimeout(300);
const sheet = await p.$$eval(".offer .offer-card", (e) => e.map((x) => x.textContent).join(" | "));
check(/很大/.test(sheet), "超过 4 MB：应用内面板问一句", sheet.slice(0, 80));
await p.click("text=算了"); await big; h = await H();
check(h.n === 2, "取消 = 不加", JSON.stringify(h));
// 参考清单比这一版新：明说，原样写回
const tooNew = await p.evaluate(async () => {
  const m = window.__moonsinger, o = m.open("x.mxl", m.bytes()), man = ".moonsinger/references/manifest.json";
  o.references = { [man]: new TextEncoder().encode('{"version":99,"items":[]}'), ".moonsinger/references/r0.bin": new Uint8Array([1, 2, 3]) };
  m.load(o); await new Promise((ok) => setTimeout(ok, 300));
  const back = m.open("y.mxl", m.bytes()).references;
  return { n: m.refHost.count(), open: m.refHost.isOpen(), keys: Object.keys(back).sort(), same: new TextDecoder().decode(back[man]) };
});
check(tooNew.n === 0 && !tooNew.open && tooNew.same === '{"version":99,"items":[]}' && tooNew.keys.length === 2, "比这一版新：不显示、原样写回", JSON.stringify(tooNew));
const errText = await p.$$eval(".notice, [role=alert]", (e) => e.map((x) => x.textContent).join(" | "));
check(/更新版本/.test(errText), "明说（更新版本的 app 存的）", errText.slice(0, 80));
check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\n  ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
