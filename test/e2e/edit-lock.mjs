// test/e2e/edit-lock.mjs —— 真浏览器 E2E：修改锁（家族「源文件原则上只读：手动解锁才能改」）在硬盘上的单个文件这条路上，五道里不靠库的那四道。
// created 2026-11-10 by Claude Fable 5.2（设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md；这一版库的开关还关着，歌库里的歌暂时不锁）。
//   「硬盘上的单个文件」= 真 app 里打开框 / 拖进来 / 双击拿到的句柄；无头浏览器点不了系统的文件框，这里递一个 OPFS 的真句柄（能读、能写回、有 lastModified）进 __moonsinger.openFileHandle。
//   验的是：打开默认锁着 → 键盘 / 写入口 / 撤销 / 存盘都拦、文件一个字节都不变、只闪不弹 → 曲段隐藏锁着能点（看法）→ 「接着改」→ 能写能存 → 「锁上」先存再锁 → 重开又锁着。
// 跑：先 npm run build，再 npm run serve（8710），再 node test/e2e/edit-lock.mjs（MS_E2E_BASE 可改地址）
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const FILE = "lock-test.mxl";
const notes = () => p.evaluate(() => window.__moonsinger.state().song.papers.reduce((n, pp) => n + Object.values(pp.tracks).reduce((m, t) => m + t.filter((x) => x.kind === "note").length, 0), 0));   // 整首歌的音（光标在哪一段写哪一段）
const lk = () => p.evaluate(() => window.__moonsinger.editLock());
/** 文件现在的字节（长度 + 一个简单的校验和）：锁着期间它一个字节都不许变。 */
const fileSig = () => p.evaluate(async (name) => { const f = await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile(); const u = new Uint8Array(await f.arrayBuffer()); let h = 0; for (const x of u) h = (h * 31 + x) >>> 0; return `${u.length}:${h}`; }, FILE);
const door = () => p.evaluate(() => { const d = document.getElementById("lockBar"); return d && !d.hidden ? [...d.querySelectorAll("button")].map((x) => x.textContent) : null; });
/** 门闪了没有（闪 = 重新挂上 .flash）：先摘掉标记，做完动作再看。 */
const armFlash = () => p.evaluate(() => document.getElementById("lockBar")?.classList.remove("flash"));
const flashed = () => p.evaluate(() => !!document.getElementById("lockBar")?.classList.contains("flash"));
const errorToasts = () => p.evaluate(() => [...document.querySelectorAll(".notice-stack [data-notice-id]")].map((n) => n.textContent ?? "").filter((t) => /改不了|没存|锁着，有改动/.test(t)));
const openFile = () => p.evaluate(async (name) => window.__moonsinger.openFileHandle(await (await navigator.storage.getDirectory()).getFileHandle(name)), FILE);   // 每次拿到的是一个新的句柄对象 = 新的一次打开

// ── 备料：没有家的新歌里写三个音、加一段 → 字节写进 OPFS 的一个文件 → 刷新（手里干净）→ 当硬盘文件打开 ──
await p.goto(BASE); await p.waitForTimeout(700);
for (let i = 0; i < 3; i++) { await p.click(`.pad-key[data-k] >> nth=${i}`); await p.waitForTimeout(40); }
await p.evaluate(() => window.__moonsinger.addPaper()); await p.waitForTimeout(150);
await p.evaluate(async (name) => { const fh = await (await navigator.storage.getDirectory()).getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(window.__moonsinger.bytes()); await w.close(); }, FILE);
await p.goto(BASE); await p.waitForTimeout(700);
check((await lk()).state === "none" && (await door()) === null, "还没有家的新歌：这把锁不管，没有门");
check(await openFile(), "当硬盘上的单个文件打开"); await p.waitForTimeout(400);
const sig0 = await fileSig(), n0 = await notes();
check(n0 === 3 && (await p.evaluate(() => window.__moonsinger.home())) === "file", "打开了：三个音，家 = 硬盘文件", `${n0}`);

// ── 打开默认锁着 ──
{ const s = await lk(), d = await door();
  check(s.state === "locked" && s.locked && !s.canLockNow, "打开默认锁着", JSON.stringify(s));
  check(!!d && d.length === 1 && d[0] === "接着改", "谱上面一条门：硬盘文件只有「接着改」一个钮", JSON.stringify(d));
  check(await p.evaluate(() => document.body.classList.contains("doc-locked") && document.querySelector(".pad-panel")?.classList.contains("is-unplugged")), "界面：锁着的样子 + 键盘是拔着插头的样子");
  const box = await p.evaluate(() => { const d = document.getElementById("lockBar").getBoundingClientRect(), s = document.getElementById("score").getBoundingClientRect(), t = document.getElementById("bar").getBoundingClientRect(); return { below: d.top >= t.bottom - 1, above: d.bottom <= s.top + 1 }; });
  check(box.below && box.above, "门在顶栏和谱之间自己一行，不盖谱", JSON.stringify(box)); }

