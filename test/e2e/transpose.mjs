// test/e2e/transpose.mjs —— 真浏览器 E2E：整段 / 整首移调转调（v0.9.33；user 2026-10-09「杂事记账：段级别和工程级别的整体移调转调」→ 10-10「小件做」）。
//   纸的「⋯」/ 空白处右键 →「移调 / 转调…」：范围 这一段 / 整首；点了不收、能连着点；调号跟着挪；每一下一步撤销。created 2026-10-10 by Claude Opus 5.5
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/transpose.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
const type4 = async () => { for (let i = 0; i < 4; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); } };
await type4();
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(200);
await type4();
// 每张纸：调号 + 音（MIDI）
const snap = () => p.evaluate(() => { const s = window.__moonsinger.state(), part = s.song.parts[0].id, midi = (q) => ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[q.step] + q.alter + 12 * (q.octave + 1);
  return s.song.papers.map((pp) => { const t = pp.tracks[part]; return `${t.find((x) => x.kind === "key")?.fifths}:${t.filter((x) => x.kind === "note").map((x) => midi(x.pitch)).join(",")}`; }).join(" | "); });
const s0 = await snap();
check(/^0:\d+(,\d+){3} \| 0:\d+(,\d+){3}$/.test(s0), "两张纸各写了四个音", s0);
const shift = (s, d, which) => s.split(" | ").map((x, i) => { if (!which.includes(i)) return x; const [k, ns] = x.split(":"); return `${k}:${ns.split(",").map((v) => Number(v) + d).join(",")}`; });
// 1. 纸的「⋯」（光标在第二张纸）→ 移调 / 转调…
const menuAt = await p.evaluate(() => { const L = window.__moonsinger.layout(), at = window.__moonsinger.state().at.paper, m = L.papers?.find((x) => x.id === at)?.menu ?? L.paperMenu, sc = document.querySelector("#score .sheet").getBoundingClientRect(); return m ? { x: sc.left + L.pageX.left + m.x + m.w / 2, y: sc.top + m.y + m.h / 2 } : null; });
check(!!menuAt, "曲段控件的「⋯」有点击区域");
await p.mouse.click(menuAt.x, menuAt.y); await p.waitForTimeout(200);
check(!!(await p.$('.offer [data-v="transpose"]')), "纸的菜单里有「移调 / 转调…」");
await p.click('.offer [data-v="transpose"]'); await p.waitForTimeout(200);
check(!!(await p.$(".ctx-menu.transpose-menu")), "开了移调菜单");
check(await p.$eval('.transpose-menu [data-v="scope:paper"]', (e) => e.classList.contains("is-on")), "默认范围 = 这一段");
// 2. ↑全音：只挪第二张，调号 C → D
await p.click('.transpose-menu [data-v="tr:2"]'); await p.waitForTimeout(150);
let s1 = await snap(), parts0 = s0.split(" | "), parts1 = s1.split(" | ");
check(parts1[0] === parts0[0], "第一张纸没动", s1);
check(parts1[1] === `2:${shift(s0, 2, [1])[1].split(":")[1]}`, "第二张：音 +2、调号 = D（2 个升号）", s1);
check(!!(await p.$(".ctx-menu.transpose-menu")), "点了不收（可以连着点）");
check((await p.textContent(".transpose-menu")).includes("现在 1=D"), "菜单里「现在」跟着变");
// 3. 范围换整首，↓半音：两张都挪；第一张 C → B（5 个升号，不是 C♭）
await p.click('.transpose-menu [data-v="scope:song"]'); await p.waitForTimeout(100);
check(await p.$eval('.transpose-menu [data-v="scope:song"]', (e) => e.classList.contains("is-on")), "换成整首");
await p.click('.transpose-menu [data-v="tr:-1"]'); await p.waitForTimeout(150);
const s2 = await snap(), p2 = s2.split(" | ");
check(p2[0].startsWith("5:") && p2[0].split(":")[1] === shift(s0, -1, [0])[0].split(":")[1], "整首 ↓半音：第一张 1=B（5 个升号）、音 −1", s2);
check(p2[1].startsWith("-5:") && p2[1].split(":")[1] === shift(s0, 1, [1])[1].split(":")[1], "第二张同样挪：1=D ↓半音 = D♭（每个调号挪同样的量；C♯ 7 个升号 vs D♭ 5 个降号，取少的）、音 −1", s2);
// 4. 转调到 1=C（整首，参照 = 第一张 B）：B → C = 小二度往上
await p.click('.transpose-menu [data-v="mod:0"]'); await p.waitForTimeout(150);
const s3 = await snap(), p3 = s3.split(" | ");
check(p3[0] === parts0[0], "整首转调到 1=C：第一张回到原样", s3);
check(p3[1] === `2:${shift(s0, 2, [1])[1].split(":")[1]}`, "第二张跟着回到 1=D（+2 那一步之后的样子）", s3);
// 5. 收掉，撤销三步 = 回到最开始
await p.mouse.click(5, 300); await p.waitForTimeout(100);
check(!(await p.$(".ctx-menu.transpose-menu")), "点外面收掉");
for (let i = 0; i < 3; i++) { await p.keyboard.press("Control+z"); await p.waitForTimeout(120); }
check((await snap()) === s0, "撤销三步 = 回到最开始", await snap());
// 6. 空白处右键菜单里也有
const sh = await p.$eval("#score .sheet", (e) => { const r = e.getBoundingClientRect(); return { x: r.right - 80, y: r.top + 150 }; });
await p.mouse.click(sh.x, sh.y, { button: "right" }); await p.waitForTimeout(200);
check(!!(await p.$('.ctx-menu [data-v="transpose"]')), "空白处右键菜单里有「移调 / 转调…」");
await p.click('.ctx-menu [data-v="transpose"]'); await p.waitForTimeout(200);
check(!!(await p.$(".ctx-menu.transpose-menu")), "从右键菜单也能开");
check(errs.length === 0, "页面没有报错", errs.join(" | "));
await b.close();
console.log(`\ntranspose: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
