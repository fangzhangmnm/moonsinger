// 这首歌的家（src/app/home.ts）：三种家 × 存 / 改名 / 离开 / 安家 的矩阵，全用假的 ports（零 DOM、零持久化）。created 2026-10-21 by Claude Fable 5.1（F-49 Home 接口）
import { describe, it, eq, assert } from "./runner.mjs";
import { createHome, type Home, type HomePorts } from "../src/app/home.ts";
import type { FileHandle } from "../src/app/doc-file.ts";

const handleOf = (name: string): FileHandle => ({ name, getFile: async () => new File([], name), createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) });

function make(o: { home?: Home; stem?: string; named?: boolean; dirty?: boolean; title?: string; canPick?: boolean; pick?: FileHandle | null; mtimeNow?: number | null; occupied?: string[]; discard?: boolean; overwrite?: boolean; renameFails?: "cloud" | "local"; flushThrows?: boolean; pushThrows?: boolean } = {}) {
  const log: string[] = [];
  const state = { dirty: o.dirty ?? false, title: o.title ?? "", mtime: o.mtimeNow === undefined ? 100 : o.mtimeNow, occupied: new Set(o.occupied ?? []) };
  let fresh = 0;
  const ports: HomePorts = {
    gallery: {
      save: async () => { log.push("gallery.save"); },
      flushLocal: async () => { log.push("flushLocal"); if (o.flushThrows) throw new Error("disk full"); },
      flushAndPush: async () => { log.push("flushAndPush"); if (o.pushThrows) throw new Error("offline"); },
      markDirty: () => { log.push("markDirty"); },
      adopted: (id, a) => { log.push(`adopted:${id}:${a.create}`); },
      release: () => { log.push("release"); },
      rename: async (to) => { log.push(`rename:${to}`); return o.renameFails ? { ok: false, where: o.renameFails } : { ok: true, oldKept: false }; },
      occupied: async (id) => state.occupied.has(id),
    },
    file: {
      canPickSave: () => o.canPick ?? false,
      pickSave: async (name) => { log.push(`pickSave:${name}`); return o.pick ?? null; },
      writeTo: async (h) => { log.push(`write:${h.name}`); },
      mtime: async () => state.mtime,
      isStale: (seen, now) => seen != null && now != null && seen !== now,
    },
    ids: { join: (folder, stem) => `${folder ? folder + "/" : ""}${stem}.mxl`, parse: (id) => { const m = /^(?:(.*)\/)?([^/]+)\.mxl$/.exec(id); return m ? { folder: m[1] ?? "", stem: m[2] } : null; } },
    suffix: ".mxl",
    bytes: () => new Uint8Array([1, 2, 3]),
    dirty: () => state.dirty,
    title: () => state.title,
    freshStem: () => `20261021-${(++fresh).toString(16).padStart(4, "0")}`,
    ask: { discard: async (what) => { log.push(`ask.discard:${what}`); return o.discard ?? false; }, overwriteStale: async (n) => { log.push(`ask.overwrite:${n}`); return o.overwrite ?? false; } },
    offerDownload: (_b, name, onSaved) => { log.push(`offer:${name}`); (ports as unknown as { lastOffer: () => void }).lastOffer = onSaved; },
    markSaved: () => { log.push("markSaved"); state.dirty = false; },
    report: (e, level) => { log.push(`report:${level}:${(e as Error).message}`); },
    onHome: (p, n) => { log.push(`home:${p.kind}->${n.kind}`); },
    onName: () => { log.push("name"); },
  };
  const H = createHome({ home: o.home ?? { kind: "none", pendingFolder: null }, stem: o.stem ?? "20261021-abcd", named: o.named ?? false }, ports);
  return { H, log, state, ports: ports as HomePorts & { lastOffer?: () => void } };
}
const gallery = (identifier: string): Home => ({ kind: "gallery", identifier });
const file = (name: string, mtime: number | null = 100): Home => ({ kind: "file", handle: handleOf(name), mtime });
const pending = (folder = ""): Home => ({ kind: "none", pendingFolder: folder });

