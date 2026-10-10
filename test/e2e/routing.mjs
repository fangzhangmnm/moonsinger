// test/e2e/routing.mjs —— 真浏览器 E2E：路由轨（v0.10.9）：加混音轨、发送、出到、总线接总线、不让接成环、删掉后引用改回总轨；被谁压（两位歌手）；离线混音走了路由。
// created 2026-10-10 by Claude Opus 5.5（user「插件：可以随便插，比如混响也是，你可以做中间的路由轨。比如我可以放两个路由轨然后放混响」「有一个默认总线，就是歌手和输出都是builtin的，但是你可以加混音轨」）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const N = (s) => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`;
const part = (id) => `<part id="${id}"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${N("C")}${N("D")}${N("E")}${N("F")}</measure></part>`;
const XML = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>B</part-name></score-part></part-list>${part("P1")}${part("P2")}</score-partwise>`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(700);
// 别家谱不自动选角：删掉两个角色的快照 = 按默认的月读（没有角色快照 = 默认月读），唱换成假唱（离线混音要有声）
await p.evaluate((xml) => { const m = window.__moonsinger, o = m.open("t.musicxml", new TextEncoder().encode(xml)); for (const r of Object.keys(o.extras.lounge)) delete o.extras.lounge[r]; m.load(o); m.singer.sing = async () => ({ samples: new Float32Array(22050 * 3).fill(0.2), sr: 22050 }); }, XML);
await p.waitForTimeout(300);
await p.click('.mode-seg [data-mode="listen"]'); await p.waitForTimeout(250);
const ids = await p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => ({ id: x.id, mic: x.mic })));
const tracks = () => p.evaluate(() => window.__moonsinger.studioTracks());
const tr = async (id) => (await tracks()).find((t) => t.id === id);
const peak = () => p.evaluate(async () => { const m = await window.__moonsinger.renderMix(); let pk = 0; for (const v of m.samples) pk = Math.max(pk, Math.abs(v)); return pk; });
const strip = (id) => `.strip[data-id="${id}"]`;

const tab = async (t) => { await p.click(`.mix-tabbar [data-tab="${t}"]`); await p.waitForTimeout(120); };
const addBus = async () => { await p.click('.mix-tabbar [data-v="more"]'); await p.waitForTimeout(80); await p.click('.mix-menu [data-v="addbus"]'); await p.waitForTimeout(150); };
check(!(await p.$('.studio-strips [data-v="addbus"]')), "加混音轨不占一张空卡片（在「⋯」里；user「混音轨不要用一个单独的空页面」）");
await addBus(); await addBus();
const buses = (await tracks()).filter((t) => t.kind === "bus");
check(buses.length === 2 && buses[0].name === "混音轨 1" && buses[1].name === "混音轨 2", "＋ 混音轨 两次 = 两条（混音轨 1 / 2）", JSON.stringify(buses.map((x) => x.name)));
const [b1, b2] = buses.map((x) => x.id);
// 混音轨 1 出到 混音轨 2；混音轨 2 的「出到」里就不能再选混音轨 1（会接成环）
await tab("send");
await p.selectOption(`${strip(b1)} select[data-out]`, b2); await p.waitForTimeout(150);
check((await tr(b1)).to === b2, "混音轨 1 出到 混音轨 2（总线接总线）");
const b2opts = await p.$$eval(`${strip(b2)} select[data-out] option`, (os) => os.map((o) => o.value));
check(!b2opts.includes(b1), "混音轨 2 的「出到」里没有混音轨 1（不让接成环）", JSON.stringify(b2opts));
// A 出到 混音轨 1；混音轨 2 上插一格增益 −6 → 离线混音里 A 那一份减半
const pk0 = await peak();
await p.selectOption(`${strip(ids[0].id)} select[data-out]`, b1); await p.waitForTimeout(150);
check((await tr(ids[0].mic)).to === b1, "歌手 A 出到 混音轨 1");
await tab("chain"); await p.click(`${strip(b2)} [data-v="fxadd"]`); await p.click(`${strip(b2)} [data-v="fxpick"][data-kind="gain"]`); await p.waitForTimeout(150);
await p.$eval('.fx-panel input[data-c="dB"]', (el) => { el.value = "-40"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(150);
const pk1 = await peak();
check(pk1 < pk0 * 0.9, "A → 混音轨 1 → 混音轨 2（增益 −40）→ 总轨：离线混音里 A 那一份几乎没了（B 照旧）", `${pk0.toFixed(3)} → ${pk1.toFixed(3)}`);
// 混音轨整条旁通（v0.10.23；user「混音轨和每个插件都可以toggle bypass」）：混音轨 2 旁通 = 它的增益 −40 不响了、A 回来；参数留着；再点回来
await tab("basic"); await p.click(`${strip(b2)} [data-v="busbypass"]`); await p.waitForTimeout(150);
{ const pk2 = await peak(), t2 = await tr(b2);
  check(t2.bypass === true && t2.chain.length === 1 && Math.abs(pk2 / pk0 - 1) < 0.05, "混音轨 2 旁通 = 链上的 −40 跳过（A 回来）、链留着、存成 bypass: true", `${pk0.toFixed(3)} → ${pk2.toFixed(3)} ${JSON.stringify({ bypass: t2.bypass, chain: t2.chain.length })}`);
  await p.click(`${strip(b2)} [data-v="busbypass"]`); await p.waitForTimeout(150);
  const raw = await p.evaluate((id) => window.__moonsinger.extras().studio.tracks.find((t) => t.id === id), b2);
  check(!("bypass" in raw) && Math.abs((await peak()) / pk1 - 1) < 0.05, "再点 = 回来；文件里不留 bypass 字段"); }
await tab("chain");
// 发送：B 发给 混音轨 1，−12 dB 起步，拖到 −6
await tab("send");
await p.selectOption(`${strip(ids[1].id)} select[data-sendadd]`, b1); await p.waitForTimeout(150);
check(JSON.stringify((await tr(ids[1].mic)).sends) === JSON.stringify([{ to: b1, gainDb: -12 }]), "B 发给 混音轨 1（−12 dB 起步）", JSON.stringify((await tr(ids[1].mic)).sends));
await p.$eval(`${strip(ids[1].id)} input[data-send="${b1}"]`, (el) => { el.value = "-6"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(150);
check((await tr(ids[1].mic)).sends[0].gainDb === -6, "拖发送量 = −6 dB");
// 出到一条插了混响（不是全湿）的混音轨 = 明说几条轨一样多、原声被关小（v0.10.15）
await tab("chain"); await p.click(`${strip(b1)} [data-v="fxadd"]`); await p.click(`${strip(b1)} [data-v="fxpick"][data-kind="reverb"]`); await p.waitForTimeout(150);
await tab("send");
check((await p.textContent(`${strip(ids[0].id)}`)).includes("是全湿的"), "混音轨上插的混响默认全湿 = 出到它的 A 卡片上明说「原声没了」");
await tab("chain"); if (await p.$eval(".fx-panel", (e) => e.hidden)) { await p.click(`${strip(b1)} .fx-chip[data-fx="reverb1"]`); await p.waitForTimeout(120); }
await p.click('.fx-panel [data-v="fxmode"][data-mode="full"]'); await p.waitForTimeout(120);
await p.$eval('.fx-panel input[data-p="dry"]', (el) => { el.value = "-3.5"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(150);
await tab("send");
{ const t = await p.textContent(`${strip(ids[0].id)}`); check(t.includes("一样多") && t.includes("-3.5 dB"), "改成留原声（−3.5 dB）= 出到它的 A 卡片上明说「几条轨一样多、原声被关小 3.5 dB」", t.slice(0, 200)); }
await p.evaluate(() => { window.__moonsinger.undo(); window.__moonsinger.undo(); }); await p.waitForTimeout(150);
check(!(await tr(b1)).chain.length, "撤销两次 = 混响拿掉");
// 自动低切在混音轨上用不上
await tab("eq");
check((await p.textContent(`${strip(b1)}`)).includes("用不上"), "混音轨的 EQ：自动低切写「用不上」（没有音）");
// 改名（基础页）；混音轨之间排前后（user「混音轨之间还可以排序」）
await tab("basic");
const order = async () => (await tracks()).filter((t) => t.kind === "bus").map((t) => t.id).join(",");
await p.click(`${strip(b2)} [data-v="busleft"]`); await p.waitForTimeout(150);
check((await order()) === `${b2},${b1}`, "混音轨 2 往前挪 = 排在混音轨 1 前面", await order());
check(await p.$eval(`.studio-strips .strip.bus >> nth=0`, (e) => e.dataset.id) === b2 && await p.$eval(`.studio-strips .strip >> nth=0`, (e) => e.classList.contains("master")), "卡片顺序：总轨 → 混音轨（按排好的）→ 歌手");
await p.click(`${strip(b2)} [data-v="busright"]`); await p.waitForTimeout(150);
await p.fill(`${strip(b1)} .bus-name`, "混响"); await p.press(`${strip(b1)} .bus-name`, "Tab"); await p.waitForTimeout(150);
check((await tr(b1)).name === "混响", "混音轨改名");
// 歌手排序（v0.10.17；user「混音台里面还是应该支持歌手顺序排序」）= 谱上声部的顺序；能撤销
{ const order = () => p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => x.id).join(","));
  const o0 = await order();
  check(await p.$eval(`${strip(ids[0].id)} [data-v="partleft"]`, (e) => e.disabled), "第一位歌手的「‹」灰着");
  await p.click(`${strip(ids[1].id)} [data-v="partleft"]`); await p.waitForTimeout(150);
  const cards = await p.$$eval(".studio-strips .strip:not(.master):not(.bus)", (es) => es.map((e) => e.dataset.id).join(","));
  check((await order()) === `${ids[1].id},${ids[0].id}` && cards === `${ids[1].id},${ids[0].id}`, "B 往前挪 = 谱上声部顺序换了、混音台卡片跟着换", `${await order()} / ${cards}`);
  await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
  check((await order()) === o0, "能撤销"); }
// 被谁压：两位歌手 = 能选另一位
await tab("chain");
await p.click(`${strip(ids[0].id)} [data-v="fxadd"]`); await p.click(`${strip(ids[0].id)} [data-v="fxpick"][data-kind="comp"]`); await p.waitForTimeout(150);
await p.selectOption('.fx-panel select[data-key]', ids[1].id); await p.waitForTimeout(150);
check((await tr(ids[0].mic)).chain.find((f) => f.kind === "comp")?.key === ids[1].id, "A 上的压缩「被谁压」= B（侧链）");
// 侧链让路不补偿（v0.10.15；查 user 的 団子大家族 发现被压的轨平时比推子响 2.8 dB）：换「被谁压」= 一键照旧是一键、「压多少」不变、补偿 0
{ const c = (await tr(ids[0].mic)).chain.find((f) => f.kind === "comp");
  check(c.params.makeupDb === 0 && c.params.thresholdDb === -15 && !(await p.$(".fx-panel .fx-note")) && (await p.textContent(".fx-panel .fx-body")).includes("让多少"), "设了「被谁压」= 补偿 0、阈值不动、一键没锁（旋钮叫「让多少」）", JSON.stringify(c.params));
  await p.selectOption('.fx-panel select[data-key]', ""); await p.waitForTimeout(150);
  const c2 = (await tr(ids[0].mic)).chain.find((f) => f.kind === "comp");
  check(!c2.key && c2.params.makeupDb > 0 && c2.params.thresholdDb === -15, "改回「不用」= 补偿回来（自己压自己那套）", JSON.stringify(c2.params));
  await p.selectOption('.fx-panel select[data-key]', ids[1].id); await p.waitForTimeout(150); }
// 删掉混音轨 1：出到它的、发给它的都改回总轨 / 拿掉
await tab("basic");
await p.click(`${strip(b1)} [data-v="delbus"]`); await p.waitForTimeout(150);
check((await tr(ids[0].mic)).to === "master" && (await tr(ids[1].mic)).sends.length === 0 && !(await tr(b1)), "删掉混音轨 1 = A 改回出到总轨、B 不再发给它", JSON.stringify(await tracks()));
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
check(!!(await tr(b1)) && (await tr(ids[0].mic)).to === b1, "撤销 = 混音轨和连线都回来");
// 插件参数拷贝（v0.10.23；user「效果器预设可以拷贝，类似Unity的component，尽量严格一点避免混淆。不读快捷键」）：A 的 EQ 拷参数 → B 的 EQ 粘参数 = 一样；B 的压缩上没有「粘参数」（种类不同）；「＋」里粘成新的一格
await tab("chain");
if (await p.$eval(".fx-panel", (e) => e.hidden) === false) await p.click('.fx-panel [data-v="fxclose"]').catch(() => {});
await p.click(`${strip(ids[0].id)} .fx-chip[data-fx="eq"]`); await p.waitForTimeout(120);
await p.click('.fx-panel [data-v="fxmode"][data-mode="full"]'); await p.waitForTimeout(100);
await p.$eval('.fx-panel input[data-p="midDb"]', (el) => { el.value = "-5"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(120);
await p.click('.fx-panel [data-v="fxcopy"]'); await p.waitForTimeout(80);
await p.click(`${strip(ids[1].id)} .fx-chip[data-fx="eq"]`); await p.waitForTimeout(120);
check(!!(await p.$('.fx-panel [data-v="fxpaste"]')), "B 的 EQ 面板上有「粘参数」");
await p.click('.fx-panel [data-v="fxpaste"]'); await p.waitForTimeout(150);
{ const ea = (await tr(ids[0].mic)).chain.find((f) => f.id === "eq"), eb = (await tr(ids[1].mic)).chain.find((f) => f.id === "eq");
  check(!!eb && JSON.stringify(eb.params) === JSON.stringify(ea.params) && eb.params.midDb === -5, "粘参数 = B 的 EQ 和 A 的一模一样", JSON.stringify(eb?.params)); }
{ const comp = (await tr(ids[0].mic)).chain.find((f) => f.kind === "comp");
  check(!!comp, "A 上有一台压缩（前面插的）");
  await p.click(`${strip(ids[0].id)} .fx-chip[data-fx="${comp.id}"]`); await p.waitForTimeout(120);
  check(!!(await p.$('.fx-panel [data-v="fxcopy"]')) && !(await p.$('.fx-panel [data-v="fxpaste"]')), "拷的是 EQ：压缩的面板上没有「粘参数」（种类不同不让粘）"); }
const nB = (await tr(ids[1].mic)).chain.length;
await p.click(`${strip(ids[1].id)} [data-v="fxadd"]`); await p.waitForTimeout(100);
await p.click(`${strip(ids[1].id)} [data-v="fxpastenew"]`); await p.waitForTimeout(150);
{ const ch = (await tr(ids[1].mic)).chain;
  check(ch.length === nB + 1 && ch.at(-1).kind === "eq" && ch.at(-1).params.midDb === -5, "「＋」里粘成新的一格 = 链尾多一格一样的 EQ", JSON.stringify(ch.map((f) => f.id))); }
// 差设备（v0.10.17；user「以及注意一下差设备上的性能影响」）：滚出去看不见的卡片不算 FFT、不画；滚回来才画
await p.setViewportSize({ width: 1100, height: 420 }); await tab("eq"); await p.waitForTimeout(200);
await p.$eval(".studio-strips", (e) => { e.scrollTop = 0; }); await p.evaluate(() => { const s = document.querySelector(".studio"); if (s) s.scrollTop = 0; });
await p.click("#playBtn"); await p.waitForTimeout(1500);
{ const last = await p.$$eval(".studio-strips .strip[data-id]", (es) => { const vh = innerHeight; const el = es.at(-1); const r = el.getBoundingClientRect(); return { id: el.dataset.id, off: r.top > vh || r.bottom < 0, d: el.querySelector(".strip-spec .spec")?.getAttribute("d") ?? "" }; });
  const first = await p.$eval(".studio-strips .strip[data-id]", (el) => el.querySelector(".strip-spec .spec")?.getAttribute("d") ?? "");
  check(first.length > 0 && (!last.off || last.d === ""), "看得见的卡片画频谱、滚出去的不画", `first ${first.length} / last off=${last.off} d=${last.d.length}`);
  await p.$eval(`.strip[data-id="${last.id}"]`, (el) => el.scrollIntoView()); await p.waitForTimeout(900);
  check(((await p.$eval(`.strip[data-id="${last.id}"] .strip-spec .spec`, (e) => e.getAttribute("d"))) ?? "").length > 0, "滚回来 = 接着画"); }
if (await p.evaluate(() => window.__moonsinger.engine.playing)) await p.click("#playBtn");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nrouting: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
