// test/e2e/gate.mjs —— 网盘闸门（家族设计稿 ai-docs/20261103-cloud-gate-design.md §7）+ 歌库「没有备份」披露 + 全部导出 + 更新重载前先推（F-147 B）。created 2026-11-03 by Claude Opus 5.5（家族工单 H）
//   真 app + 真库 + 真 IndexedDB；云 = node 侧的 mock（cloud-bridge），登录 = 页面开局塞的假 auth（app-store 只在本机地址上认）。
import { chromium } from "./pw.mjs";
import { createMockProvider } from "@internal/store/testing";
import { installCloud } from "./cloud-bridge.mjs";

let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : "  " + extra}`); };
const BASE = process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/";
const b = await chromium.launch();

/** 页面开局前的假登录。配置放 localStorage（跨 reload）；window.__e2eAuth 这次打开里改。 */
const AUTH_INIT = () => {
  const cfg = () => { if (!window.__e2eAuth) { try { window.__e2eAuth = JSON.parse(localStorage.getItem("e2eAuth") ?? "{}"); } catch { window.__e2eAuth = {}; } } return window.__e2eAuth; };
  const c0 = cfg();
  if (c0.signedIn) window.__moonsingerCloudSignedIn = true;
  if (localStorage.getItem("e2eAuth") != null) Object.defineProperty(navigator, "onLine", { configurable: true, get: () => cfg().net !== false });
  const subs = new Set();
  const signed = () => window.__moonsingerCloudSignedIn === true;
  const state = (reason) => ({ signedIn: signed(), account: signed() ? { username: "e2e" } : null, reason });
  const emit = (reason) => { for (const f of subs) f(state(reason)); };
  window.__moonsingerAuthCalls = 0;
  window.__moonsingerAuth = {
    isAuthConfigured: () => true,
    initAuth: async () => (!signed() && cfg().account ? { ...state("init"), probing: true } : state("init")),
    signIn: async () => { window.__moonsingerCloudSignedIn = true; window.__e2eSignedInVia = "signIn"; emit("signIn"); },
    signOut: async () => { window.__moonsingerCloudSignedIn = false; emit("signOut"); },
    isSignedIn: signed,
    getActiveAccount: () => (signed() ? { username: "e2e" } : null),
    getAuthState: () => state(),
    getToken: async () => "e2e",
    onAuthChanged: (f) => { subs.add(f); return () => subs.delete(f); },
    retrySilentSignIn: async () => {
      window.__moonsingerAuthCalls++;
      if (signed()) return true;
      const how = cfg().renew;
      if (how === "hang") return new Promise(() => {});
      if (how === "ok") { window.__moonsingerCloudSignedIn = true; emit("silent"); return true; }
      window.__moonsinger.noteAuthFailure(how === "network" ? "[auth] silent token renewal failed (retry-silent): name=BrowserAuthError code=network_error sub= msg=e2e" : "[auth] silent token renewal failed (retry-silent): name=InteractionRequiredAuthError code=interaction_required sub= msg=e2e");
      return false;
    },
  };
  window.__e2eExpire = () => { window.__moonsingerCloudSignedIn = false; emit("expired"); };
  // 闸门罩子每次出现 / 消失的时刻（要赶在 app 脚本之前挂上）
  window.__gateTimes = [];
  new MutationObserver(() => {
    const g = document.querySelector(".gate-sheet"); if (!g || g.__watched) return; g.__watched = true;
    const rec = () => window.__gateTimes.push({ up: !g.hidden, t: performance.now(), title: g.querySelector(".offer-title")?.textContent ?? "" });
    rec(); new MutationObserver(rec).observe(g, { attributes: true, attributeFilter: ["hidden"] });
  }).observe(document, { childList: true, subtree: true });
};
const VIEW = () => {
  const g = document.querySelector(".gate-sheet");
  const up = !!g && !g.hidden;
  const bar = document.querySelector('[data-notice-id="offline-bar"]');
  return { up, title: up ? g.querySelector(".offer-title")?.textContent : null, message: up ? g.querySelector(".offer-msg")?.textContent : null, buttons: up ? [...g.querySelectorAll(".gate-actions button")].map((x) => x.textContent) : [], phase: window.__moonsinger.gate.phase(), bar: bar?.querySelector(".notice-text")?.textContent ?? null, barActions: bar ? [...bar.querySelectorAll(".notice-action")].map((x) => x.textContent) : [], online: window.__moonsinger.cloudOnline(), authCalls: window.__moonsingerAuthCalls };
};
function world() {
  const log = []; const w = { log, hold: null, holdUpload: null };
  w.cloud = createMockProvider({ hook: async (op) => { log.push(op); if (w.hold) await w.hold; if (op === "upload" && w.holdUpload) await w.holdUpload; } });
  w.device = async (opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 760 }, acceptDownloads: true });
    await installCloud(ctx, w.cloud);
    await ctx.addInitScript(AUTH_INIT);
    const p = await ctx.newPage(); p.__errs = [];
    p.on("pageerror", (e) => p.__errs.push(e.message));
    await p.goto(BASE); await p.waitForFunction(() => !!window.__moonsinger?.gate);
    p.view = () => p.evaluate(VIEW);
    p.setAuth = (c) => p.evaluate((x) => localStorage.setItem("e2eAuth", JSON.stringify(x)), c);
    p.patchAuth = (c) => p.evaluate((x) => { Object.assign(window.__e2eAuth, x); }, c);
    p.net = (on) => p.evaluate((v) => { window.__e2eAuth.net = v; window.dispatchEvent(new Event(v ? "online" : "offline")); }, on);
    p.hide = () => p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    p.show = () => p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    p.clickGate = (label) => p.click(`.gate-sheet .gate-actions button:has-text("${label}")`);
    p.waitPhase = (ph, timeout = 15000) => p.waitForFunction((x) => window.__moonsinger.gate.phase() === x, ph, { timeout });
    p.reopen = async () => { await p.reload(); await p.waitForFunction(() => !!window.__moonsinger?.gate); };
    p.close2 = () => ctx.close();
    return p;
  };
  return w;
}
/** 云端那一首的字节（hex；没有 = null）。 */
const cloudHexOf = async (w, id) => { const it = (await w.cloud.list("")).find((x) => x.name === id); return it ? Buffer.from(await (await w.cloud.download(it.ref)).arrayBuffer()).toString("hex") : null; };
const anySheet = (p) => p.evaluate(() => { const o = [...document.querySelectorAll(".offer:not(.gate-sheet)")].find((e) => !e.hidden); return o ? o.textContent : null; });
const noticeText = (p) => p.evaluate(() => document.querySelector('[data-notice-id="unsynced"]')?.textContent ?? "");
const typeNote = async (p, keys = ["1", "2", "3"]) => { await p.evaluate(() => { if (document.querySelector(".pad-panel")?.hidden) document.querySelector("#padTab")?.click(); }); await p.click("#score", { position: { x: 300, y: 300 } }); await p.keyboard.press("End"); for (const k of keys) await p.keyboard.press(k); };
/** 有账号的一台设备：建一首歌、推上云，然后按 cfg 重开。 */
async function seed(w, cfg, { reopen = true } = {}) {
  const p = await w.device();
  await p.setAuth({ account: true, signedIn: true, renew: "ok" });
  await p.reopen();
  await p.evaluate(() => window.__moonsinger.attach()); await p.waitForTimeout(300);
  await p.waitForFunction(() => window.__moonsinger.gate.phase() === "open");
  await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(300);
  await typeNote(p); await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await p.waitForTimeout(400);
  const id = await p.evaluate(() => window.__moonsinger.identifier());
  if (!(await w.cloud.list("")).some((x) => x.name === id)) throw new Error("seed: song did not reach the cloud: " + id);
  await p.setAuth(cfg);
  if (reopen) await p.reopen();
  return { p, id };
}
const scenarios = [];
const scenario = (name, fn) => scenarios.push({ name, fn });

scenario("① 没挂库：开机 / 醒来零闸", async (w) => {
  const p = await w.device();
  await p.setAuth({ account: true, signedIn: false, renew: "interaction" });   // 就算这台有账号：没进过歌库 = 文件模式
  await p.reopen(); await p.waitForTimeout(500);
  let v = await p.view();
  check(!v.up && v.phase === "open" && v.bar === null, "开机没有罩、没有闸", JSON.stringify(v));
  check(v.authCalls === 0, "没去续签", String(v.authCalls));
  await p.hide(); await p.waitForTimeout(50); await p.show(); await p.waitForTimeout(300);
  v = await p.view();
  check(!v.up && v.phase === "open" && v.bar === null && v.authCalls === 0, "醒来也没有", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("② 登录好 + 云端没动：罩一下就放行、没有面", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "ok" });   // 真机开局 = 有账号、还没登录上（initAuth 之后才续签）
  await p.waitPhase("open"); await p.waitForTimeout(600);
  const times = await p.evaluate(() => window.__gateTimes);
  const ups = times.filter((x) => x.up && /核对/.test(x.title));
  check(ups.length === 1, "罩出现过一次（正在核对）", JSON.stringify(times));
  const down = times.find((x) => !x.up && x.t > ups[0]?.t);
  const dur = down ? Math.round(down.t - ups[0].t) : -1;
  console.log(`  罩从出现到消失 = ${dur} ms（设计稿 §7② 目标 < 300 ms）`);
  check(dur >= 0 && dur < 300, "罩 < 300 ms", String(dur));
  const v = await p.view();
  check(!v.up && v.bar === null, "放行、没有条", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("③ 续签失败：闸 + 两个钮；离线继续能写、条显示 N、零请求；回线续签成功 → 条收掉", async (w) => {
  const { p, id } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  let v = await p.view();
  check(v.title === "网盘没连上" && v.message === "登录过期了", "闸的标题 / 正文按真实原因", JSON.stringify(v));
  check(v.buttons.join("|") === "重新登录|离线继续", "两个钮", v.buttons.join("|"));
  check((await p.evaluate(() => window.__moonsinger.identifier())) === id, "本机那首摆在闸底下");
  const before = await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.length);
  await p.keyboard.press("5"); await p.waitForTimeout(100);
  check((await p.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.length)) === before, "闸着时打不进字");
  await p.clickGate("离线继续"); await p.waitForTimeout(200);
  v = await p.view();
  check(!v.up && v.phase === "open" && v.bar === "离线", "离线继续 → 放行，条 n = 0 时只写「离线」", JSON.stringify(v));
  const cloudBefore = await cloudHexOf(w, id);   // node 侧读云也算进 w.log：在量「零请求」之前读
  const logBefore = w.log.length;
  await typeNote(p, ["4", "5"]); await p.evaluate(() => window.__moonsinger.es().flushLocal()); await p.waitForTimeout(3300);
  v = await p.view();
  check(v.bar === "离线 · 还有 1 份没传上去", "条显示 1 份", JSON.stringify(v));
  check(v.barActions.join() === "看列表", "条上能看列表", v.barActions.join());
  await p.hide(); await p.waitForTimeout(100); await p.show(); await p.waitForTimeout(500);
  v = await p.view();
  check(w.log.length === logBefore, "离线继续之后网络里零云端请求", w.log.slice(logBefore).join(","));
  check(!v.up && v.phase === "open", "离线且仍没登录：回前台不再弹闸", JSON.stringify(v));
  await p.patchAuth({ renew: "ok" });
  await p.evaluate(() => window.dispatchEvent(new Event("online")));
  await p.waitForSelector('[data-notice-id="unsynced"]', { timeout: 8000 });   // (c) 传过、只是自动保存：不传不问，进列表（规则书第 15 条；手里这首不替人推，ADR-0016 / 0018）
  check(/要处理/.test(await p.evaluate(() => document.querySelector('[data-notice-id="unsynced"]')?.textContent ?? "")), "回线续签成功：不问不推，说一声在「要处理」列表里");
  check(!(await p.evaluate(() => [...document.querySelectorAll(".offer:not(.gate-sheet)")].some((e) => !e.hidden))), "没有模态的面");
  await p.waitForFunction(() => !document.querySelector('[data-notice-id="offline-bar"]'), null, { timeout: 8000 });
  await p.waitForTimeout(500);
  check((await cloudHexOf(w, id)) === cloudBefore, "(c) 回来不传：云端字节没动");
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 1, "(c) 脏还在（等人按存 / 退出 / 去处理）");
  v = await p.view();
  check(v.bar === null && v.online === true, "条收掉、回到在线", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("③b 「离线继续」不进任何存储：重开又走一遍", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  await p.clickGate("离线继续"); await p.waitForTimeout(200);
  check(!(await p.evaluate(() => window.__moonsinger.cloudOnline())), "选了离线");
  check(!(await p.evaluate(() => JSON.stringify(Object.entries(localStorage)).includes("userOffline"))), "localStorage 里没有这个记忆");
  await p.reopen();
  await p.waitPhase("blocked");
  const v = await p.view();
  check(v.up && v.online === true && v.bar === null, "刷新 = 重新走一遍", JSON.stringify(v));
  await p.close2();
});

scenario("③c 重新登录：取消回到闸；去登录 → 放行", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  await p.clickGate("重新登录");
  await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('去登录')", { timeout: 5000 });
  let v = await p.view();
  check(!v.up && v.phase === "blocked", "让开锁屏位，「去登录」那张面看得见", JSON.stringify(v));
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  v = await p.view();
  check(v.up && v.title === "网盘没连上", "没跳走 = 回到闸", JSON.stringify(v));
  await p.clickGate("重新登录");
  await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('去登录')", { timeout: 5000 });
  await p.click(".offer:not(.gate-sheet) button:has-text('去登录')");
  await p.waitPhase("open"); await p.waitForTimeout(300);
  v = await p.view();
  check(!v.up && v.online && v.bar === null, "登录好了 → 放行、在线、没有条", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("④ 没网：直接进闸，不等超时、不续签；网回来自己放行", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "ok", net: false });
  const t0 = Date.now();
  await p.waitPhase("blocked", 4000);
  console.log(`  开页到进闸 ${Date.now() - t0} ms`);
  let v = await p.view();
  check(v.message === "现在没有网络", "正文 = 现在没有网络", String(v.message));
  check(v.authCalls === 0, "没去续签", String(v.authCalls));
  await p.clickGate("重新登录"); await p.waitForTimeout(300);
  v = await p.view();
  check(v.up && v.phase === "blocked" && v.authCalls === 0, "没网时「重新登录」不跳走，还在闸上", JSON.stringify(v));
  await p.net(true);
  await p.waitPhase("open");
  v = await p.view();
  check(!v.up && v.online, "网回来了：闸门自己核完放行", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("⑤ 云端慢：先离线用 立刻放行；不点 8 s 进闸；云端回了自己放行", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "ok" }, { reopen: false });
  let release; w.hold = new Promise((r) => { release = r; });
  await p.reopen();
  await p.waitPhase("checking", 5000);
  let v = await p.view();
  check(v.up && v.title === "正在核对网盘上的版本…" && v.buttons.join("|") === "先离线用", "罩从一开始就有逃生钮", JSON.stringify(v));
  const t1 = Date.now();
  await p.clickGate("先离线用");
  await p.waitPhase("open", 1000);
  console.log(`  点到放行 ${Date.now() - t1} ms`);
  v = await p.view();
  check(!v.up && v.bar != null && !v.online, "放行 + 条", JSON.stringify(v));
  const before = w.log.length;
  await typeNote(p, ["6"]); await p.waitForTimeout(300);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());
  await p.waitForTimeout(500);
  check(w.log.length === before, "选了离线：写歌、存本机，一条新请求都不发", w.log.slice(before).join(","));
  await p.net(false);   // 有网时回前台会悄悄试一次（设计稿 §2，Fable 已接受）；这里看没网这一条
  await p.hide(); await p.waitForTimeout(100); await p.show(); await p.waitForTimeout(500);
  check(w.log.length === before, "没网、回前台：还是一条都不发", w.log.slice(before).join(","));
  // 不点：8 s 自动进闸
  await p.reopen();
  await p.waitPhase("checking", 5000);
  const t0 = Date.now();
  await p.waitPhase("blocked", 12000);
  check(Date.now() - t0 < 10000, "不超过 10 s 进闸", String(Date.now() - t0));
  v = await p.view();
  check(v.message === "网盘没有回应", "正文 = 网盘没有回应", String(v.message));
  release(); w.hold = null;
  await p.waitPhase("open", 8000);
  v = await p.view();
  check(!v.up && v.online && v.bar === null, "云端回了：不用人点，自己放行", JSON.stringify(v));
  await p.close2();
});

scenario("⑥ 醒来：离开久了先罩；短暂切走悄悄核；过期 → 闸；已选离线且没网不再弹闸", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "ok" });
  await p.waitPhase("open"); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__gateTimes.length = 0; });
  const reads0 = w.log.length;
  await p.hide(); await p.waitForTimeout(50); await p.show(); await p.waitForTimeout(500);
  check((await p.evaluate(() => window.__gateTimes.filter((x) => x.up).length)) === 0, "短暂切走：不罩（写谱不吃键）");
  check(w.log.length > reads0, "但确实问了云端", String(w.log.length - reads0));
  await p.evaluate(() => { const real = Date.now; window.__skew = (window.__skew ?? 0); Date.now = () => real() + window.__skew; });
  await p.hide(); await p.waitForTimeout(50); await p.evaluate(() => { window.__skew += 11 * 60_000; }); await p.show(); await p.waitForTimeout(400);
  const ups = (await p.evaluate(() => window.__gateTimes)).filter((x) => x.up);
  check(ups.length >= 1 && /核对/.test(ups[0].title), "离开 10 分钟以上：罩过一下", JSON.stringify(ups));
  await p.patchAuth({ renew: "interaction" });
  await p.evaluate(() => window.__e2eExpire()); await p.waitForTimeout(100);
  check(!(await p.view()).up, "过期的广播本身不弹闸（闸只在开机 / 醒来）");
  await p.hide(); await p.waitForTimeout(50); await p.show();
  await p.waitPhase("blocked", 5000);
  let v = await p.view();
  check(v.up && v.message === "登录过期了", "醒来发现过期 → 闸", JSON.stringify(v));
  await p.clickGate("离线继续"); await p.waitForTimeout(200);
  await p.net(false); await p.waitForTimeout(100);
  const authBefore = (await p.view()).authCalls;
  await p.hide(); await p.waitForTimeout(50); await p.show(); await p.waitForTimeout(300);
  v = await p.view();
  check(!v.up && v.phase === "open" && v.bar != null, "已选离线且仍没网：不弹闸、条还在", JSON.stringify(v));
  check(v.authCalls === authBefore, "也不去续签", String(v.authCalls - authBefore));
  await p.net(true); await p.waitForTimeout(400);
  v = await p.view();
  check(!v.up && v.bar != null && !v.online, "回线、续签没成：条还在、不弹闸", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("⑧ 黑匣子：每次续签的结果和原因码都记着", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked"); await p.waitForTimeout(400);
  const log = await p.evaluate(() => Object.entries(localStorage).filter(([k]) => k.endsWith("diag-log")).map(([, v]) => v).join(""));
  check(/silent renew \(boot\): failed elapsed=\d+ms name=InteractionRequiredAuthError code=interaction_required/.test(log), "失败：结果 + 耗时 + 原因码", log.slice(-300));
  check(/initAuth signedIn=false probing=true home=true/.test(log), "init 也记（有没有家）", log.slice(-300));
  check(/gate: blocked reason=expired/.test(log), "进闸的原因", log.slice(-300));
  await p.close2();
});

scenario("手里是本机文件 / 没账号：永不闸", async (w) => {
  const p = await w.device();
  await p.setAuth({});   // 没账号
  await p.reopen();
  await p.evaluate(() => window.__moonsinger.attach()); await p.waitForTimeout(400);
  const v = await p.view();
  check(!v.up && v.phase === "open" && v.authCalls === 0, "进过歌库但没账号：没有闸（不当登录墙，§9）", JSON.stringify(v));
  await p.close2();
});

scenario("歌库披露：没账号 = 顶上常驻一行 + 全部导出（一个 zip）+ 连接网盘；登录了就没有", async (w) => {
  const p = await w.device();
  await p.setAuth({});
  await p.reopen();
  await p.evaluate(() => window.__moonsinger.attach()); await p.waitForTimeout(400);
  await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(300);
  await typeNote(p); await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());
  const id = await p.evaluate(() => window.__moonsinger.identifier());
  await p.evaluate(() => window.__moonsinger.openGallery?.()); await p.waitForTimeout(600);
  const shown = () => p.evaluate(() => { const b = document.querySelector(".gallery-home-bar"); return !!b && !b.hidden ? b.textContent : null; });
  const t = await shown();
  check(!!t && t.includes("只在这台设备的浏览器里") && t.includes("没有备份"), "披露条在", String(t));
  check(!!t && t.includes("全部导出") && t.includes("连接网盘"), "两个出口都在", String(t));
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }), (async () => { await p.click('.gallery-home-bar [data-v="export-all"]'); await p.waitForSelector(".offer button[data-v='download']", { timeout: 10000 }); await p.click(".offer button[data-v='download']"); })()]);
  const name = dl.suggestedFilename();
  check(/^MoonSinger-歌库-\d{8}-\d{4}\.zip$/.test(name), "导出的是一个带时间的 zip", name);
  const path = await dl.path();
  const fs = await import("node:fs");
  const bytes = fs.readFileSync(path);
  check(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes.includes(Buffer.from(id)), "zip 里有这首歌", id);
  await p.click('.gallery-home-bar [data-v="connect"]');
  await p.waitForSelector(".offer button:has-text('去登录')", { timeout: 5000 });
  check(true, "连接网盘 = 去登录那张面");
  await p.click(".offer button:has-text('去登录')"); await p.waitForTimeout(500);
  check((await shown()) === null, "登录了：披露条收掉");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("歌库披露：有账号但登录过期 = 不说「没有备份」（那不是实话；闸门和条说）", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  await p.clickGate("离线继续"); await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.openGallery?.()); await p.waitForTimeout(500);
  check(await p.evaluate(() => { const b = document.querySelector(".gallery-home-bar"); return !b || b.hidden; }), "披露条不挂");
  await p.close2();
});

scenario("F-147 B：点「刷新」先推手里这首；云端挂着最多等 5 s 也照样刷", async (w) => {
  const { p, id } = await seed(w, { account: true, signedIn: false, renew: "ok" });
  await p.waitPhase("open"); await p.waitForTimeout(600);
  await typeNote(p, ["7"]); await p.waitForTimeout(150);
  check(await p.evaluate(() => window.__moonsinger.es().isDirty?.() ?? true), "手里有没存的改动（前提）");
  const cloudBytes = async () => { const it = (await w.cloud.list("")).find((x) => x.name === id); return it ? Buffer.from(await (await w.cloud.download(it.ref)).arrayBuffer()).toString("hex") : null; };
  const before = await cloudBytes();
  const nav = p.waitForEvent("load", { timeout: 8000 });
  await p.evaluate(() => { void window.__moonsinger.updateReload(); });
  await nav; await p.waitForFunction(() => !!window.__moonsinger?.gate);
  const after = await cloudBytes();
  check(after !== before, "刷新之前推上去了（云端字节变了）");
  await p.waitPhase("open"); await p.waitForTimeout(300);
  // 云端挂着：5 s 到点照样刷，字节在本机
  await typeNote(p, ["1"]); await p.waitForTimeout(150);
  let release; w.holdUpload = new Promise((r) => { release = r; });
  const t0 = Date.now();
  const nav2 = p.waitForEvent("load", { timeout: 9000 });
  await p.evaluate(() => { void window.__moonsinger.updateReload(); });
  await nav2;
  const dt = Date.now() - t0;
  console.log(`  云端挂着：${dt} ms 后刷了`);
  check(dt < 7000, "最多等 5 s 左右", String(dt));
  release(); w.holdUpload = null;
  await p.waitForFunction(() => !!window.__moonsinger?.gate);
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("H2：冲突面开着 5 s 到点不刷；选了 / 取消之后才刷", async (w) => {
  const { p, id } = await seed(w, { account: true, signedIn: false, renew: "ok" });
  await p.waitPhase("open"); await p.waitForTimeout(600);
  const other = await w.device();
  await other.setAuth({ account: true, signedIn: true, renew: "ok" }); await other.reopen();
  await other.evaluate(() => window.__moonsinger.attach()); await other.waitForTimeout(300); await other.waitPhase("open");
  const otherPushes = async (keys) => {
    await other.evaluate((x) => window.__moonsinger.openStoreDoc(x), id); await other.waitForTimeout(400);
    await typeNote(other, keys); await other.waitForTimeout(150);
    await other.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await other.waitForTimeout(300);
  };
  const faceButtons = () => p.evaluate(() => { const g = document.querySelector(".gate-sheet"); return g && !g.hidden ? [...g.querySelectorAll(".gate-actions button")].map((b) => b.textContent) : null; });
  const cloudHex = async () => { const it = (await w.cloud.list("")).find((x) => x.name === id); return Buffer.from(await (await w.cloud.download(it.ref)).arrayBuffer()).toString("hex"); };
  const noteCount = (pg) => pg.evaluate(() => window.__moonsinger.state().song.papers[0].tracks.P1.filter((t) => t.kind === "note").length);
  const askReload = async () => { await p.evaluate(() => { window.__notReloaded = true; void window.__moonsinger.updateReload(); }); await p.waitForSelector(".gate-sheet:not([hidden]) .gate-actions button", { timeout: 8000 }); };
  const reloaded = () => p.evaluate(() => !window.__notReloaded);

  // ① 面开着：5 s 到点不刷，人选「本地覆盖云端」= 按选的推完才刷
  await otherPushes(["5"]);
  await typeNote(p, ["1"]); await p.waitForTimeout(150);
  const forked = await cloudHex();
  await askReload();
  const buttons = await faceButtons();
  check(!!buttons && buttons.includes("本地覆盖云端") && buttons.includes("云端覆盖本地"), "点刷新撞上真分叉 = 冲突面", JSON.stringify(buttons));
  await p.waitForTimeout(6500);
  check(!(await reloaded()), "面开着：过了 5 s 也没刷");
  check(!!(await faceButtons()), "面还开着");
  check((await cloudHex()) === forked, "人没选：云端没动");
  const mineNotes = await noteCount(p);
  let nav = p.waitForEvent("load", { timeout: 9000 });
  await p.clickGate("本地覆盖云端");
  await nav; await p.waitForFunction(() => !!window.__moonsinger?.gate);
  check((await cloudHex()) !== forked, "选了本地覆盖云端：推完才刷（云端变了）");
  await p.waitPhase("open"); await p.waitForTimeout(600);
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 0, "推完没有脏");
  check((await noteCount(p)) === mineNotes, "刷完还是自己这一版", String(await noteCount(p)));

  // ② 取消 = 刷新继续，云端不动、脏留本地
  await otherPushes(["6"]);
  await typeNote(p, ["2"]); await p.waitForTimeout(150);
  const forked2 = await cloudHex();
  await askReload();
  nav = p.waitForEvent("load", { timeout: 9000 });
  await p.clickGate("取消");
  await nav; await p.waitForFunction(() => !!window.__moonsinger?.gate);
  check((await cloudHex()) === forked2, "取消：云端没动");
  await p.waitForTimeout(800);
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) >= 1, "取消：脏留在本地");

  // ③ 选「云端覆盖本地」= 拉完才刷，刷完是云端那一版；本机那版进备份箱
  await p.waitPhase("open");
  await p.waitForTimeout(300);
  await typeNote(p, ["3"]); await p.waitForTimeout(150);
  await askReload();
  nav = p.waitForEvent("load", { timeout: 9000 });
  await p.clickGate("云端覆盖本地");
  await nav; await p.waitForFunction(() => !!window.__moonsinger?.gate);
  await p.waitPhase("open"); await p.waitForTimeout(600);
  check((await cloudHex()) === forked2, "选了云端覆盖本地：云端没动");
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 0, "拉完没有脏");
  check((await p.evaluate(() => window.__moonsinger.store().files.listBackup().then((l) => l.length))) >= 1, "本机那一版进了备份箱");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await other.close2(); await p.close2();
});

scenario("H4 (a)：从没传过的 = 问一次，稍后进列表、现在传才传；一页只问一次", async (w) => {
  const p = await w.device();
  await p.setAuth({ renew: "ok" });
  await p.evaluate(() => localStorage.setItem("moonsinger-5b1e7c0a92d34f6e:moveAsked", "1"));   // 这里测的是「回来问一次」，不是搬家那张面（那张归 folder-home.mjs）
  await p.reopen();
  await p.evaluate(() => window.__moonsinger.attach()); await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(300);
  await typeNote(p); await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());
  const id = await p.evaluate(() => window.__moonsinger.identifier());
  const inCloud = async () => (await w.cloud.list("")).some((x) => x.name === id);
  const sheet = () => p.evaluate(() => { const o = [...document.querySelectorAll(".offer:not(.gate-sheet)")].find((e) => !e.hidden); return o ? o.textContent : null; });
  const signIn = () => p.evaluate(() => { window.__moonsingerCloudSignedIn = true; return window.__moonsinger.afterSignIn(); });
  await signIn(); await p.waitForTimeout(300);
  const t = await sheet();
  check(!!t && t.includes("有 1 首只在这台设备") && t.includes("现在传") && t.includes("稍后"), "问一次：两个钮", String(t));
  check(!!t && t.includes("不会被盖掉"), "说了撞上别的设备不覆盖", String(t));
  check(!(await inCloud()), "没点之前：没传");
  await p.click(".offer:not(.gate-sheet) button:has-text('稍后')"); await p.waitForTimeout(300);
  check(!(await inCloud()), "稍后：什么都不传");
  check(/要处理/.test(await p.evaluate(() => document.querySelector('[data-notice-id="unsynced"]')?.textContent ?? "")), "稍后 = 进列表，有一条说明");
  await signIn(); await p.waitForTimeout(300);
  check(!(await sheet()), "一页只问一次");
  await p.reopen(); await p.waitForTimeout(500);
  await signIn(); await p.waitForTimeout(300);
  check(((await sheet()) ?? "").includes("现在传"), "下次打开再问");
  await p.click(".offer:not(.gate-sheet) button:has-text('现在传')"); await p.waitForTimeout(800);
  check(await inCloud(), "现在传：传上去了");
  check(/都传上去了/.test(await p.evaluate(() => document.querySelector('[data-notice-id="unsynced"]')?.textContent ?? "")), "说了传上去了");
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 0, "没有脏");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("H4 (b)：传过、按过存没传成 = 回来自动续传，不问；选了离线按「存」零云端请求", async (w) => {
  const { p, id } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  await p.clickGate("离线继续"); await p.waitForTimeout(300);
  const cloudHex = async () => { const it = (await w.cloud.list("")).find((x) => x.name === id); return Buffer.from(await (await w.cloud.download(it.ref)).arrayBuffer()).toString("hex"); };
  const before = await cloudHex();
  await typeNote(p, ["5"]); await p.waitForTimeout(150);
  const logAtSave = w.log.length;
  await p.click("#saveBtn"); await p.waitForTimeout(400);   // 按「存」：离线，没传成
  check(w.log.length === logAtSave, "选了离线按「存」：零云端请求", w.log.slice(logAtSave).join(","));
  check(await p.evaluate(() => window.__moonsinger.es().isPushOwed()), "按过存没传成 = 欠一推（前提）");
  check((await cloudHex()) === before, "选了离线按「存」：一条网都不打（这条原来是漏的）");
  await p.patchAuth({ renew: "ok" });
  await p.evaluate(() => window.dispatchEvent(new Event("online")));
  await p.waitForFunction(() => !window.__moonsinger.es().isPushOwed(), null, { timeout: 8000 });
  await p.waitForTimeout(300);
  check((await cloudHex()) !== before, "回来：自动续传了");
  check(!(await p.evaluate(() => [...document.querySelectorAll(".offer:not(.gate-sheet)")].some((e) => !e.hidden))), "没问");
  check(!(await p.$('[data-notice-id="unsynced"]')), "也没有「在列表里」那条（不欠了）");
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 0, "没有脏");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

// 2026-11-04 Claude Opus 5.5（接手 H4）：下面两场补的是表上写了、原来没有 e2e 作证的两格：(b)(c) 同时有、(a)(c) 同时有。
scenario("H4 (b)+(c)：开着那首按过存 = 续传；另一首只是改过、不是开着的 = 不传不问，进列表", async (w) => {
  const { p, id: a } = await seed(w, { account: true, signedIn: false, renew: "interaction" }, { reopen: false });
  await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(300);   // 这一页还登录着：第二首也推上去
  await typeNote(p, ["6"]); await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.es().forceSaveAndPush()); await p.waitForTimeout(400);
  const bId = await p.evaluate(() => window.__moonsinger.identifier());
  check(bId !== a && (await cloudHexOf(w, bId)) !== null, "前提：两首都在云端", String(bId));
  await p.evaluate((x) => window.__moonsinger.openStoreDoc(x), a); await p.waitForTimeout(400);   // 上次开着的 = A
  await p.reopen();
  await p.waitPhase("blocked");
  await p.clickGate("离线继续"); await p.waitForTimeout(300);
  check((await p.evaluate(() => window.__moonsinger.identifier())) === a, "开着的是 A");
  const aBefore = await cloudHexOf(w, a), bBefore = await cloudHexOf(w, bId);
  await p.evaluate((x) => window.__moonsinger.openStoreDoc(x), bId); await p.waitForTimeout(400);
  await typeNote(p, ["7"]); await p.waitForTimeout(150);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());   // B：只落本机
  await p.evaluate((x) => window.__moonsinger.openStoreDoc(x), a); await p.waitForTimeout(400);
  await typeNote(p, ["5"]); await p.waitForTimeout(150);
  await p.click("#saveBtn"); await p.waitForTimeout(400);   // A：按「存」，离线没传成
  check(await p.evaluate(() => window.__moonsinger.es().isPushOwed()), "A 欠一推（前提）");
  check((await cloudHexOf(w, a)) === aBefore && (await cloudHexOf(w, bId)) === bBefore, "离线期间两首都没动云端");
  await p.patchAuth({ renew: "ok" });
  await p.evaluate(() => window.dispatchEvent(new Event("online")));
  await p.waitForFunction(() => !window.__moonsinger.es().isPushOwed(), null, { timeout: 8000 });
  await p.waitForSelector('[data-notice-id="unsynced"]', { timeout: 8000 });
  await p.waitForTimeout(300);
  check((await cloudHexOf(w, a)) !== aBefore, "A 续传了");
  check((await cloudHexOf(w, bId)) === bBefore, "B 没传");
  check(!(await anySheet(p)), "没问");
  check(/1 首没传上去/.test(await noticeText(p)) && /要处理/.test(await noticeText(p)), "说了 1 首在「要处理」列表里", await noticeText(p));
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 1, "脏只剩 B");
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("H4 (a)+(c)：从没传过的 + 传过只改过的 = 面上两样都说；现在传 = 两首一起传", async (w) => {
  const { p, id: a } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  await p.clickGate("离线继续"); await p.waitForTimeout(300);
  const aBefore = await cloudHexOf(w, a);
  await typeNote(p, ["5"]); await p.waitForTimeout(150);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());   // A = (c)
  await p.evaluate(() => window.__moonsinger.newStoreSong()); await p.waitForTimeout(300);
  await typeNote(p); await p.waitForTimeout(300);
  await p.evaluate(() => window.__moonsinger.es().flushLocal());   // N = (a)：离线时新建，云端没有这个名字
  const n = await p.evaluate(() => window.__moonsinger.identifier());
  check(!!n && n !== a && (await cloudHexOf(w, n)) === null, "前提：N 不在云端", String(n));
  await p.patchAuth({ renew: "ok" });
  await p.evaluate(() => window.dispatchEvent(new Event("online")));
  await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('现在传')", { timeout: 10000 });
  const t = (await anySheet(p)) ?? "";
  check(t.includes("有 1 首只在这台设备") && t.includes("还有 1 首改过没传") && t.includes("现在全传"), "面上两样都说", t);
  check((await cloudHexOf(w, n)) === null && (await cloudHexOf(w, a)) === aBefore, "点之前：都没传");
  await p.click(".offer:not(.gate-sheet) button:has-text('现在传')"); await p.waitForTimeout(800);
  check((await cloudHexOf(w, n)) !== null, "现在传：N 上去了");
  check((await cloudHexOf(w, a)) !== aBefore, "现在传：A 也上去了");
  check((await p.evaluate(() => window.__moonsinger.store().files.dirty.count())) === 0, "没有脏");
  check(/2 首都传上去了/.test(await noticeText(p)), "说了都传上去了", await noticeText(p));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

scenario("闸门 §3：续签成了、云端不答 = 不清离线、不弹；云端答了才回来", async (w) => {
  const { p } = await seed(w, { account: true, signedIn: false, renew: "interaction" });
  await p.waitPhase("blocked");
  await p.clickGate("离线继续"); await p.waitForTimeout(300);
  await p.patchAuth({ renew: "ok" });
  let release; w.hold = new Promise((r) => { release = r; });
  const t0 = Date.now();
  const logAt = w.log.length;
  const going = p.evaluate(() => window.__moonsinger.gate.reconnect());
  await p.waitForTimeout(2000);
  const mid = await p.evaluate(() => window.__moonsinger.cloudOnline());
  check(mid === false, "等云端答话期间：离线没被清（store 不出网）", String(mid));
  check(w.log.slice(logAt).join() === "getItemByPath", "这期间只有一次探路（不经 store）", w.log.slice(logAt).join(","));
  await going;
  const dt = Date.now() - t0;
  let v = await p.view();
  console.log(`  云端不答：${dt} ms 后放弃`);
  check(dt >= 7500 && dt < 12000, "硬超时 8 s 左右", String(dt));
  check(v.online === false && !!v.bar, "还是离线，条还在", JSON.stringify(v));
  check(!v.up, "不弹闸", JSON.stringify(v));
  release(); w.hold = null;
  await p.waitForTimeout(200);
  await p.evaluate(() => window.__moonsinger.gate.reconnect()); await p.waitForTimeout(500);
  v = await p.view();
  check(v.online === true && v.bar === null, "云端答了：回来了", JSON.stringify(v));
  check(p.__errs.length === 0, "页面零报错", p.__errs.join(" ; "));
  await p.close2();
});

const only = process.argv[2] ?? "";
for (const s of scenarios) {
  if (only && !s.name.includes(only)) continue;
  console.log(`\n── ${s.name}`);
  const w = world();
  try { await Promise.race([s.fn(w), new Promise((_, rej) => setTimeout(() => rej(new Error("scenario timed out (70s)")), 70000))]); }
  catch (e) { check(false, "场景跑完", String(e?.message ?? e)); }
}
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