describe("家：名字", () => {
  it("没存过 = 年月日-歌名；没歌名 = 默认名；定下来了 = stem 不看歌名", () => {
    const { H, state } = make({ title: "春の歌" });
    eq(H.name(), "20261021-春の歌"); eq(H.fileName(), "20261021-春の歌.mxl");
    state.title = ""; eq(H.name(), "20261021-abcd");
    state.title = "a/b:c"; eq(H.name(), "20261021-abc", "文件系统不认的字符去掉");
    const named = make({ title: "春の歌", named: true, stem: "小星星" }); eq(named.H.name(), "小星星");
  });
  it("load：歌库 / 本机文件的名字永远定下来；本机文件的 fileName = 句柄的名字", () => {
    const { H } = make({ title: "x" });
    H.load(gallery("夹/小星星.mxl"), { stem: "小星星", named: false }); eq(H.named, true); eq(H.name(), "小星星"); eq(H.identifier(), "夹/小星星.mxl");
    H.load(file("twinkle.mxl"), { stem: "twinkle", named: false }); eq(H.named, true); eq(H.fileName(), "twinkle.mxl"); eq(H.identifier(), null);
  });
});

describe("家：换家的唯一出口", () => {
  it("歌库 → 本机文件 / 还没家 = 放下 es 的身份（autosave 绝不能把新内容写进上一首）；歌库 → 歌库另一首不放", () => {
    const { H, log } = make({ home: gallery("a.mxl"), stem: "a", named: true });
    H.load(file("t.mxl"), { stem: "t", named: true });
    eq(log.join(","), "release,home:gallery->file,name");
    log.length = 0; H.load(gallery("b.mxl"), { stem: "b", named: true }); eq(log.join(","), "home:file->gallery,name");
    log.length = 0; H.load(gallery("c.mxl"), { stem: "c", named: true }); eq(log.join(","), "home:gallery->gallery,name", "歌库换歌库 = 不 release（es.open 自己处置了旧的）");
    log.length = 0; H.release(); eq(log.join(","), "release,home:gallery->none"); eq(H.home.kind, "none");
    log.length = 0; H.release(); eq(log.length, 0, "不在歌库 release = no-op");
  });
  it("同一个家再 load = 不叫 onHome（云端快进重载同一首）", () => {
    const { H, log } = make({ home: gallery("a.mxl"), stem: "a", named: true });
    H.load(gallery("a.mxl"), { stem: "a", named: true }); eq(log.length, 0);
  });
});

