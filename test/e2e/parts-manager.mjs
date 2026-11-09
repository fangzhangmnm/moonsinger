// test/e2e/parts-manager.mjs —— 真浏览器 E2E：声部管理一页 + 歌手名小卡的下半截「这一段」（v0.16.19 搬家 D）。
// created 2026-11-08 by Claude Opus 5.5（user 11-07「第四类就是上移下移管理，然后他们也能系统的弄一下」；
//   搬家清单一到六 + 「单独一页其实也是我比较想要的，先按这个做，不舒服我以后再说」）。
// 守：小卡里没有「顺序」了；「这一段」= 交给 / 上面加 / 下面加 / 这一段不要它 +「声部管理…」；
//   下面加 = 新歌手排在这一位后面、上面加 = 排在前面（全曲顺序）；已有的歌手加进这一段也挨着这一行；
//   声部管理：每位一行、改名 = 谱上名字跟着、↑↓ = 全曲顺序、点段 = 放进 / 拿出、只剩它的拿不出、一段都不在 = 能删、能撤销。
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
await card();
check(!(await p.$('.track-card [data-v="moveup"], .track-card [data-v="addabove"], .track-card [data-v="give"], .track-card [data-v="score-look"]')), "小卡里只剩三颗：换乐器 / 乐器设置 / 声部管理（v0.16.21）");
check((await p.$$eval(".track-card [data-v]", (bs) => bs.map((b) => b.dataset.v).join(","))) === "swap,inst,parts", "三颗的顺序", await p.$$eval(".track-card [data-v]", (bs) => bs.map((b) => b.dataset.v).join(",")));
await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(220);
check(/ · /.test(await p.$eval(".parts-mgr .pm-here", (e) => e.textContent)) && !!(await p.$('.parts-mgr .pm-here [data-v="addabove"]')) && !!(await p.$('.parts-mgr .pm-here [data-v="give"]')) && !(await p.$('.parts-mgr .pm-here [data-v="drop"]')), "从名字进声部管理：顶上一条 = 这一段的事（上面加 / 下面加 / 交给；这一段只有它 = 没有「从这一段删掉」）");
// 下面加一位新的
await p.click('.parts-mgr [data-v="addbelow"]'); await p.waitForTimeout(150); await p.click('.parts-mgr [data-v="addnew"]'); await p.waitForTimeout(350); await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(300);
const o1 = (await order()).split(",");
check(o1.length === 2 && o1[0] === P1, "下面加 = 新歌手排在它后面", o1.join(","));
const P2 = o1[1];
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
// 上面加一位新的（对着 P1）
await p.evaluate((id) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, part: id } }); }, P1); await p.waitForTimeout(120);
await mgr(0);
await p.click('.parts-mgr [data-v="addabove"]'); await p.waitForTimeout(150); await p.click('.parts-mgr [data-v="addnew"]'); await p.waitForTimeout(350); await p.evaluate(() => window.__moonsinger.finderCastVoice()); await p.waitForTimeout(300);
const o2 = (await order()).split(",");
check(o2.length === 3 && o2[1] === P1 && o2[2] === P2, "上面加 = 新歌手排在它前面", o2.join(","));
const P3 = o2[0];
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
// 声部管理
await card(0);
await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(250);
check(!(await p.$(".track-card")) && (await p.$$(".parts-mgr .pm-row")).length === 3, "「声部管理…」= 一页，每个声部一行");
await p.fill(`.pm-name[data-pid="${P1}"]`, "Lead"); await p.press(`.pm-name[data-pid="${P1}"]`, "Enter"); await p.waitForTimeout(250);
check((await p.$$eval("#score text.part-name", (ts) => ts.map((t) => t.textContent).join(","))).includes("Lead"), "改名 = 谱上名字跟着");
await p.click(`.parts-mgr [data-v="down:${P3}"]`); await p.waitForTimeout(200);
check((await order()) === [P1, P3, P2].join(","), "↓ = 全曲顺序往下挪", await order());
// 第二张纸：在哪几段
await p.click('.parts-mgr [data-v="close"]'); await p.waitForTimeout(100);
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(250);
const [pa, pb] = await p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => x.id));
await card(0); await p.click('.track-card [data-v="parts"]'); await p.waitForTimeout(250);
const onB = () => p.evaluate((pb) => Object.keys(window.__moonsinger.state().song.papers.find((x) => x.id === pb).tracks).sort().join(","), pb);
await p.click(`.parts-mgr [data-v="pp:${pb}:${P2}"]`); await p.waitForTimeout(250);
await p.click(`.parts-mgr [data-v="pp:${pb}:${P3}"]`); await p.waitForTimeout(250);
check((await onB()) === P1, "点段 = 从那一段拿出来", await onB());
await p.click(`.parts-mgr [data-v="pp:${pb}:${P1}"]`); await p.waitForTimeout(200);
check((await onB()) === P1 && /删不了/.test(await p.evaluate(() => document.body.innerText)), "那一段只剩它 = 删不了、说一声");
await p.click(`.parts-mgr [data-v="pp:${pb}:${P2}"]`); await p.waitForTimeout(150);
check((await onB()) === [P1, P2].sort().join(","), "再点 = 放进去", await onB());
// 写了东西的那一段：点掉 = 先问（红色「删掉」），「算了」= 不动（v0.16.21；user 11-08「而且是红色，而且要确认要有护栏」）
const onA = () => p.evaluate((pa) => Object.keys(window.__moonsinger.state().song.papers.find((x) => x.id === pa).tracks).sort().join(","), pa);
const a0 = await onA();
await p.click(`.parts-mgr [data-v="pp:${pa}:${P1}"]`); await p.waitForTimeout(250);
check(!!(await p.$('.offer [data-v="ok"].danger')) && /个音/.test(await p.evaluate(() => document.body.innerText)), "写了音的那一段：先问，确认钮是红的、写着删几个音");
await p.click('.offer [data-v="no"]'); await p.waitForTimeout(250);
check((await onA()) === a0 && !!(await p.$(".parts-mgr")), "「算了」= 不动，回到声部管理", await onA());
// 一段都不在 = 能删、能撤销
await p.click(`.parts-mgr [data-v="pp:${pa}:${P3}"]`); await p.waitForTimeout(250);
check(!!(await p.$(`.parts-mgr [data-v="del:${P3}"]`)) && !(await p.$(`.parts-mgr [data-v="del:${P1}"]`)), "一段都不在的那位才有「删掉」");
await p.click(`.parts-mgr [data-v="del:${P3}"]`); await p.waitForTimeout(200);
check((await order()) === [P1, P2].join(",") && (await p.$$(".parts-mgr .pm-row")).length === 2, "删掉了", await order());
await p.click('.parts-mgr [data-v="close"]'); await p.waitForTimeout(100);
await p.click("#undoBtn"); await p.waitForTimeout(200);
check((await order()).split(",").length === 3, "撤销能找回来", await order());
// 已有的歌手加进这一段：挨着这一行（撤销后 P3 = 一段都不在、排在 P1 后面；对着 P1 上面加 = 真挪到 P1 前面）
await p.evaluate(([pa, id]) => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, at: { ...s.at, paper: pa, part: id } }); }, [pa, P1]); await p.waitForTimeout(150);
await mgr(0);
await p.click('.parts-mgr [data-v="addabove"]'); await p.waitForTimeout(150); await p.click(`.parts-mgr [data-v="add:${P3}"]`); await p.waitForTimeout(250);
check((await order()) === [P3, P1, P2].join(",") && (await p.evaluate(([pa, id]) => !!window.__moonsinger.state().song.papers.find((x) => x.id === pa).tracks[id], [pa, P3])), "已有的歌手加进这一段 = 挪到这一行上面", await order());
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\nparts-manager: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
