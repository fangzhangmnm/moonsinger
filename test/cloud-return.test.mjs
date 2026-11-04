// test/cloud-return.test.mjs —— 回来时没传的东西分三种（规则书 §1 第 15 条，2026-11-03 夜改写；工单 H4；同 WeebPaint）。created 2026-11-04 by Claude Opus 5.5
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, eq, assert } from "./runner.mjs";
import { createEditorSession } from "../src/editor-session/index.ts";
import { planReturn, neverUploadedIds } from "../src/app/cloud-return.ts";

describe("planReturn", () => {
  it("什么都没脏：不问不提", () => eq(planReturn(0, 0).kind, "none"));
  it("只有传过的（c）：不问不推，进列表", () => { const p = planReturn(3, 0); eq(p.kind, "list"); eq(p.total, 3); });
  it("只有从没传过的（a）：问，others = 0", () => { const p = planReturn(2, 2); eq(p.kind, "ask"); eq(p.neverUploaded, 2); eq(p.others, 0); });
  it("两样都有：问，两个数都带上", () => { const p = planReturn(5, 2); eq(p.kind, "ask"); eq(p.neverUploaded, 2); eq(p.others, 3); });
  it("数不齐（列举比脏账多）：others 不为负", () => eq(planReturn(1, 2).others, 0));
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
  it("全仓 pushAll 只有两处：问一次面点了「现在传」、退出时人点的「下载备份」", () => {
    const sites = []; for (const p of walk("src")) { const n = strip(readFileSync(p, "utf8")).split("dirty.pushAll(").length - 1; if (n) sites.push(`${p}:${n}`); }
    eq(sites.join(" "), "src/app/main.ts:2");
    assert(strip(main.slice(main.indexOf("async function backupDirty("), main.indexOf("async function backupDirty(") + 400)).includes("dirty.pushAll("), "第二处是 backupDirty");
    assert(ask.includes("dirty.pushAll("), "第一处是问一次面");
  });
  it("先问才推；不是「现在传」就不推；一页只问一次；没有从没传过的 = 不问不推", () => {
    assert(ask.indexOf("openConfirmSheet") >= 0 && ask.indexOf("openConfirmSheet") < ask.indexOf("dirty.pushAll("), "先问");
    assert(/if \(!go\) \{ showInList\(total\); return; \}/.test(ask), "稍后 = 进列表，什么都不推");
    assert(/askedReturn = true;[\s\S]*openConfirmSheet/.test(ask), "一页只问一次");
    assert(/plan\.kind === "list"\) \{ askedReturn = true; showInList\(plan\.total\); return; \}/.test(ask), "只有 (c)：列表");
  });
  it("(b) 先续传再数；从没传过的不走续传", () => {
    const s = main.slice(main.indexOf("async function settleReturnOnce("), main.indexOf("const inToHandle"));
    assert(s.indexOf("resumeOwedPush(never)") < s.indexOf("planReturn("));
    assert(/!es\.isPushOwed\(\) \|\| never\.has\(id\)/.test(s));
  });
  it("跟上网盘的路不等人答：问在最后、不 await", () => {
    const f = /function afterSignIn\(\): Promise<void> \{[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
    assert(/ask\?\.\(\);/.test(f) && f.indexOf("refreshOpenDoc") < f.indexOf("ask?.()"));
    assert(!/dirty\.pushAll/.test(f), "回线不自己批量推");
  });
});
