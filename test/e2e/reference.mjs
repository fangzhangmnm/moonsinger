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
check(/有点大/.test(sheet), "超过 1 MB：应用内面板问一句", sheet.slice(0, 80));
const order = await p.$$eval(".offer .sheet-choices button", (e) => e.map((x) => x.textContent));
check(/只放内存（推荐）/.test(order[0] ?? ""), "超过 4 MB：「只放内存」排第一（推荐）", order.join(" | "));
await p.click(".offer-btns >> text=算了"); await big; h = await H();
check(h.n === 2, "取消 = 不加", JSON.stringify(h));

// ── 库 0.4.0：音频卡 + 压一下 + 只放内存（2026-10-09）──
const wav = (name, sec) => p.evaluate(({ name, sec }) => {   // 立体声 44.1k 16 位：sec 秒 ≈ 176 KB / 秒
  const n = Math.round(sec * 44100), b = new ArrayBuffer(44 + n * 4), v = new DataView(b), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + n * 4, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 44100 * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { const x = Math.round(Math.sin((i / 44100) * 2 * Math.PI * 440) * 6000); v.setInt16(44 + i * 4, x, true); v.setInt16(46 + i * 4, x, true); }
  window.__wav = new File([b], name, { type: "audio/wav" });
}, { name, sec });
const deckOf = () => p.evaluate(() => window.__moonsinger.refHost.el.deck.cards().map((c) => ({ kind: c.kind, name: c.name, mime: c.mime, size: c.bytes?.size ?? null, ram: c.ram })));
await wav("扒谱.wav", 8);
const imp1 = p.evaluate(async () => { await window.__moonsinger.refHost.importFiles([window.__wav]); });
await p.waitForTimeout(600);
const s1 = await p.$$eval(".offer .sheet-choices button", (e) => e.map((x) => x.textContent));
check(/存进歌里/.test(s1[0] ?? "") && s1.some((x) => /压一下再存（约 0\.1 MB）/.test(x)) && s1.some((x) => /只放内存/.test(x)), "1.4 MB 的 wav：问（存进歌里排第一、压一下带估计、只放内存）", s1.join(" | "));
await p.click(".offer .sheet-choices >> text=压一下再存"); await imp1; await p.waitForTimeout(300);
let dk = await deckOf(), a = dk.find((c) => c.name === "扒谱.wav");
check(a && a.kind === "audio" && a.mime === "audio/mpeg" && a.size > 100_000 && a.size < 160_000, "压一下 = mp3 128k（8 秒约 128 KB）", JSON.stringify(a));
check(await p.$eval("wp-reference-window", (el) => el.shadowRoot.querySelector(".audio").classList.contains("shown")), "音频卡：播放层露出来");
await p.click("wp-reference-window .aplay"); await p.waitForTimeout(400);
check(await p.evaluate(() => window.__moonsinger.refHost.el.playing), "点播放钮 = 放起来");
await p.click("wp-reference-window .aplay"); await p.waitForTimeout(100);
check(!(await p.evaluate(() => window.__moonsinger.refHost.el.playing)), "再点 = 停");
// 只放内存：存了再开 = 空位（字节不进文件）；同名拖回来 = 补回原位
await wav("现场.wav", 7);
const imp2 = p.evaluate(async () => { await window.__moonsinger.refHost.importFiles([window.__wav]); });
await p.waitForTimeout(500); await p.click(".offer .sheet-choices >> text=只放内存"); await imp2; await p.waitForTimeout(300);
dk = await deckOf(); a = dk.find((c) => c.name === "现场.wav");
check(a && a.ram && a.ram.bytes === a.size && a.size > 1_000_000, "只放内存：卡上有字节、标着 ram", JSON.stringify(a));
check(await p.evaluate(() => window.__moonsinger.dirty()), "加了卡 = 标脏");
const ramRe = await p.evaluate(async () => {
  const m = window.__moonsinger; await m.refHost.settled(); const bytes = m.bytes(), refs = m.zipList(bytes).filter((x) => x.includes("references"));
  const big = refs.filter((x) => !x.endsWith(".json")).length;
  m.load(m.open("x.mxl", bytes)); await new Promise((ok) => setTimeout(ok, 400));
  const c = m.refHost.el.deck.cards().find((x) => x.name === "现场.wav"); m.refHost.el.deck.select(m.refHost.el.deck.indexOf(c.id)); await new Promise((ok) => setTimeout(ok, 100));
  return { refs, big, hole: !c.bytes && c.ram?.bytes > 0, line: m.refHost.el.shadowRoot.querySelector(".aname").textContent, disabled: m.refHost.el.shadowRoot.querySelector(".aplay").disabled, dirty: m.dirty() };
});
check(ramRe.big === 3, "文件里只有两张图 + 压过的 mp3（只放内存的那段没进去）", ramRe.refs.join(","));
check(ramRe.hole && /现场\.wav · .* MB — 只在内存里/.test(ramRe.line) && ramRe.disabled && !ramRe.dirty, "存了再开 = 空位：写着名字 · 大小 + 怎么补，播放钮按不动，不脏", JSON.stringify(ramRe));
await wav("现场.wav", 7);
await p.evaluate(async () => { await window.__moonsinger.refHost.importFiles([window.__wav]); }); await p.waitForTimeout(300);
const sheets = await p.$$eval(".offer .offer-card", (e) => e.length);
dk = await deckOf(); a = dk.find((c) => c.name === "现场.wav");
check(sheets === 0 && a.size > 1_000_000 && a.ram && dk.filter((c) => c.name === "现场.wav").length === 1, "同名拖回来 = 补回原位（不问、不新加，照旧只放内存）", JSON.stringify({ sheets, a }));
check(!(await p.evaluate(() => window.__moonsinger.dirty())), "补回空位不标脏（文件里本来就没有它）");
// 小于 1 MB 的图 = 不问
await p.evaluate(async () => { const c = document.createElement("canvas"); c.width = c.height = 8; const b = await new Promise((r) => c.toBlob(r, "image/png")); await window.__moonsinger.refHost.importFiles([new File([b], "小.png", { type: "image/png" })]); });
await p.waitForTimeout(200);
check((await p.$$eval(".offer .offer-card", (e) => e.length)) === 0 && (await deckOf()).some((c) => c.name === "小.png"), "小于 1 MB：不问、直接加");
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
