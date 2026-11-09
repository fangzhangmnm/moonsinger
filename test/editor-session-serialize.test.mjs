// test/editor-session-serialize.test.mjs —— 保存排队 + 每一轮记住「存给谁」+ 快照和名字同一刻取。created 2026-11-09 by Claude Fable 5.1
//   user 11-09「改保存那段代码。 修」。前八条照 WeebPaint test/editor-session-safety.test.mjs 末尾那一组搬（v0.14.66，家族根 ai-docs/20261109-editor-session-serialize.md）；
//   写歌这边多三样：release()（放下身份）插进一轮保存 = 那一轮作废；prepare（等参考窗的卡编完）放在记名字之前；adopt 的名字由本模块给。
//   以前（`_saving` 单飞锁：有一轮在存，后来的调用直接返回）在这些场景下的结果：按存什么都没做就返回；上一首的内容写到新开那首名下。
//   判据：云端不丢歌 >> 手里这一下不丢 > 自愈。
import { describe, it, eq, assert } from "./runner.mjs";
import { createEditorSession } from "../src/editor-session/index.ts";

const text = async (b) => (b && typeof b.text === "function" ? await b.text() : String(b));
const tick = () => new Promise((r) => setTimeout(r, 0));
const ticks = async (n = 4) => { for (let i = 0; i < n; i++) await tick(); };
/** 可控的台子：prepare / encode / save 的第 N 次调用可以卡住，等手动放行（像真的那样在 worker 里编码、在库里写盘和推）。 */
function rig({ holdPrepares = null, holdEncodes = [], holdSaves = [], pushOk = true } = {}) {
  const log = [];                                   // 按发生顺序记：save / open / adopt / trash / move / onSaved
  let content = "空";                               // 编辑器里现在是什么
  const calls = { prepare: 0, encode: 0, save: 0 }, gates = { prepare: new Map(), encode: new Map(), save: new Map() };
  const hold = (kind, n) => new Promise((r) => gates[kind].set(n, r));
  const store = { _saveThrows: null, _resolutions: [], file(name, opts) { return {
    open: async () => { log.push(`open ${name}`); return new Blob([`${name}@disk`]); },
    save: async (bytes, o) => {
      const n = ++calls.save, t = await text(bytes);
      if (holdSaves.includes(n)) await hold("save", n);
      if (store._saveThrows) { const e = store._saveThrows; store._saveThrows = null; throw e; }
      log.push(`save ${name} = ${t}${o?.tryPush ? " +push" : ""} (${opts.mode})`);
      return { pushed: !!o?.tryPush && pushOk, resolution: store._resolutions.shift() };
    },
    tryMove: async (to) => { log.push(`move ${name} -> ${to}`); return { ok: true }; },
    trash: async () => { log.push(`trash ${name}`); return { status: "trashed" }; },
  }; } };
  let changeCb = () => {};
  const editor = {
    adopt: async (blob, name) => { content = await text(blob); log.push(`adopt ${name} <- ${content}`); },
    encode: async () => { const n = ++calls.encode, snap = content; if (holdEncodes.includes(n)) await hold("encode", n); return { bytes: new Blob([snap]), peek: null }; },   // snap 在同步前缀里取（契约）
    onChange: (cb) => { changeCb = cb; },
    onSaved: (name) => { log.push(`onSaved ${name}`); },
  };
  if (holdPrepares) editor.prepare = async () => { const n = ++calls.prepare; if (holdPrepares.includes(n)) await hold("prepare", n); };
  const es = createEditorSession({ store, editor, isZip: true, policy: { autosaveMs: 0, pushOn: ["exit"] } });
  return { es, log, store, calls, edit: (c) => { content = c; changeCb(); }, setContent: (c) => { content = c; },
    go: (kind = "encode", n = 1) => gates[kind].get(n)?.(), saves: () => log.filter((l) => l.startsWith("save ")) };
}

