// test/e2e/parts-manager.mjs —— 真浏览器 E2E：声部管理（v0.16.19 搬家 D；v0.16.84 重做成一个声部一行）。
// created 2026-11-08 by Claude Opus 5.5；v0.16.84 改写 2026-11-10 by Claude Opus 5.5（user 11-09「parts应该比现状要compact很多，这样有十几个乐器一屏就能管理看完」
//   「这里应该加delete的选项，记得护栏」；11-10「拿掉应该也是删除吧？…你必须得讲明白它是删除」「二选乙」）。设计稿 ai-docs/20261110-wave2-four-designs.md 第三节。
// 守：名字小卡 = 换乐器 / 乐器设置 / 声部管理 / 删掉声部（红）；从名字进来 = 那一行的 ⋯ 已展开（在上面加 / 在下面加 / 交给 / 从这一段删掉 / 删掉声部）；
//   一行一个声部、行高 ≤ 44px（十二个一屏）；改名、下移、小格放进 / 从那一段删掉（写了先问、红钮）、某一段只剩它 = 删不了；
//   删掉声部：写了东西 = 红色确认框写明哪几段几个音、一步撤销全回来；它是某一段唯一的声部 = 不删、说是哪几段（乙）。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/parts-manager.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 2; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const order = () => p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => x.id).join(","));
const close = async () => { if (await p.$(".parts-mgr")) { await p.click('.parts-mgr [data-v="close"]'); await p.waitForTimeout(120); } };
const card = async (n = 0) => { await close(); await p.keyboard.press("Escape"); await p.waitForTimeout(80); await p.click(`#score text.part-name >> nth=${n}`); await p.waitForTimeout(200); };
const mgr = async (n = 0) => { await card(n); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(220); };
const P1 = await p.evaluate(() => window.__moonsinger.state().song.parts[0].id);
const text = () => p.evaluate(() => document.body.innerText);
await card();
check((await p.$$eval(".track-card [data-v]", (bs) => bs.map((b) => b.dataset.v).join(","))) === "tg:hidden,tg:only,tg:muted,tg:solo,swap,inst,parts,delpart" && !!(await p.$('.track-card [data-v="delpart"].danger')), "小卡：隐藏 / 只看它 / 静音 / 独奏（12-2 补）+ 换乐器 / 乐器设置 / 声部管理 / 删掉声部（红）", await p.$$eval(".track-card [data-v]", (bs) => bs.map((b) => b.dataset.v).join(",")));
await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(220);
check(!!(await p.$(`.parts-mgr .pm-acts [data-v="addabove:${P1}"]`)) && !!(await p.$(`.parts-mgr .pm-acts [data-v="giveof:${P1}"]`)) && !!(await p.$(`.parts-mgr .pm-acts [data-v="delpart:${P1}"].danger`)), "从名字进来：这一行的 ⋯ 已展开（在上面加 / 交给 / 删掉声部）");
// 下面加一位新的
await p.click(`.parts-mgr [data-v="addbelow:${P1}"]`); await p.waitForTimeout(150); await p.click('.parts-mgr [data-v="addnew"]'); await p.waitForTimeout(350); await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(300);
const o1 = (await order()).split(",");
check(o1.length === 2 && o1[0] === P1, "在下面加 = 新歌手排在它后面", o1.join(","));
const P2 = o1[1];
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
await p.evaluate((id) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, part: id } }); }, P1); await p.waitForTimeout(120);
await mgr(0);
await p.click(`.parts-mgr [data-v="addabove:${P1}"]`); await p.waitForTimeout(150); await p.click('.parts-mgr [data-v="addnew"]'); await p.waitForTimeout(350); await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(300);
const o2 = (await order()).split(",");
check(o2.length === 3 && o2[1] === P1 && o2[2] === P2, "在上面加 = 新歌手排在它前面", o2.join(","));
const P3 = o2[0];
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
await card(0); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(250);
const rowH = await p.$$eval(".parts-mgr .pm-row", (rs) => Math.max(...rs.map((r) => r.getBoundingClientRect().height)));
check(!(await p.$(".track-card")) && (await p.$$(".parts-mgr .pm-row")).length === 3 && rowH <= 44, "一页，每个声部一行、行高 ≤ 44px（十二个一屏）", `rowH=${rowH}`);
await p.fill(`.pm-name[data-pid="${P1}"]`, "Lead"); await p.press(`.pm-name[data-pid="${P1}"]`, "Enter"); await p.waitForTimeout(250);
check((await p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(","))).includes("Lead"), "改名 = 谱上名字跟着");
if (!(await p.$(`.parts-mgr [data-v="down:${P3}"]`))) { await p.click(`.parts-mgr [data-v="more:${P3}"]`); await p.waitForTimeout(120); }   // 从 P3 的名字进来 = 它那一行已经展开
await p.click(`.parts-mgr [data-v="down:${P3}"]`); await p.waitForTimeout(200);
check((await order()) === [P1, P3, P2].join(","), "⋯ → 下移 = 全曲顺序往下挪", await order());
// 第二段：小格
await p.click('.parts-mgr [data-v="close"]'); await p.waitForTimeout(100);
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(250);
const [pa, pb] = await p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => x.id));
await card(0); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(250);
const onB = () => p.evaluate((pb) => Object.keys(window.__moonsinger.state().song.papers.find((x) => x.id === pb).tracks).sort().join(","), pb);
await p.click(`.parts-mgr [data-v="pp:${pb}:${P2}"]`); await p.waitForTimeout(250);
await p.click(`.parts-mgr [data-v="pp:${pb}:${P3}"]`); await p.waitForTimeout(250);
check((await onB()) === P1 && /已从/.test(await text()), "点亮着的小格 = 从那一段删掉（没写东西 = 直接删、说一句）", await onB());
await p.click(`.parts-mgr [data-v="pp:${pb}:${P1}"]`); await p.waitForTimeout(200);
check((await onB()) === P1 && /删不了/.test(await text()), "那一段只剩它 = 删不了、说一声");
await p.click(`.parts-mgr [data-v="pp:${pb}:${P2}"]`); await p.waitForTimeout(150);
check((await onB()) === [P1, P2].sort().join(","), "点暗的 = 放进去", await onB());
const onA = () => p.evaluate((pa) => Object.keys(window.__moonsinger.state().song.papers.find((x) => x.id === pa).tracks).sort().join(","), pa);
const a0 = await onA();
await p.click(`.parts-mgr [data-v="pp:${pa}:${P1}"]`); await p.waitForTimeout(250);
check(!!(await p.$('.offer [data-v="ok"].danger')) && /个音/.test(await text()) && /一行空的/.test(await text()), "写了音的那一段：先问，红钮、写着删几个音、再放回来是空的");
await p.click('.offer [data-v="no"]'); await p.waitForTimeout(250);
check((await onA()) === a0 && !!(await p.$(".parts-mgr")), "「算了」= 不动，回到声部管理", await onA());
// 让 B 段只剩 P2，再删 P2 = 不让删（乙）
await p.click(`.parts-mgr [data-v="pp:${pb}:${P1}"]`); await p.waitForTimeout(250);
if (await p.$('.offer [data-v="ok"]')) { await p.click('.offer [data-v="ok"]'); await p.waitForTimeout(250); }
check((await onB()) === P2, "B 段只剩 P2", await onB());
if (!(await p.$(".parts-mgr"))) await mgr(0);
if (!(await p.$(`.parts-mgr [data-v="delpart:${P2}"]`))) { await p.click(`.parts-mgr [data-v="more:${P2}"]`); await p.waitForTimeout(120); }
await p.click(`.parts-mgr [data-v="delpart:${P2}"]`); await p.waitForTimeout(250);
check((await order()).split(",").includes(P2) && /唯一的声部/.test(await text()), "它是某一段唯一的声部 = 不删、说是哪几段（user 11-10 选乙）", await order());
// 删掉一个写了音的声部：确认框写明哪一段几个音 → 删 → 一步撤销全回来
if (!(await p.$(".parts-mgr"))) await mgr(0);
if (!(await p.$(`.parts-mgr [data-v="delpart:${P1}"]`))) { await p.click(`.parts-mgr [data-v="more:${P1}"]`); await p.waitForTimeout(120); }
await p.click(`.parts-mgr [data-v="delpart:${P1}"]`); await p.waitForTimeout(250);
check(!!(await p.$('.offer [data-v="ok"].danger')) && /个音/.test(await text()) && /一步全找回/.test(await text()), "删掉声部（写了音）：红色确认框，写着哪一段几个音、能一步撤销");
await p.click('.offer [data-v="ok"]'); await p.waitForTimeout(300);
check(!(await order()).split(",").includes(P1), "删掉了", await order());
if (await p.$(".parts-mgr")) { await p.click('.parts-mgr [data-v="close"]'); await p.waitForTimeout(100); }
await p.click("#undoBtn"); await p.waitForTimeout(250);
check((await order()).split(",").includes(P1) && (await onA()).includes(P1), "撤销一步 = 声部和它写的都回来", `${await order()} / ${await onA()}`);
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nparts-manager: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
