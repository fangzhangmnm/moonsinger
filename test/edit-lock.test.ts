// 修改锁（家族「源文件原则上只读：手动解锁才能改」）的纯逻辑：分类表 / 「这首锁着吗」/ 写入口 / 撤销重做 / 脏分两种 / 家的写回 / 编辑会话的保存。
//   created 2026-11-10 by Claude Fable 5.2（设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md 第八节 + 第十四节补遗）。全是假的 ports，零 DOM、零持久化。
import { describe, it, eq, assert } from "./runner.mjs";
import { LOOK_OPS, isLookOp, lookOpInFile, sameExceptPaperHidden, sameExceptSongView, sameModuloLooks, effectiveKind } from "../src/app/edit-lock-table.ts";
import { setNotation, setChordTags, setViewInC, setPartChords } from "../src/score/song-view.ts";
import { createEditLock, type LockHome, type LockStore } from "../src/app/edit-lock.ts";
import { createDocument, type DocHooks } from "../src/app/document.ts";
import { createHome, type Home, type HomePorts } from "../src/app/home.ts";
import { createEditorSession, type EditorAdapter, type StoreLike } from "../src/editor-session/editor-session.ts";
import { initState, addPaper, setPaperHidden, type EditorState } from "../src/score/song.ts";
import { emptyExtras } from "../src/format/project.ts";
import type { LocusKind } from "../src/score/history.ts";
import type { FileHandle } from "../src/app/doc-file.ts";

describe("修改锁 · 分类表", () => {
  it("表里现在两类看法（曲段隐藏、这首歌怎么看），都进文件；没列的 / 没给的一律不是看法", () => {
    eq(Object.keys(LOOK_OPS).join(","), "paperHidden,songLook");
    assert(isLookOp("paperHidden") && lookOpInFile("paperHidden"));
    assert(isLookOp("songLook") && lookOpInFile("songLook"), "这首歌怎么看（谱面分家第三刀）：存在歌里、锁着能切");
    for (const k of ["score", "paper", "lounge", "studio", "cover", "final", "toString", "", undefined, null]) assert(!isLookOp(k as string), String(k));
  });
  it("「只差隐藏」按引用核：隐藏 / 放出来 = 是；顺手改了名字、动了音、换了歌名 = 不是", () => {
    const st = addPaper(initState()), a = st.song, pid = a.papers[1]!.id;
    const hid = setPaperHidden(st, pid, true).song;
    assert(sameExceptPaperHidden(a, hid) && sameExceptPaperHidden(hid, a) && sameExceptPaperHidden(a, a));
    assert(sameExceptPaperHidden(a, setPaperHidden({ ...st, song: hid }, pid, false).song), "放回来 = 新对象但只差隐藏");
    assert(!sameExceptPaperHidden(a, { ...hid, title: "x" }), "歌名变了");
    assert(!sameExceptPaperHidden(a, { ...hid, papers: hid.papers.map((p) => (p.id === pid ? { ...p, name: "改了名" } : p)) }), "顺手改了曲段名");
    assert(!sameExceptPaperHidden(a, { ...hid, papers: hid.papers.map((p) => (p.id === pid ? { ...p, tracks: { ...p.tracks } } : p)) }), "tracks 换了对象 = 可能动了音");
    assert(!sameExceptPaperHidden(a, { ...a, papers: a.papers.slice(0, 1) }), "少了一张纸");
  });
  it("「只差这首歌怎么看」按引用核：谱种 / 和弦标级数 / 按 C 调看 / 每轨和弦选项 = 是；顺手改了歌名、动了声部的别的字段、加了声部 = 不是；两类看法合起来 = sameModuloLooks", () => {
    const st = addPaper(initState()), a = st.song, part = a.parts[0]!.id;
    for (const b of [setNotation(st, "jianpu").song, setChordTags(st, false).song, setViewInC(st, true).song, setPartChords(st, part, "stacked").song])
      assert(sameExceptSongView(a, b) && sameExceptSongView(b, a) && !sameExceptPaperHidden(a, b), "切一样 = 只差这首歌怎么看");
    const look = setViewInC(st, true);
    assert(!sameExceptSongView(a, { ...look.song, title: "偷改" }), "顺手改歌名");
    assert(!sameExceptSongView(a, { ...look.song, parts: look.song.parts.map((p) => ({ ...p, host: "x" })) }), "动了声部的别的字段");
    assert(!sameExceptSongView(a, { ...look.song, parts: [...look.song.parts, { id: "P9", role: "r9", mic: "m9" }] }), "加了声部");
    const both = setPaperHidden(look, a.papers[1]!.id, true).song;
    assert(sameModuloLooks(a, both) && !sameExceptSongView(a, both) && !sameExceptPaperHidden(a, both), "两类看法一起动 = 只差看法");
    assert(!sameModuloLooks(a, { ...both, credits: "x" }));
  });
  it("自己报的类别要核：真的只动了看法 = 原样；动了别的 / 连 extras 一起动 = 当内容", () => {
    const st = addPaper(initState()), pid = st.song.papers[1]!.id, hid = setPaperHidden(st, pid, true).song;
    eq(effectiveKind<LocusKind>("paperHidden", "score", st.song, hid, false), "paperHidden");
    eq(effectiveKind<LocusKind>("paperHidden", "score", st.song, { ...hid, title: "x" }, false), "score");
    eq(effectiveKind<LocusKind>("paperHidden", "score", st.song, hid, true), "score");
    eq(effectiveKind<LocusKind>("studio", "score", st.song, hid, false), "studio", "不是看法的类别不核、原样");
  });
});

