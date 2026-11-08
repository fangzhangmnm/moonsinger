// test/e2e/paper-adds.mjs —— 真浏览器 E2E：每段底下的虚线框「＋ 歌手」「＋ 新曲段」+ 纸 ⋯ 三块（v0.16.19 搬家 D 之二）。
// created 2026-11-08 by Claude Opus 5.5（user 11-07 搬家清单第五条「管理」：「一二三四五六同意…先按这个做，不舒服我以后再说」）。
// 守：编辑器里、不分页时每张纸底下两个虚线框；分页 / 听模式没有（分页 = 打印预览）；扳手旁的「＋」没了、扳手面板里也没有「＋ 新的纸」；
//   「＋ 新曲段」= 在这一段下面插一张；「＋ 歌手」= 小菜单：不在这一段的歌手 / ＋ 新歌手（排在这一段最下面那位后面）/ 声部管理；
//   纸 ⋯ = 这一段 · 插入（在上面 / 下面插一段）· 编辑，不再有加歌手；在上面插 = 新的一段在它前面。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/paper-adds.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.route(/\.sf2(\?|$)/, (r) => r.abort());
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
for (let i = 0; i < 2; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
const adds = () => p.evaluate(() => window.__moonsinger.layout().paperAdds.map((a) => `${a.paper}:${a.kind}`).join(","));
const papers = () => p.evaluate(() => window.__moonsinger.state().song.papers.map((x) => x.id).join(","));
const tap = async (paper, kind) => {
  const pt = await p.evaluate(([paper, kind]) => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), a = L.paperAdds.find((x) => x.paper === paper && x.kind === kind); return a ? { x: sc.left + L.pageX.left + a.x + a.w / 2, y: sc.top + a.y + a.h / 2 } : null; }, [paper, kind]);
  if (!pt) return false;
  await p.evaluate((y) => { const s = document.querySelector("#score"); s.scrollTop += y - s.getBoundingClientRect().top - 200; }, pt.y); await p.waitForTimeout(150);
  const pt2 = await p.evaluate(([paper, kind]) => { const L = window.__moonsinger.layout(), sc = document.querySelector("#score .sheet").getBoundingClientRect(), a = L.paperAdds.find((x) => x.paper === paper && x.kind === kind); return { x: sc.left + L.pageX.left + a.x + a.w / 2, y: sc.top + a.y + a.h / 2 }; }, [paper, kind]);
  await p.mouse.click(pt2.x, pt2.y); await p.waitForTimeout(300); return true;
};
const P0 = (await papers()).split(",")[0];
check((await adds()) === `${P0}:part,${P0}:paper` && (await p.$$("#score rect.add-box")).length === 2, "本段：这一段底下两个虚线框「＋ 声部」「＋ 新曲段」", await adds());
check(!(await p.evaluate(() => "addPaper" in window.__moonsinger.layout())), "扳手旁的「＋」没了");
await p.evaluate(() => window.__moonsinger.setPages(true)); await p.waitForTimeout(250);
const pg = await p.evaluate(() => { const L = window.__moonsinger.layout(), last = L.pages.at(-1); return { adds: L.paperAdds.map((a) => `${a.paper}:${a.kind}`).join(","), below: L.paperAdds.every((a) => a.y >= last.top + last.h), pages: L.pages.length }; });
check(pg.adds === `${P0}:paper` && pg.below && pg.pages === 1, "分页（= 打印预览）：每段不画，「＋ 新曲段」在最后一页纸外面、不多出一页", JSON.stringify(pg));
await p.evaluate(() => window.__moonsinger.setPages(false)); await p.waitForTimeout(200);
await p.evaluate(() => window.__moonsinger.setMode("listen")); await p.waitForTimeout(250);
check((await adds()) === "", "听模式没有");
await p.evaluate(() => window.__moonsinger.setMode("notes")); await p.waitForTimeout(250);
// ＋ 新曲段
await tap(P0, "paper");
const ps = (await papers()).split(",");
check(ps.length === 2 && ps[0] === P0, "「＋ 新曲段」= 在这一段下面插一张", ps.join(","));
const P1 = ps[1];
// ＋ 歌手（第一段）→ 新歌手
await p.evaluate(() => window.__moonsinger.setScope("all")); await p.waitForTimeout(200);
check((await adds()) === `${P0}:part,${P1}:part,${P1}:paper`, "全部曲段：每段底下「＋ 声部」，整首最下面一个「＋ 新曲段」", await adds());
await tap(P0, "part");
const menu = await p.$$eval(".ctx-menu [data-v]", (bs) => bs.map((x) => x.dataset.v).join(","));
check(menu === "new,parts", "「＋ 歌手」= 小菜单：＋ 新歌手 / 声部管理（都在这一段了，没有可加的已有歌手）", menu);
await p.click('.ctx-menu [data-v="new"]'); await p.waitForTimeout(400);
const parts = await p.evaluate(() => window.__moonsinger.state().song.parts.map((x) => x.id));
const onP = (pid) => p.evaluate((pid) => Object.keys(window.__moonsinger.state().song.papers.find((x) => x.id === pid).tracks).join(","), pid);
check(parts.length === 2, "加了一位新歌手", parts.join(","));
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
// 第二段：新歌手不在 → 菜单里列着，点了 = 加进第二段
const NEW = parts[1];
const before = await onP(P1);
await tap(P1, "part");
check(!!(await p.$(`.ctx-menu [data-v="add:${NEW}"]`)), "别的段里「＋ 歌手」列着不在那一段的歌手");
await p.click(`.ctx-menu [data-v="add:${NEW}"]`); await p.waitForTimeout(250);
check((await onP(P1)).split(",").includes(NEW) && !before.split(",").includes(NEW), "点了 = 加进那一段", `${before} → ${await onP(P1)}`);
// 纸 ⋯：三块，没有加歌手；在上面插一段
await p.evaluate((pid) => window.__moonsinger.view.host.onPaperMenu(pid), P0); await p.waitForTimeout(200);
const secs = await p.$$eval(".offer .part-sec", (e) => e.map((x) => x.textContent).join(","));
check(secs === "这一段,插入,编辑" && !(await p.$('.offer [data-v="newpart"], .offer [data-v^="track:"], .offer [data-v="add"]')), "纸 ⋯ = 这一段 · 插入 · 编辑，不再有加歌手", secs);
await p.click('.offer [data-v="above"]'); await p.waitForTimeout(250);
const ps2 = (await papers()).split(",");
check(ps2.length === 3 && ps2[1] === P0 && ps2[2] === P1, "在上面插一段 = 新的一段在它前面", ps2.join(","));
const head = await p.evaluate(() => { const s = window.__moonsinger.state().song, t = Object.values(s.papers[0].tracks)[0]; return t.filter((x) => x.kind !== "note" && x.kind !== "rest").map((x) => x.kind).join(","); });
check(/key/.test(head) && /time/.test(head), "插在最前面：谱头照抄原来第一段开头", head);
await p.keyboard.press("Control+z"); await p.waitForTimeout(200);
check((await papers()) === [P0, P1].join(","), "撤销一步 = 插的那段没了");
// 扳手面板里没有「＋ 新的纸」
await p.evaluate(() => window.__moonsinger.view.host.onPaper()); await p.waitForTimeout(200);
check(!(await p.$('[data-v="addpaper"]')), "扳手面板里没有「＋ 新的纸」（插一段 = 纸 ⋯ / 虚线框）");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\npaper-adds: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