describe("家：存 = 回家", () => {
  it("歌库 = 走宿主的 smart save", async () => {
    const { H, log } = make({ home: gallery("a.mxl"), stem: "a", named: true, dirty: true });
    eq((await H.save()).k, "gallery"); eq(log.join(","), "gallery.save");
  });
  it("本机文件：写前对 mtime——没变直接写回 + markSaved；变了先问，不让覆盖 = declined 一个字节不写", async () => {
    const fresh = make({ home: file("t.mxl", 100), stem: "t", named: true, dirty: true });
    const r = await fresh.H.save(); eq(r.k, "written"); eq(fresh.log.join(","), "write:t.mxl,markSaved");
    const stale = make({ home: file("t.mxl", 50), stem: "t", named: true, dirty: true });
    eq((await stale.H.save()).k, "declined"); eq(stale.log.join(","), "ask.overwrite:t.mxl"); assert(stale.state.dirty, "没存 = 还脏");
    const ok = make({ home: file("t.mxl", 50), stem: "t", named: true, dirty: true, overwrite: true });
    eq((await ok.H.save()).k, "written"); eq(ok.log.join(","), "ask.overwrite:t.mxl,write:t.mxl,markSaved");
    assert(ok.H.home.kind === "file" && ok.H.home.mtime === 100, "写回后 mtime 基准前移");
  });
  it("还没家 + 能开保存框：取消 = cancelled；存了 = 家变成那个文件、名字 = 文件名", async () => {
    const c = make({ canPick: true, pick: null, dirty: true, title: "春" });
    eq((await c.H.save()).k, "cancelled"); eq(c.log.join(","), "pickSave:20261021-春.mxl"); eq(c.H.home.kind, "none");
    const s = make({ canPick: true, pick: handleOf("我的歌.mxl"), dirty: true, title: "春" });
    const r = await s.H.save(); eq(r.k, "written"); assert(r.k === "written" && r.name === "我的歌.mxl");
    eq(s.H.home.kind, "file"); eq(s.H.stem, "我的歌"); eq(s.H.named, true);
    eq(s.log.join(","), "pickSave:20261021-春.mxl,write:我的歌.mxl,home:none->file,name,markSaved");
  });
  it("还没家 + 没有保存框（iPad）：递出下载；点了才算存了（名字定下来 + markSaved）", async () => {
    const { H, log, ports } = make({ dirty: true, title: "春" });
    const r = await H.save(); eq(r.k, "offered"); eq(log.join(","), "offer:20261021-春.mxl"); eq(H.named, false, "没点 = 还没存");
    ports.lastOffer!(); eq(H.named, true); eq(H.stem, "20261021-春"); eq(log.slice(1).join(","), "name,markSaved");
  });
  it("等着安家的空谱：没笔 = blank 不塞空壳；有笔 = 先安家（铸身份、es 接管、落本地）再走歌库的存", async () => {
    const b = make({ home: pending("夹") }); eq((await b.H.save()).k, "blank"); eq(b.log.length, 0);
    const s = make({ home: pending("夹"), dirty: true, title: "春" });
    eq((await s.H.save()).k, "gallery");
    eq(s.H.identifier(), "夹/20261021-春.mxl"); eq(s.H.named, true);
    eq(s.log.join(","), "home:none->gallery,name,adopted:夹/20261021-春.mxl:true,flushLocal,gallery.save");
  });
});

describe("家：安家", () => {
  it("撞名加 -hex4，不加序号；单飞；落盘失败 = 身份留着、报错（下一轮 autosave 再试）", async () => {
    const { H, log } = make({ home: pending(""), dirty: true, title: "春", occupied: ["20261021-春.mxl"] });
    const p1 = H.settle(), p2 = H.settle(); assert(p1 === p2, "单飞");
    await p1; eq(H.identifier(), "20261021-春-0001.mxl");
    eq(log.filter((l) => l.startsWith("adopted")).length, 1);
    const bad = make({ home: pending(""), dirty: true, flushThrows: true });
    await bad.H.settle(); eq(bad.H.home.kind, "gallery"); assert(bad.log.includes("report:error:disk full"));
  });
  it("途中换了歌 = 作罢（不把身份套在别的歌上）", async () => {
    const { H, log } = make({ home: pending("夹"), dirty: true });
    const p = H.settle();
    H.load({ kind: "none", pendingFolder: null }, { stem: "z", named: false });
    await p; eq(H.home.kind, "none"); assert(!log.some((l) => l.startsWith("adopted")));
  });
  it("noteChanged：歌库 + 脏 = 告诉 es；等着安家 + 脏 = 安家；不脏什么都不做", async () => {
    const g = make({ home: gallery("a.mxl"), stem: "a", named: true, dirty: true }); g.H.noteChanged(); eq(g.log.join(","), "markDirty");
    const clean = make({ home: gallery("a.mxl"), stem: "a", named: true }); clean.H.noteChanged(); eq(clean.log.length, 0);
    const p = make({ home: pending(""), dirty: true }); p.H.noteChanged(); await new Promise((r) => setTimeout(r, 0)); await p.H.settle(); eq(p.H.home.kind, "gallery");
  });
  it("存进歌库：无地稿 / 本机文件的稿 = 铸身份进那个夹（文件名沿用）；等着安家的 = 有笔就安家、没笔 blank", async () => {
    const f = make({ home: file("t.mxl"), stem: "t", named: true, dirty: true });
    const r = await f.H.intoGallery("夹"); assert(r.k === "moved" && r.flushed && r.identifier === "夹/t.mxl");
    eq(f.log.join(","), "home:file->gallery,adopted:夹/t.mxl:true,flushLocal", "本机文件 → 歌库不 release（es 本来就没举着身份）");
    const p = make({ home: pending("夹") }); eq((await p.H.intoGallery("别的夹")).k, "blank");
    const pe = make({ home: pending("夹"), dirty: true }); const r2 = await pe.H.intoGallery("别的夹"); assert(r2.k === "settled" && r2.identifier.startsWith("夹/"), "安家进的是等着的那个夹");
    const bad = make({ dirty: true, flushThrows: true }); const r3 = await bad.H.intoGallery(""); assert(r3.k === "moved" && !r3.flushed); eq(bad.H.home.kind, "gallery", "身份留着（es 举着新名字，下一轮再试）");
  });
});