function lockWorld(o: { home?: LockHome; store?: LockStore | null; pending?: boolean; loading?: boolean } = {}) {
  const w = { home: o.home ?? ({ kind: "none" } as LockHome), store: o.store === undefined ? null : o.store, pending: !!o.pending, loading: !!o.loading, flashes: 0, changes: [] as string[] };
  const lock = createEditLock({ store: () => w.store, home: () => w.home, createPending: () => w.pending, loading: () => w.loading });
  lock.onFlash(() => { w.flashes++; }); lock.onChange((_l, s) => { w.changes.push(s); });
  return { w, lock };
}
function fakeStore(lockByDefault = true) {
  const unlocked = new Set<string>(); let cb: ((live: unknown[]) => void) | null = null, watches = 0;
  const store: LockStore = { lockByDefault, unlockOf: (id) => (unlocked.has(id) ? { identifier: id } : null), watchUnlocks: (f) => { cb = f; watches++; return () => { cb = null; }; } };
  return { store, unlock: (id: string) => { unlocked.add(id); cb?.([...unlocked]); }, relock: (id: string) => { unlocked.delete(id); cb?.([...unlocked]); }, watches: () => watches };
}

describe("修改锁 · 这首锁着吗（一处回答，现算）", () => {
  it("还没有家的新歌：这把锁不管，什么都放", () => {
    const { lock, w } = lockWorld();
    eq(lock.state(), "none"); assert(!lock.locked() && !lock.canLockNow()); eq(lock.writeGate("score"), null); eq(w.flashes, 0);
  });
  it("硬盘上的单个文件：打开默认锁着；内容被拒并闪一下，曲段隐藏放行；「接着改」解到换开别的文件为止；锁上 = 回到锁着", () => {
    const h1 = {}, h2 = {};
    const { lock, w } = lockWorld({ home: { kind: "file", handle: h1 } });
    lock.refresh();
    assert(lock.locked() && lock.isLocalFile());
    eq(lock.writeGate("score"), "edit-locked"); eq(lock.writeGate("studio"), "edit-locked"); eq(w.flashes, 2);
    eq(lock.writeGate("paperHidden"), null); eq(w.flashes, 2, "看法放行不闪");
    assert(lock.unlockLocalFile()); eq(lock.state(), "unlocked"); assert(lock.canLockNow()); eq(lock.writeGate("score"), null);
    w.home = { kind: "file", handle: h2 }; lock.refresh();
    assert(lock.locked(), "换开另一个文件：重新锁着");
    w.home = { kind: "file", handle: h1 }; lock.refresh();
    assert(lock.locked(), "再开回原来那个：上次的解锁不带过来");
    lock.unlockLocalFile(); lock.lockLocalFile(); assert(lock.locked());
    eq(w.changes.join(","), "locked,unlocked,locked,unlocked,locked");
  });
  it("新歌存成的文件生来解着（先记句柄、再换家，同一个同步段）", () => {
    const h = {};
    const { lock, w } = lockWorld();
    lock.keepLocalFileUnlocked(h); w.home = { kind: "file", handle: h }; lock.refresh();
    eq(lock.state(), "unlocked");
  });
  it("不是硬盘文件时「接着改」那个口什么都不做", () => {
    const fs = fakeStore();
    const { lock } = lockWorld({ home: { kind: "gallery", identifier: "a.mxl" }, store: fs.store });
    assert(!lock.unlockLocalFile()); assert(lock.locked());
  });
  it("歌库里的歌：库没开锁 / 没有库 = 不管；开了 = 没有活着的解锁就锁着；刚新建还没首存的不管；库叫一声就跟上", () => {
    const off = lockWorld({ home: { kind: "gallery", identifier: "a.mxl" }, store: fakeStore(false).store });
    eq(off.lock.state(), "none"); assert(!off.lock.identifierLocked("a.mxl"));
    eq(lockWorld({ home: { kind: "gallery", identifier: "a.mxl" }, store: null }).lock.state(), "none");
    const fs = fakeStore();
    const { lock, w } = lockWorld({ home: { kind: "gallery", identifier: "a.mxl" }, store: fs.store });
    lock.refresh(); eq(fs.watches(), 1);
    assert(lock.locked() && lock.identifierLocked("a.mxl") && !lock.isLocalFile());
    w.pending = true; eq(lock.state(), "none"); eq(lock.writeGate("score"), null); w.pending = false;
    fs.unlock("a.mxl"); eq(lock.state(), "unlocked"); assert(!lock.identifierLocked("a.mxl") && lock.identifierLocked("b.mxl"));
    fs.relock("a.mxl"); assert(lock.locked());
    lock.refresh(); lock.refresh(); eq(fs.watches(), 1, "库没换 = 不重订");
    eq(w.changes.join(","), "locked,unlocked,locked");
  });
  it("装入期间放行（整份装入不算改）", () => {
    const { lock, w } = lockWorld({ home: { kind: "file", handle: {} }, loading: true });
    eq(lock.writeGate("score"), null); w.loading = false; eq(lock.writeGate("score"), "edit-locked");
  });
});