describe("editor-session · 保存排队 + 记住存给谁（在飞的那一轮落地之前，别的动作不许抢跑、也不许被当成做完了）", () => {
  it("【第一级】自动保存编码到一半时换开另一首：上一首的字节落在**上一首的名字**下，新开那首一个字节都没被写；换身份等保存落地", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await tick();      // 自动保存：编码卡住
    let opened = false; const opening = r.es.open("B.mxl").then((ok) => { opened = true; return ok; });
    await ticks();
    eq(r.es.currentName(), "A.mxl", "保存没落地之前身份不换");
    eq(opened, false, "open 还在等");
    r.go(); await auto; eq(await opening, true);
    // 两次都落在 A 名下：第一次 = 在飞的那轮自动保存（只落本机）；第二次 = open 自己的「切走之前先存旧的并推」（退出语义，以前被那句直接返回一起吞掉）
    eq(r.saves().join(" | "), "save A.mxl = A 改过 (existing) | save A.mxl = A 改过 +push (existing)");
    assert(!r.log.some((l) => l.startsWith("save B.mxl")), "新开的那首没有被写：" + r.log.join(" / "));
    assert(r.log.lastIndexOf("save A.mxl = A 改过 +push (existing)") < r.log.indexOf("open B.mxl"), "先存完旧的，才去开新的：" + r.log.join(" / "));
    eq(r.es.currentName(), "B.mxl"); eq(r.es.isDirty(), false);
  });

  it("【第一级】编码到一半时被放下（歌库挪了夹 / 进了回收站 / 新建）：那一轮作废，一个字节都不写——不把搬走的名字写回来，也不写到后来的名字下", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await tick();
    r.es.release();                                    // 同步放下（排不进队）
    r.setContent("新歌的第一笔"); r.es.adopted("新歌.mxl", { create: true });   // 编辑器里已经是新歌了，A 的那一轮还在编码
    r.go(); await auto;
    eq(r.saves().length, 0, "作废的那一轮什么都没写：" + r.log.join(" / "));
    eq(r.es.currentName(), "新歌.mxl"); eq(r.es.isDirty(), true, "新歌还没存：脏旗不许被上一轮顺手清掉"); eq(r.es.isPushPending(), true);
    await r.es.flushLocal();
    eq(r.saves().join(" | "), "save 新歌.mxl = 新歌的第一笔 (new)", "新歌的首存还是走 new（撞名不覆盖）");
  });

  it("【第一级】已经交给库在写的那一下被放下：字节落在起跑时的名字下（收不回来），之后不碰新歌的旗标", async () => {
    const r = rig({ holdSaves: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await ticks();     // 编码完了，写盘卡住
    r.es.release(); r.setContent("新歌的第一笔"); r.es.adopted("新歌.mxl", { create: true });
    r.go("save"); await auto;
    eq(r.saves().join(" | "), "save A.mxl = A 改过 (existing)", "A 的快照在 A 名下，不是「新歌.mxl」");
    assert(r.log.includes("onSaved A.mxl"), "字节变了的通知带的是 A 的名字");
    eq(r.es.currentName(), "新歌.mxl"); eq(r.es.isDirty(), true); eq(r.es.isPushPending(), true);
    await r.es.flushLocal();
    eq(r.saves()[1], "save 新歌.mxl = 新歌的第一笔 (new)");
  });

  it("【按存被吞】人按存撞上在飞的自动保存：等它落地，再完整存一遍并推；快照之后的那一笔这次真的存了、推了", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("第一笔");
    const auto = r.es.flushLocal(); await tick();
    r.edit("第二笔");                                   // 自动保存取了快照之后又写了一笔
    let done = false; const forced = r.es.forceSaveAndPush().then(() => { done = true; });
    await ticks();
    eq(done, false, "按存不许在什么都没存的时候就说自己完了");
    eq(r.saves().length, 0);
    r.go(); await auto; await forced;
    eq(r.saves().join(" | "), "save A.mxl = 第一笔 (existing) | save A.mxl = 第二笔 +push (existing)");
    eq(r.es.isDirty(), false); eq(r.es.isPushPending(), false); eq(r.es.isPushOwed(), false);
  });

  it("按存没推成：记下欠的这一推（排队之后这句账照旧）", async () => {
    const r = rig({ pushOk: false });
    await r.es.open("A.mxl"); r.edit("第一笔");
    await r.es.forceSaveAndPush();
    eq(r.es.isPushPending(), true); eq(r.es.isPushOwed(), true);
  });

  it("flushLocal 撞上在飞的那一轮：落地时调用之前的改动都在盘上了（没变就不重存）", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("第一笔");
    const first = r.es.flushLocal(); await tick();
    const second = r.es.flushLocal();                  // 中间没有新改动
    r.go(); await first; await second;
    eq(r.saves().length, 1, "前一轮已经把该存的存了，后一个不重复编码");
    const r2 = rig({ holdEncodes: [1] });               // 另一种：中间有新改动
    await r2.es.open("A.mxl"); r2.edit("第一笔");
    const a = r2.es.flushLocal(); await tick(); r2.edit("第二笔"); const b = r2.es.flushLocal();
    r2.go(); await a; await b;
    eq(r2.saves().join(" | "), "save A.mxl = 第一笔 (existing) | save A.mxl = 第二笔 (existing)");
    eq(r2.es.isDirty(), false);
  });

  it("同名重开（云端快进用的那条）也排在在飞的保存后面：装进来的是保存之后的字节，不是之前的", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await tick();
    const re = r.es.open("A.mxl");
    await ticks(); eq(r.log.filter((l) => l === "open A.mxl").length, 1, "第二次 open 还没开始读盘");
    r.go(); await auto; await re;
    assert(r.log.indexOf("save A.mxl = A 改过 (existing)") < r.log.lastIndexOf("open A.mxl"), r.log.join(" / "));
  });

  it("改名、删除也排队：在飞的保存先落到旧名字，再搬 / 再进回收站（不是刚删掉又被存回来）", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await tick();
    const mv = r.es.rename("B.mxl");
    r.go(); await auto; eq((await mv).ok, true);
    assert(r.log.indexOf("save A.mxl = A 改过 (existing)") < r.log.indexOf("move A.mxl -> B.mxl"), r.log.join(" / "));
    eq(r.es.currentName(), "B.mxl");
    const d = rig({ holdEncodes: [1] });
    await d.es.open("A.mxl"); d.edit("A 改过");
    const auto2 = d.es.flushLocal(); await tick();
    const del = d.es.delete();
    d.go(); await auto2; await del;
    assert(d.log.indexOf("save A.mxl = A 改过 (existing)") < d.log.indexOf("trash A.mxl"), d.log.join(" / "));
    eq(d.es.currentName(), null);
    assert(!d.log.slice(d.log.indexOf("trash A.mxl")).some((l) => l.startsWith("save ")), "进回收站之后没有再写");
  });

  it("前一轮失败不把队卡死：失败只报给它自己的调用方，后面的照常跑", async () => {
    const r = rig();
    await r.es.open("A.mxl"); r.edit("第一笔");
    r.store._saveThrows = new Error("磁盘满了");
    let firstErr = null; const first = r.es.flushLocal().catch((e) => { firstErr = e; });
    const second = r.es.flushLocal();
    await first; await second;
    assert(firstErr && /磁盘满了/.test(firstErr.message), "第一轮的失败给了第一轮的调用方");
    eq(r.es.isDirty(), false, "第二轮接着跑、存成了");
    eq(r.saves().join(" | "), "save A.mxl = 第一笔 (existing)");
  });

  it("写盘那一下身份被换走之后才失败：不把新歌的旗标改成上一首的", async () => {
    const r = rig({ holdSaves: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    r.store._saveThrows = new Error("写不进去");
    let err = null; const auto = r.es.flushLocal().catch((e) => { err = e; }); await ticks();
    r.es.release(); r.setContent("新歌"); r.es.adopted("新歌.mxl", { create: true });
    r.go("save"); await auto;
    assert(err, "那一轮的失败照常抛");
    eq(r.es.currentName(), "新歌.mxl"); eq(r.es.isDirty(), true); eq(r.es.isPushPending(), true);
    await r.es.flushLocal(); eq(r.saves().join(" | "), "save 新歌.mxl = 新歌 (new)", "首存的 new 也没被上一轮弄丢");
  });
});