describe("家：改文件名", () => {
  it("还没家 = 只改下次存的名字；空名 / 没变 = same", async () => {
    const { H, log } = make({ title: "春" });
    eq((await H.rename("  ")).k, "same"); eq((await H.rename("20261021-春")).k, "same");
    const r = await H.rename("我的歌"); assert(r.k === "renamed" && r.stem === "我的歌"); eq(H.named, true); eq(log.join(","), "name");
  });
  it("本机文件 = 改不了（在文件管理器里改）", async () => {
    const { H } = make({ home: file("t.mxl"), stem: "t", named: true });
    const r = await H.rename("x"); assert(r.k === "fileHome" && r.name === "t.mxl");
  });
  it("歌库 = store tryMove：成了换身份；占了 = taken 身份不变", async () => {
    const ok = make({ home: gallery("夹/a.mxl"), stem: "a", named: true });
    const r = await ok.H.rename("b"); assert(r.k === "renamed"); eq(ok.H.identifier(), "夹/b.mxl"); eq(ok.log.join(","), "rename:夹/b.mxl,home:gallery->gallery,name");
    const taken = make({ home: gallery("夹/a.mxl"), stem: "a", named: true, renameFails: "cloud" });
    const t = await taken.H.rename("b"); assert(t.k === "taken" && t.where === "cloud"); eq(taken.H.identifier(), "夹/a.mxl");
  });
});

describe("家：离开", () => {
  it("歌库 = 落盘 + 推、不问（推不上 = 报 warning 照样走）；切到歌库另一首 = 不重复推", async () => {
    const g = make({ home: gallery("a.mxl"), stem: "a", named: true, dirty: true });
    assert(await g.H.leave("新建")); eq(g.log.join(","), "flushAndPush");
    const bad = make({ home: gallery("a.mxl"), stem: "a", named: true, pushThrows: true });
    assert(await bad.H.leave("新建")); eq(bad.log.join(","), "flushAndPush,report:warning:offline");
    const sw = make({ home: gallery("a.mxl"), stem: "a", named: true, dirty: true });
    assert(await sw.H.leave("打开「b」", { nextIsGallery: true })); eq(sw.log.length, 0);
  });
  it("本机文件 / 还没家：改过没存先问；干净直接走", async () => {
    const d = make({ home: file("t.mxl"), stem: "t", named: true, dirty: true, discard: false });
    assert(!(await d.H.leave("打开别的歌"))); eq(d.log.join(","), "ask.discard:打开别的歌");
    const go = make({ dirty: true, discard: true }); assert(await go.H.leave("新建"));
    const clean = make(); assert(await clean.H.leave("新建")); eq(clean.log.length, 0);
  });
  it("等着安家的空谱有笔 = 先安家再按歌库那条走（不当无地稿问「丢掉？」）", async () => {
    const { H, log } = make({ home: pending("夹"), dirty: true });
    assert(await H.leave("进歌库")); eq(H.home.kind, "gallery");
    assert(!log.some((l) => l.startsWith("ask.")), "没问「丢掉？」"); assert(log.includes("flushAndPush"));
  });
});