function doc(o: { normalize?: (s: EditorState) => EditorState } = {}) {
  const log: string[] = []; let t = 1000; const g = { locked: false };
  const hooks: DocHooks = {
    now: () => t, onState: () => undefined, onExtras: () => undefined,
    onRefused: (w, k) => log.push(`refused:${k}:${w}`), onRestored: (r, verb) => log.push(`${verb}:${r.locus.kind}`),
    writeGate: (kind) => (g.locked && !isLookOp(kind) ? "edit-locked" : null), lockedWhy: () => (g.locked ? "锁着" : null),
    ...(o.normalize ? { normalize: o.normalize } : {}),
  };
  const D = createDocument({ st: addPaper(initState()), extras: emptyExtras() }, hooks);
  D.markSaved();
  const hide = (on: boolean, gesture?: string) => D.commit({ st: setPaperHidden(D.st, D.st.song.papers[1]!.id, on) }, { locus: { kind: "paperHidden", label: on ? "隐藏" : "放出来" }, ...(gesture ? { gesture } : {}) });
  return { D, log, g, hide, write: () => D.run({ k: "degree", degree: 1, dir: "near" }), tick: (ms: number) => { t += ms; } };
}

describe("修改锁 · 写入口和撤销重做（第 ②③ 道）", () => {
  it("锁着：写音 / 改 extras 被拒（带类别）、谱不变；挪光标照常；曲段隐藏放行", () => {
    const { D, log, g, hide, write } = doc(); g.locked = true;
    const song = D.st.song;
    assert(!write().ok); assert(!D.commit({ extras: { ...D.extras } }, { locus: { kind: "studio", label: "推子" } }).ok);
    eq(D.st.song, song); eq(log.join("|"), "refused:score:谱 / 歌名 / 作者栏|refused:studio:混音");
    assert(D.run({ k: "caret", d: -1 }).ok, "光标不归锁管");
    assert(hide(true).ok && D.st.song.papers[1]!.hidden === true); eq(D.history.past.length, 1); eq(D.history.past[0]!.locus.kind, "paperHidden");
    eq(D.locked(), "锁着");
  });
  it("锁着：这首歌怎么看（四样各切一下）放行，进撤销栈、类别 songLook；自称 songLook 实际改了歌名 = 当内容拒", () => {
    const { D, log, g } = doc(); g.locked = true;
    const look = (next: EditorState) => D.commit({ st: next }, { locus: { kind: "songLook", label: "看谱" } });
    const part = D.st.song.parts[0]!.id;
    for (const f of [(x: EditorState) => setViewInC(x, true), (x: EditorState) => setChordTags(x, false), (x: EditorState) => setNotation(x, "jianpu"), (x: EditorState) => setPartChords(x, part, "stacked")]) assert(look(f(D.st)).ok);
    const s = D.st.song;
    eq([s.inC, s.chordTags, s.notation, s.parts[0]!.chords].join(","), "true,false,jianpu,stacked"); eq(D.history.past.length, 4);
    assert(D.history.past.every((x) => x.locus.kind === "songLook")); eq(D.dirtyKind(), "looks"); eq(log.length, 0);
    assert(!look({ ...setViewInC(D.st, false), song: { ...setViewInC(D.st, false).song, title: "偷改" } }).ok); eq(log.join("|"), "refused:score:谱 / 歌名 / 作者栏");
    assert(D.undo() && D.st.song.parts[0]!.chords === undefined, "撤销这一格也是看法：锁着照样能翻");
  });
  it("标签不是证据：自称曲段隐藏、实际改了曲段名 → 当内容拒", () => {
    const { D, log, g } = doc(); g.locked = true;
    const pid = D.st.song.papers[1]!.id, st = setPaperHidden(D.st, pid, true);
    const sneaky: EditorState = { ...st, song: { ...st.song, papers: st.song.papers.map((p) => (p.id === pid ? { ...p, name: "偷改" } : p)) } };
    assert(!D.commit({ st: sneaky }, { locus: { kind: "paperHidden", label: "隐藏" } }).ok);
    eq(log.join("|"), "refused:score:谱 / 歌名 / 作者栏"); assert(!D.st.song.papers[1]!.hidden);   // 按内容问、按内容说
  });
  it("规整多补了东西 = 不只是看法：按内容问（没锁时照做，栈里记成内容）", () => {
    const { D, g, hide } = doc({ normalize: (s) => ({ ...s, song: { ...s.song, credits: (s.song.credits ?? "") + "+" } }) });   // 每次规整都多补一点
    assert(hide(true).ok); eq(D.history.past[0]!.locus.kind, "score");
    g.locked = true; assert(!hide(false).ok);
  });
  it("看法不并格：带着同一个 gesture 连做两下 = 两格", () => {
    const { D, hide } = doc();
    hide(true, "g"); hide(false, "g");
    eq(D.history.past.length, 2);
  });
  it("撤销按要翻的那一格问：翻的是看法就翻，翻到内容那一格就停、栈原样；重做同理", () => {
    const { D, log, g, hide, write } = doc();
    assert(write().ok); g.locked = true; assert(hide(true).ok);
    assert(D.undo(), "撤回隐藏"); assert(!D.st.song.papers[1]!.hidden); eq(D.history.past.length, 1); eq(D.history.future.length, 1);
    assert(!D.undo(), "下一格是写音：停"); eq(D.history.past.length, 1); eq(log.at(-1), "refused:score:撤销");
    assert(D.redo(), "重做隐藏"); assert(D.st.song.papers[1]!.hidden === true);
    g.locked = false; D.undo(); D.undo(); g.locked = true;
    assert(!D.redo(), "要重做的是写音：停"); eq(log.at(-1), "refused:score:重做");
  });
  it("脏分两种：只动了隐藏 = looks；动了音 / 混音 = content；存好 = clean", () => {
    const { D, hide, write } = doc();
    eq(D.dirtyKind(), "clean"); assert(!D.dirty());
    hide(true); eq(D.dirtyKind(), "looks"); assert(D.dirty());
    D.markSaved(); eq(D.dirtyKind(), "clean");
    write(); eq(D.dirtyKind(), "content");
    D.markSaved(); D.commit({ extras: { ...D.extras, studio: { version: 2, tracks: [], master: { gainDb: -3, limiter: true, chain: [] } } as never } }, { locus: { kind: "studio", label: "总轨" } });
    eq(D.dirtyKind(), "content");
  });
});

