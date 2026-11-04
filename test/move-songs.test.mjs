// 搬家（src/app/move-songs.ts，家族工单 H3 ③）：字节核过才动旧库；任何一步不对 = 这一首原封不动。created 2026-11-03 by Claude Opus 5.5
//   真 FSA + 真 store = test/e2e/folder-home.mjs。
import { describe, it, assert, eq } from "./runner.mjs";
import { moveSongs, moveKindOf, moveFinished, moveSay, sameBytes } from "../src/app/move-songs.ts";

const u8 = (s) => new TextEncoder().encode(s);
function world(old, there = {}) {
  const src = new Map(Object.entries(old).map(([k, v]) => [k, u8(v)])), dst = new Map(Object.entries(there).map(([k, v]) => [k, u8(v)]));
  const log = [];
  const p = {
    read: async (id) => { log.push(`read ${id}`); return src.get(id) ?? null; },
    readBack: async (id) => { log.push(`back ${id}`); return dst.get(id) ?? null; },
    write: async (id, b) => { log.push(`write ${id}`); if (dst.has(id)) throw new Error("name taken"); dst.set(id, b); },
    remove: async (id) => { log.push(`remove ${id}`); src.delete(id); },
    altName: (id) => id.replace(/\.mxl$/, "-beef.mxl"),
  };
  return { src, dst, log, p };
}
const move = (id) => ({ identifier: id, kind: "move" });

describe("搬家 · 顺序", () => {
  it("读 → 写 → 读回来比 → 才移走（顺序不许反）", async () => {
    const w = world({ "a.mxl": "AAA" });
    const r = await moveSongs([move("a.mxl")], w.p);
    eq(w.log.join(" | "), "read a.mxl | back a.mxl | write a.mxl | back a.mxl | remove a.mxl");
    eq(r.moved.length, 1); assert(moveFinished(r));
    assert(sameBytes(w.dst.get("a.mxl"), u8("AAA")) && !w.src.has("a.mxl"));
  });
  it("三首：新家三首字节相等、旧库空", async () => {
    const w = world({ "a.mxl": "AAA", "夹/b.mxl": "BBB", "c.mxl": "CCC" });
    const r = await moveSongs(["a.mxl", "夹/b.mxl", "c.mxl"].map(move), w.p);
    eq(r.moved.length, 3); eq(w.src.size, 0);
    assert(sameBytes(w.dst.get("夹/b.mxl"), u8("BBB")), "文件夹路径跟着走");
  });
});
describe("搬家 · 出错不动旧库", () => {
  it("写进去的字节对不上 = 不移走", async () => {
    const w = world({ "a.mxl": "AAA" });
    w.p.write = async (id) => { w.dst.set(id, u8("AAX")); };
    const r = await moveSongs([move("a.mxl")], w.p);
    eq(r.failed.length, 1); assert(w.src.has("a.mxl"), "旧库还在"); assert(!moveFinished(r));
    assert(!w.log.some((l) => l.startsWith("remove")), "没调移走");
  });
  it("写失败 / 写完读不回来 / 读不到旧的 = 不移走，接着搬下一首", async () => {
    const w = world({ "bad.mxl": "1", "gone.mxl": "2", "ok.mxl": "3" });
    const write = w.p.write;
    w.p.write = async (id, b) => { if (id === "bad.mxl") throw new Error("disk full"); if (id === "gone.mxl") return; return write(id, b); };
    const r = await moveSongs([move("nope.mxl"), move("bad.mxl"), move("gone.mxl"), move("ok.mxl")], w.p);
    eq(r.failed.map((x) => x.identifier).join(), "nope.mxl,bad.mxl,gone.mxl");
    eq(r.moved.map((x) => x.from).join(), "ok.mxl");
    assert(w.src.has("bad.mxl") && w.src.has("gone.mxl") && !w.src.has("ok.mxl"));
    assert(r.failed[1].why.includes("disk full"), "名单带原因");
  });
  it("移走失败：新家有了但旧库没空 = 不算完（stuck），不退役", async () => {
    const w = world({ "a.mxl": "AAA" });
    w.p.remove = async () => { throw new Error("busy"); };
    const r = await moveSongs([move("a.mxl")], w.p);
    eq(r.stuck.length, 1); eq(r.moved.length, 0); assert(!moveFinished(r));
    assert(sameBytes(w.dst.get("a.mxl"), u8("AAA")));
  });
});
describe("搬家 · 撞名不覆盖", () => {
  it("新家有同名、字节不同 = 换名写，新家原来那份一个字节没动", async () => {
    const w = world({ "a.mxl": "MINE" }, { "a.mxl": "THEIRS" });
    const r = await moveSongs([move("a.mxl")], w.p);
    eq(r.moved[0].to, "a-beef.mxl");
    assert(sameBytes(w.dst.get("a.mxl"), u8("THEIRS")), "原来的没动");
    assert(sameBytes(w.dst.get("a-beef.mxl"), u8("MINE")));
    assert(!w.src.has("a.mxl"));
  });
  it("新家有同名、字节相同 = 不重写，算搬成（搬到一半断了再来一次）", async () => {
    const w = world({ "a.mxl": "SAME" }, { "a.mxl": "SAME" });
    const r = await moveSongs([move("a.mxl")], w.p);
    assert(!w.log.some((l) => l.startsWith("write")), "没重写");
    eq(r.moved[0].to, "a.mxl"); assert(!w.src.has("a.mxl"));
  });
});
describe("搬家 · 哪些歌归它管", () => {
  it("从没同步过 = 搬走；连着网盘有没传的 = 拷一份；正本在网盘的 = 不碰", () => {
    eq(moveKindOf("float"), "move"); eq(moveKindOf("local-only"), "move");
    for (const s of ["unpushed", "conflict", "ghost"]) eq(moveKindOf(s), "copy");
    for (const s of ["synced", "newer-on-cloud", "cloud-only", "pendingGone", undefined]) eq(moveKindOf(s), null);
  });
  it("连着网盘的绝不移走（移走 = 库排一条云端删除，回线把网盘那份也删了）", async () => {
    const w = world({ "bound.mxl": "B" });
    const r = await moveSongs([{ identifier: "bound.mxl", kind: "copy" }], w.p);
    eq(r.copied.length, 1); eq(r.moved.length, 0);
    assert(!w.log.some((l) => l.startsWith("remove")), "没调移走"); assert(w.src.has("bound.mxl"));
    assert(sameBytes(w.dst.get("bound.mxl"), u8("B")));
    assert(moveFinished(r));
  });
});
describe("搬家 · 说人话", () => {
  const stem = (id) => id.replace(/\.mxl$/, "");
  it("全成 / 有失败带名单", () => {
    assert(!moveSay({ moved: [{ from: "a", to: "a" }], copied: [], failed: [], stuck: [] }, "夹", stem).bad);
    const s = moveSay({ moved: [], copied: [], failed: [{ identifier: "坏.mxl", why: "x" }], stuck: [] }, "夹", stem);
    assert(s.bad && s.text.includes("坏") && s.text.includes("一个字节没动"), s.text);
    assert(moveSay({ moved: [], copied: [], failed: [], stuck: [] }, "夹", stem).text.includes("没有要搬"));
  });
});