describe("editor-session · 快照和名字同一刻取（等参考窗的卡 = prepare，在记名字之前等）", () => {
  it("【第一级】等的时候换了一首：按换了之后的那一首判断，内容和名字是同一首的——绝不把新歌的内容写到上一首的名字下", async () => {
    const r = rig({ holdPrepares: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await tick();      // 等卡片编完
    r.es.release(); r.setContent("新歌的第一笔"); r.es.adopted("新歌.mxl", { create: true });
    r.go("prepare"); await auto;
    eq(r.saves().join(" | "), "save 新歌.mxl = 新歌的第一笔 (new)");
    assert(!r.log.some((l) => l.startsWith("save A.mxl")), "上一首的名字没有被写：" + r.log.join(" / "));
    eq(r.es.isDirty(), false);
  });
  it("等的时候被放下、没有新的家：什么都不写", async () => {
    const r = rig({ holdPrepares: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    const auto = r.es.flushLocal(); await tick();
    r.es.release(); r.setContent("一张空谱");
    r.go("prepare"); await auto;
    eq(r.saves().length, 0); eq(r.calls.encode, 0, "连快照都不取"); eq(r.es.currentName(), null);
  });
  it("没东西要存的时候不等（不脏 = 不调 prepare）；按存照常等完再存", async () => {
    const r = rig({ holdPrepares: [] });
    await r.es.open("A.mxl");
    await r.es.flushLocal(); eq(r.calls.prepare, 0);
    await r.es.forceSaveAndPush(); eq(r.calls.prepare, 1); eq(r.saves().join(" | "), "save A.mxl = A.mxl@disk +push (existing)");
  });
  it("按存、等的时候换了一首：「按了存」说的是上一首，新开的这首不脏就不动它", async () => {
    const r = rig({ holdPrepares: [1] });
    await r.es.open("A.mxl");
    const forced = r.es.forceSaveAndPush(); await tick();
    r.es.release(); r.setContent("新歌"); r.es.adopted("新歌.mxl", { create: true });   // adopted = 脏
    r.go("prepare"); await forced;
    eq(r.saves().join(" | "), "save 新歌.mxl = 新歌 +push (new)", "新歌是脏的（刚安家）所以照平常的规矩存了；没有任何一笔写到 A 名下");
    eq(r.es.isPushOwed(), false, "「欠一推」这句账说的是上一首，不记到新歌头上");
  });
});

describe("editor-session · 装进来的字节是谁的，由本模块告诉 app（adopt 的第二个参数）", () => {
  it("开一首：名字 = 开的那一首", async () => {
    const r = rig();
    await r.es.open("A.mxl");
    assert(r.log.includes("adopt A.mxl <- A.mxl@disk"), r.log.join(" / "));
  });
  it("A 的保存里选了「云端覆盖本地」，这时已经有一个 open(B) 等在后面：重载装的是 A 的字节、名字也是 A；然后才轮到 B", async () => {
    const r = rig({ holdEncodes: [1] });
    await r.es.open("A.mxl"); r.edit("A 改过");
    r.store._resolutions = ["takeCloud"];
    const pushing = r.es.flushAndPush(); await tick();
    const opening = r.es.open("B.mxl");
    r.go(); await pushing; await opening;
    const adopts = r.log.filter((l) => l.startsWith("adopt "));
    eq(adopts.join(" | "), "adopt A.mxl <- A.mxl@disk | adopt A.mxl <- A.mxl@disk | adopt B.mxl <- B.mxl@disk");
    assert(!r.log.some((l) => l.startsWith("save B.mxl")), r.log.join(" / "));
    eq(r.es.currentName(), "B.mxl");
  });
});