// ── ① 界面 + ② 写入口：键盘、触屏键盘、直接走写入口，都写不进去；只闪不弹 ──
await p.click("#score", { position: { x: 300, y: 200 } });
await p.keyboard.press("5"); await p.waitForTimeout(150);
check((await notes()) === n0, "电脑键盘按音键：谱没变（锁着键盘只弹不写，同「弹」；不算蹭，不闪）");
await p.click(".pad-key[data-k] >> nth=0"); await p.waitForTimeout(150);
check((await notes()) === n0, "触屏键盘按音键：谱没变（能出声，写不进去）");
await armFlash();
{ const r = await p.evaluate(() => window.__moonsinger.run({ k: "degree", degree: 1, dir: "near" }));
  check(r.ok === false && (await notes()) === n0, "直接走写入口：被拒", JSON.stringify(r)); check(await flashed(), "被写入口拒了：门闪一下"); }
await armFlash(); await p.keyboard.press("Backquote"); await p.waitForTimeout(150);   // 「弹」的快捷键：锁着 = 强制拔着，接不回去
check(await p.evaluate(() => document.querySelector(".pad-panel")?.classList.contains("is-unplugged")), "锁着：插头接不回去"); check(await flashed(), "想把插头接回去：门闪一下");
check((await errorToasts()).length === 0, "蹭到了只闪、不弹报错", JSON.stringify(await errorToasts()));
{ await p.evaluate(() => window.__moonsinger.undo()); check((await notes()) === n0, "撤销：没有可翻的，谱没变"); }

// ── 看法：曲段的隐藏锁着能点；文件一个字节都不写；能撤回来 ──
const pid2 = await p.evaluate(() => window.__moonsinger.state().song.papers[1].id);
const hidden = () => p.evaluate(() => !!window.__moonsinger.state().song.papers[1].hidden);
await p.evaluate((id) => window.__moonsinger.setPaperHidden(id, true), pid2); await p.waitForTimeout(150);
{ const s = await lk();
  check((await hidden()) && s.dirtyKind === "looks" && s.dirty && !s.owes, "锁着隐藏一段：做了；脏的是「看法」、没有要存的东西", JSON.stringify(s)); }
await armFlash(); await p.evaluate(() => window.__moonsinger.fileSave()); await p.waitForTimeout(300);
check((await fileSig()) === sig0, "锁着按「存」：文件一个字节都没变"); check(await flashed(), "按「存」= 门闪一下"); check((await errorToasts()).length === 0, "不报错", JSON.stringify(await errorToasts()));
await p.keyboard.press("Control+KeyS"); await p.waitForTimeout(300);
check((await fileSig()) === sig0, "Ctrl+S 同样不写");
await p.evaluate(() => window.__moonsinger.undo()); await p.waitForTimeout(150);
check(!(await hidden()), "撤销：翻的是看法那一步，能翻");
await p.evaluate(() => window.__moonsinger.redo()); await p.waitForTimeout(150);
check(await hidden(), "重做：同理");

// ── 混音台：会改内容的控件不接，「静 / 独」留着 ──
await p.click('.dock-tab [data-mode="listen"]'); await p.waitForTimeout(200); await p.click('.dock-tab [data-mode="listen"]'); await p.waitForTimeout(300);   // 鼠标：第二下 = 手动弹出混音台
{ const pe = await p.evaluate(() => { const f = document.querySelector(".studio .studio-strips input"), ms = document.querySelector(".studio .strip-ms button"); return { fader: f ? getComputedStyle(f).pointerEvents : "没有推子", ms: ms ? getComputedStyle(ms).pointerEvents : "没有静独钮" }; });
  check(pe.fader === "none" && pe.ms === "auto", "混音台：推子不接、「静 / 独」能点", JSON.stringify(pe)); }
await p.click('.dock-tab [data-mode="notes"]'); await p.waitForTimeout(200);
check(await p.evaluate(() => document.body.dataset.wmode === "notes"), "锁着照样能换模式（不再强制「听」）");

