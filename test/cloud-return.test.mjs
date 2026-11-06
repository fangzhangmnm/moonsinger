// test/cloud-return.test.mjs —— 回来时没传的东西分三种（规则书 §1 第 15 条，2026-11-03 夜改写；工单 H4；同 WeebPaint）。created 2026-11-04 by Claude Opus 5.5
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, eq, assert } from "./runner.mjs";
import { createEditorSession } from "../src/editor-session/index.ts";
import { planReturn, neverUploadedIds, isOpenDocAutosaveOnly, stillLocalIds } from "../src/app/cloud-return.ts";

describe("planReturn", () => {
  it("什么都没脏：不问不提", () => eq(planReturn(0, 0).kind, "none"));
  it("只有传过的（c）：不问不推，进列表", () => { const p = planReturn(3, 0); eq(p.kind, "list"); eq(p.total, 3); });
  it("只有从没传过的（a）：问，others = 0", () => { const p = planReturn(2, 2); eq(p.kind, "ask"); eq(p.neverUploaded, 2); eq(p.others, 0); });
  it("两样都有：问，两个数都带上", () => { const p = planReturn(5, 2); eq(p.kind, "ask"); eq(p.neverUploaded, 2); eq(p.others, 3); });
  it("数不齐（列举比脏账多）：others 不为负", () => eq(planReturn(1, 2).others, 0));
  // F-200（user 11-05「切换前后台之后说需要处理」）：开着这首只是自动保存 = 它不是回来发现的事
  it("只有开着的这首自动保存：什么都不说", () => eq(planReturn(1, 0, true).kind, "none"));
  it("开着的 + 别的一首：说 1 首", () => { const p = planReturn(2, 0, true); eq(p.kind, "list"); eq(p.total, 1); });
  it("开着的从没传过（它是 (a)，不算自动保存）：问", () => { const p = planReturn(1, 1, false); eq(p.kind, "ask"); eq(p.neverUploaded, 1); });
  it("要问 (a) 时不减：现在全传确实会连开着的一起传，面上的数要算它", () => { const p = planReturn(2, 1, true); eq(p.kind, "ask"); eq(p.others, 1); });
});
describe("isOpenDocAutosaveOnly：问库，不问 isPushPending", () => {
  const files = [{ identifier: "a.mxl", syncState: "unpushed" }, { identifier: "b.mxl", syncState: "synced" }, { identifier: "c.mxl", syncState: "conflict" }, { identifier: "d.mxl", syncState: "float" }];
  it("库说它改过没传、人没按过存：是", () => assert(isOpenDocAutosaveOnly(files, "a.mxl", false)));
  it("人按过存（(b)，要么续传成了不在账上、要么真没传成）：不是", () => assert(!isOpenDocAutosaveOnly(files, "a.mxl", true)));
  it("字节还没落盘 = 不在脏账上（库说 synced）：不是——减了就把别的歌藏掉了", () => assert(!isOpenDocAutosaveOnly(files, "b.mxl", false)));
  it("分叉（真要人选）/ 从没传过：不是", () => { assert(!isOpenDocAutosaveOnly(files, "c.mxl", false)); assert(!isOpenDocAutosaveOnly(files, "d.mxl", false)); });
  it("没开着歌：不是", () => assert(!isOpenDocAutosaveOnly(files, null, false)));
});
describe("stillLocalIds", () => {
  it("点名传过还没传的，不含开着那首、不含从没传过的、不含干净的", () => {
    const f = [{ identifier: "a", syncState: "unpushed" }, { identifier: "b", syncState: "unpushed" }, { identifier: "c", syncState: "conflict" }, { identifier: "d", syncState: "float" }, { identifier: "e", syncState: "synced" }];
    eq(stillLocalIds(f, "a").join(), "b,c");
    eq(stillLocalIds(f, null).join(), "a,b,c");
  });
});
describe("neverUploadedIds", () => {
  it("只认 float：local-only 是人选了只留本机（干净），unpushed / conflict / ghost 是传过或撞名的", () => {
    const ids = neverUploadedIds([
      { identifier: "a.mxl", syncState: "float" }, { identifier: "b.mxl", syncState: "local-only" },
      { identifier: "c.mxl", syncState: "unpushed" }, { identifier: "d.mxl", syncState: "conflict" },
      { identifier: "e.mxl", syncState: "ghost" }, { identifier: "f.mxl", syncState: "synced" }, { identifier: "g.mxl" },
    ]);
    eq([...ids].join(), "a.mxl");
  });
});
describe("EditorSession.isPushOwed：按过存没传成，和只是改过分得开", () => {
  function rig(pushed) {
    let onChange = () => {};
    const st = { pushed };
    const store = { file: () => ({ open: async () => new Blob(["D"]), save: async (_b, o) => ({ pushed: o?.tryPush ? st.pushed : false }) }) };
    const editor = { encode: async () => ({ bytes: new Blob(["D"]), peek: null }), adopt: async () => {}, onChange: (cb) => { onChange = cb; } };
    const es = createEditorSession({ store, editor });
    return { es, st, edit: () => onChange() };
  }
  it("改过 + 自动保存：不欠（pushPending 是真的，但没按存）", async () => {
    const r = rig(false); await r.es.open("x.mxl");
    r.edit(); await r.es.flushLocal();
    assert(r.es.isPushPending()); assert(!r.es.isPushOwed());
  });
  it("按存没传成：欠", async () => {
    const r = rig(false); await r.es.open("x.mxl");
    r.edit(); await r.es.forceSaveAndPush();
    assert(r.es.isPushPending()); assert(r.es.isPushOwed());
  });
  it("按存没传成，之后又改了：不欠（新的那笔没按过存）", async () => {
    const r = rig(false); await r.es.open("x.mxl");
    r.edit(); await r.es.forceSaveAndPush(); r.edit();
    assert(!r.es.isPushOwed());
  });
  // 2026-11-04 Claude Opus 5.5（接手 H4）：MoonSinger 的编辑不走 editor.onChange（main.ts 里是空的），走 changed() → es.markDirty()；上一条只核了 onChange 那条路
  it("按存没传成，之后 markDirty（本 app 真实的编辑路径）：不欠", async () => {
    const r = rig(false); await r.es.open("x.mxl");
    r.es.markDirty(); await r.es.forceSaveAndPush(); assert(r.es.isPushOwed(), "前提：欠");
    r.es.markDirty();
    assert(!r.es.isPushOwed()); assert(r.es.isPushPending());
  });
  it("按存传成了：不欠；续传成了也清", async () => {
    const r = rig(true); await r.es.open("x.mxl");
    r.edit(); await r.es.forceSaveAndPush();
    assert(!r.es.isPushOwed());
    r.st.pushed = false; r.edit(); await r.es.forceSaveAndPush(); assert(r.es.isPushOwed());
    r.st.pushed = true; await r.es.flushAndPush(); assert(!r.es.isPushOwed()); assert(!r.es.isPushPending());
  });
  it("库替它推了（问一次点了现在传）：不欠", async () => {
    const r = rig(false); await r.es.open("x.mxl");
    r.edit(); await r.es.forceSaveAndPush(); r.es.noteExternallyPushed();
    assert(!r.es.isPushOwed()); assert(!r.es.isPushPending());
  });
});
describe("接线守卫（规则书第 15 条）", () => {
  const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.ts$/.test(n) ? [p] : []; });
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  const main = readFileSync("src/app/main.ts", "utf8");
  const ask = main.slice(main.indexOf("async function askReturn("), main.indexOf("/** 选一张图当封面"));
  const still = main.slice(main.indexOf("function showStillLocal("), main.indexOf("async function pushAllNow("));
  const now = main.slice(main.indexOf("async function pushAllNow("), main.indexOf("async function askReturn("));
  it("全仓 pushAll 只有两处：人点了传（pushAllNow）、退出时人点的「下载备份」", () => {
    const sites = []; for (const p of walk("src")) { const n = strip(readFileSync(p, "utf8")).split("dirty.pushAll(").length - 1; if (n) sites.push(`${p}:${n}`); }
    eq(sites.join(" "), "src/app/main.ts:2");
    assert(strip(main.slice(main.indexOf("async function backupDirty("), main.indexOf("async function backupDirty(") + 400)).includes("dirty.pushAll("), "第二处是 backupDirty");
    assert(now.includes("dirty.pushAll("), "第一处是 pushAllNow");
  });
  it("pushAllNow 只由人点的钮调：问一次面点了「现在传」、通知上的「传上去」", () => {
    eq(strip(main).split("pushAllNow(").length - 1, 3, "定义一处 + 两个调用");
    assert(/onClick: \(\) => \{ closeNotice\("unsynced"\); void pushAllNow\(/.test(still), "通知上：在 onClick 里");
    assert(/openConfirmSheet[\s\S]*if \(!go\) \{[\s\S]*return;[\s\S]*\}\s*await pushAllNow\(total\);/.test(ask), "面上：先问、稍后 return、点了才传");
    assert(!/dirty\.pushAll/.test(ask) && !/dirty\.pushAll/.test(still), "别处不直接推");
  });
  it("(c) 通知不把人送去歌库：没有「去处理」，有「以后再说」；pushAll 没传成那条的「去处理」留着", () => {
    assert(!still.includes("去处理") && !still.includes("openGallery"), "传上去不离开当前这首");
    assert(still.includes("以后再说"));
    assert(now.includes("去处理") && now.includes("openGallery"), "真要人选的才去歌库");
  });
  it("一页只问一次；没有从没传过的 = 不问不推", () => {
    assert(/askedReturn = true;[\s\S]*openConfirmSheet/.test(ask), "一页只问一次");
    assert(/plan\.kind === "list"\) \{ askedReturn = true; showStillLocal\(/.test(ask), "只有 (c)：说一声");
  });
  it("(b) 先续传再数；从没传过的不走续传", () => {
    const s = main.slice(main.indexOf("async function settleReturnOnce("), main.indexOf("function showStillLocal("));
    assert(s.indexOf("resumeOwedPush(never)") < s.indexOf("planReturn("));
    assert(s.indexOf("isOpenDocAutosaveOnly(") < s.indexOf("resumeOwedPush(never)"), "开着这首算不算在续传之前定：续传之后列表是旧的");
    assert(/!es\.isPushOwed\(\) \|\| never\.has\(id\)/.test(s));
  });
  it("跟上网盘的路不等人答：问在最后、不 await", () => {
    const f = /function afterSignIn\(\): Promise<void> \{[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
    assert(/ask\?\.\(\);/.test(f) && f.indexOf("refreshOpenDoc") < f.indexOf("ask?.()"));
    assert(!/dirty\.pushAll/.test(f), "回线不自己批量推");
  });
});