const handleOf = (name: string): FileHandle => ({ name, getFile: async () => new File([], name), createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) });
function house(o: { home: Home; locked?: boolean; dirty?: boolean; pick?: FileHandle }) {
  const log: string[] = []; const s = { locked: !!o.locked, dirty: !!o.dirty };
  const ports: HomePorts = {
    gallery: { save: async () => { log.push("gallery.save"); }, flushLocal: async () => { log.push("flushLocal"); }, flushAndPush: async () => { log.push("flushAndPush"); }, markDirty: () => { log.push("markDirty"); },
      adopted: () => undefined, release: () => { log.push("release"); }, rename: async () => ({ ok: true }), occupied: async () => false },
    file: { canPickSave: () => !!o.pick, pickSave: async () => o.pick ?? null, writeTo: async (h) => { log.push(`write:${h.name}`); }, mtime: async () => 100, isStale: () => false },
    ids: { join: (f, st) => `${f ? f + "/" : ""}${st}.mxl`, parse: (id) => { const m = /^(?:(.*)\/)?([^/]+)\.mxl$/.exec(id); return m ? { folder: m[1] ?? "", stem: m[2]! } : null; } },
    suffix: ".mxl", bytes: () => new Uint8Array([1]), dirty: () => s.dirty, title: () => "", freshStem: () => "20261110-0001",
    ask: { discard: async (what) => { log.push(`ask.discard:${what}`); return false; }, overwriteStale: async () => false },
    offerDownload: () => undefined, markSaved: () => { log.push("markSaved"); }, report: () => undefined,
    onHome: (p, n) => { log.push(`home:${p.kind}->${n.kind}`); }, onName: () => undefined,
    locked: () => s.locked, onFileBorn: (h) => { log.push(`born:${h.name}`); },
  };
  return { H: createHome({ home: o.home, stem: "x", named: true }, ports), log, s };
}