// ── 界面那一层补齐（v0.16.99；设计稿第三节「推子、乐器、谱都不收改动」）：改内容的控件点不动，看的 / 隐藏 / 关掉照常 ──
{ const pe = (sel) => p.evaluate((s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).pointerEvents : "没有"; }, sel);
  check((await pe('[data-ov="add"]')) === "none", "谱上「＋ 声部 / ＋ 新曲段」点不动");
  await p.evaluate(() => window.__moonsinger.overlayHost.onPaperMenu(window.__moonsinger.state().song.papers[0].id)); await p.waitForTimeout(150);
  check((await pe('.paper-menu [data-v="dup"]')) === "none" && (await pe('.paper-menu [data-v="del"]')) === "none" && (await pe('.paper-menu [data-v="hide"]')) === "auto" && (await pe('.paper-menu [data-v="close"]')) === "auto",
    "曲段菜单：复制 / 删点不动，「隐藏」和「好」能点");
  await p.click('.paper-menu [data-v="close"]'); await p.waitForTimeout(100);
  await p.click("#score text.part-name"); await p.waitForTimeout(150);
  check((await pe('.part-card [data-v="swap"]')) === "none" && (await pe('.part-card [data-v="delpart"]')) === "none" && (await pe('.part-card [data-v="parts"]')) === "auto",
    "声部名小卡：换乐器 / 删掉声部点不动，「声部管理…」能点");
  await p.click('.part-card [data-v="parts"]'); await p.waitForTimeout(200);
  const pm = await p.evaluate(() => { const g = (s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).pointerEvents : "没有"; }; return { more: g('.parts-mgr [data-v^="more:"]'), del: g('.parts-mgr [data-v^="delpart:"]'), add: g('.parts-mgr [data-v^="addbelow:"]'), close: g('.parts-mgr [data-v="close"]') }; });
  check(pm.more === "auto" && pm.close === "auto" && pm.del === "none" && pm.add === "none", "声部管理：展开 / 好能点，加 / 删点不动", JSON.stringify(pm));
  await p.click('.parts-mgr [data-v="close"]'); await p.waitForTimeout(100);
  await p.evaluate(() => { const m = window.__moonsinger; m.openHeader(m.state().at.part); }); await p.waitForTimeout(150);
  check((await pe('.header-panel [data-hp="key"], .header-panel select')) === "none", "谱头面板：改不动");
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  check((await notes()) === n0 && (await fileSig()) === sig0, "走了一圈：谱和文件都没变"); }

// ── 没解锁就离开：不问、不存；重开 = 存下来的样子，又锁着 ──
check(await openFile(), "锁着、只动过看法：换开别的不问「丢不丢」"); await p.waitForTimeout(400);
check((await p.evaluate(() => [...document.querySelectorAll(".offer")].filter((o) => !o.hidden).length)) === 0, "没有弹任何面");
check(!(await hidden()) && (await fileSig()) === sig0 && (await lk()).locked, "重开：那一段没隐藏（文件没动过）、又锁着");

// ── 「接着改」：解到关掉这个文件为止 ──
await p.click('#lockBar [data-v="continue"]'); await p.waitForTimeout(250);
{ const s = await lk();
  check(s.state === "unlocked" && s.canLockNow && (await door()) === null, "点「接着改」：解了，门收掉", JSON.stringify(s));
  check(await p.evaluate(() => !document.body.classList.contains("doc-locked") && !document.querySelector(".pad-panel")?.classList.contains("is-unplugged")), "界面回到能改的样子"); }
await p.evaluate(() => { if (document.querySelector(".pad-panel")?.hidden) document.querySelector("#padTab")?.click(); }); await p.waitForTimeout(150);   // 鼠标时键盘只手动开合（v0.16.89）；前面看混音台时它收着
await p.click(".pad-key[data-k] >> nth=4"); await p.waitForTimeout(200);   // 用触屏键写（「加一段之后电脑键盘的第一个音键被吞」是另一件事，和锁无关，上一版也这样；记在计划书里待查）
check((await notes()) === n0 + 1, "能写了", String(await notes()));
await p.evaluate(() => window.__moonsinger.fileSave()); await p.waitForTimeout(400);
const sig1 = await fileSig();
check(sig1 !== sig0 && !(await lk()).dirty, "按「存」：写回文件了");

// ── 三条杠「锁上（先不改了）」：先存好再锁 ──
await p.click(".pad-key[data-k] >> nth=5"); await p.waitForTimeout(200);
check((await lk()).dirtyKind === "content", "又写了一个音：有内容改动没存");
await p.click("#setBtn"); await p.waitForTimeout(200);
check(await p.isVisible('.main-menu [data-v="lockEdit"]'), "解着：三条杠里有「锁上（先不改了）」");
await p.click('.main-menu [data-v="lockEdit"]'); await p.waitForTimeout(500);
{ const s = await lk(), sig2 = await fileSig();
  check(s.locked && !s.dirty, "锁上了，没有没存的东西", JSON.stringify(s));
  check(sig2 !== sig1, "锁之前那个音已经写回文件");
  check((await notes()) === n0 + 2 && !!(await door()), "谱还是眼前的样子，门回来了"); }
await p.click("#setBtn"); await p.waitForTimeout(200);
check(!(await p.$('.main-menu [data-v="lockEdit"]')), "锁着：三条杠里没有「锁上」");
await p.keyboard.press("Escape"); await p.waitForTimeout(100);

// ── 解锁不带到下一次打开 ──
await p.click('#lockBar [data-v="continue"]'); await p.waitForTimeout(200);
check((await lk()).state === "unlocked", "再解一次");
check(await openFile(), "重开同一个文件"); await p.waitForTimeout(400);
check((await lk()).locked && (await notes()) === n0 + 2, "新的一次打开：又锁着，内容是上次存下的");

check(errs.length === 0, "没有页面错误", errs.join(" | "));
console.log(`\nedit-lock: ${pass} passed, ${fail} failed`);
await b.close(); process.exit(fail ? 1 : 0);