describe("修改锁 · 家的写回（第 ④ 道：硬盘文件那条路不经过编辑会话）", () => {
  it("硬盘文件锁着：存 = 一个字节都不写；解了才写", async () => {
    const { H, log, s } = house({ home: { kind: "file", handle: handleOf("a.mxl"), mtime: 100 }, locked: true, dirty: true });
    eq((await H.save()).k, "locked"); eq(log.join(","), "");
    s.locked = false; eq((await H.save()).k, "written"); assert(log.includes("write:a.mxl"));
  });
  it("歌库里的歌锁着：存也不走（编辑会话那里还有一道）", async () => {
    const { H, log } = house({ home: { kind: "gallery", identifier: "a.mxl" }, locked: true });
    eq((await H.save()).k, "locked"); eq(log.join(","), "");
  });
  it("离开一首锁着、没有要存的东西的文件：不问、直接走", async () => {
    const { H, log } = house({ home: { kind: "file", handle: handleOf("a.mxl"), mtime: 100 }, locked: true, dirty: false });
    assert(await H.leave("打开别的")); eq(log.join(","), "");
  });
  it("还没有家的新歌存成文件：先报「这个句柄生来解着」、再换家", async () => {
    const { H, log } = house({ home: { kind: "none", pendingFolder: null }, pick: handleOf("new.mxl"), dirty: true });
    eq((await H.save()).k, "written");
    eq(log.filter((x) => /^born|^home/.test(x)).join(","), "born:new.mxl,home:none->file");
  });
});

function session(o: { locked?: () => boolean } = {}) {
  const log: string[] = []; let pushed = true;
  const store: StoreLike = { file: (name, opts) => ({ open: async () => new Blob(["x"]), save: async (_b, so) => { log.push(`save:${name}:${opts.mode}${so?.tryPush ? ":push" : ""}`); return { pushed: !!so?.tryPush && pushed }; }, tryMove: async () => ({ ok: true }), trash: async () => ({ status: "trashed" }) }) };
  const editor: EditorAdapter = { adopt: async () => undefined, onChange: () => undefined, encode: async () => { log.push("encode"); return { bytes: new Blob(["y"]) }; },
    onRefused: (why) => log.push(`refused:${why}`), editLocked: (name) => (o.locked?.() ? `锁着:${name}` : null) };
  return { es: createEditorSession({ store, editor, isZip: true }), log, setPushed: (v: boolean) => { pushed = v; } };
}

describe("修改锁 · 编辑会话的保存（第 ④ 道：歌库这条路）", () => {
  it("锁着 ∧ 有改动：不编码、不存、脏留着，说一次（同一代编辑不重复）；解了照常存", async () => {
    let locked = true;
    const { es, log } = session({ locked: () => locked });
    await es.open("a.mxl"); es.markDirty();
    await es.flushLocal(); await es.flushLocal();
    eq(log.join(","), "refused:锁着:a.mxl"); assert(es.isDirty());
    locked = false; await es.flushLocal();
    eq(log.slice(1).join(","), "encode,save:a.mxl:existing"); assert(!es.isDirty());
  });
  it("锁着 ∧ 人按了存（不脏也算）：说一次、不存", async () => {
    const { es, log } = session({ locked: () => true });
    await es.open("a.mxl"); await es.forceSaveAndPush();
    eq(log.join(","), "refused:锁着:a.mxl");
  });
  it("锁着 ∧ 只欠一推：什么都不做、也不说（补推归库）", async () => {
    let locked = false;
    const { es, log, setPushed } = session({ locked: () => locked });
    await es.open("a.mxl"); es.markDirty(); setPushed(false); await es.flushAndPush();
    assert(!es.isDirty() && es.isPushPending()); const n = log.length;
    locked = true; await es.flushAndPush();
    eq(log.length, n, log.join(","));
  });
  it("歌库里刚新建还没首存的那首不问锁（它还不在库里）", async () => {
    const { es, log } = session({ locked: () => true });
    es.adopted("new.mxl", { create: true }); assert(es.createPending());
    await es.flushLocal();
    eq(log.join(","), "encode,save:new.mxl:new"); assert(!es.createPending());
  });
});
