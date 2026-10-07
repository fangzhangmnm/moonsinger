// 无地逃生口的文件层（src/app/doc-file.ts）：陈旧对表、拖进来抓文件、认扩展名；导出副本的文件名（src/app/names.ts）。
// created 2026-10-07 by Claude Fable 5.1（v0.3.0「把无地做完美」）。系统文件框 / 句柄本身进 smoke（test/file-smoke.mjs）和真机。
import { describe, it, eq, assert } from "./runner.mjs";
import { isStale, accepts, grabDrop, fromGrab } from "../src/app/doc-file.ts";
import { stampedCopy, defaultStem } from "../src/app/names.ts";

describe("陈旧对表 isStale", () => {
  it("两边都知道、不一样 = 陈旧（文件在外面被改过）", () => { eq(isStale(1000, 2000), true); });
  it("一样 = 不陈旧", () => { eq(isStale(1000, 1000), false); });
  it("任一边不知道（null）= 不算陈旧（不拿「不知道」吓人）", () => { eq(isStale(null, 2000), false); eq(isStale(1000, null), false); eq(isStale(null, null), false); });
});

describe("认文件名 accepts", () => {
  it(".mxl / .musicxml / .xml（不分大小写）认；别的不认", () => {
    for (const n of ["a.mxl", "b.MXL", "c.musicxml", "d.xml"]) assert(accepts(n), n);
    for (const n of ["a.txt", "b.mp3", "mxl", "c.mxl.png"]) assert(!accepts(n), n);
  });
});

describe("拖进来 grabDrop / fromGrab", () => {
  const file = (name: string) => new File([new TextEncoder().encode("<score-partwise/>")], name, { type: "text/xml" });
  const item = (f: File, handle?: unknown) => ({ kind: "file", getAsFile: () => f, ...(handle === undefined ? {} : { getAsFileSystemHandle: async () => handle }) });
  const dt = (items: unknown[], files: File[] = []) => ({ items, files }) as unknown as DataTransfer;
  it("只认第一个认得的文件；没有认得的 = null（这次 drop 不拦）", async () => {
    eq(grabDrop(dt([item(file("x.txt")), item(file("y.mxl"))]))?.file.name, "y.mxl");
    eq(grabDrop(dt([item(file("x.txt"))])), null);
    eq(grabDrop(dt([{ kind: "string", getAsFile: () => null }])), null);
  });
  it("桌面 Chromium：getAsFileSystemHandle 给的文件句柄 = 有家；给目录 / 拒绝 = 没家", async () => {
    const h = { kind: "file", name: "y.mxl", getFile: async () => file("y.mxl"), createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
    const p1 = await fromGrab(grabDrop(dt([item(file("y.mxl"), h)]))!);
    eq(p1.handle, h); eq(p1.name, "y.mxl"); assert(p1.bytes.length > 0); assert(p1.mtime != null);
    const p2 = await fromGrab(grabDrop(dt([item(file("y.mxl"), { kind: "directory", name: "dir" })]))!);
    eq(p2.handle, null);
    const g3 = grabDrop(dt([{ ...item(file("y.mxl")), getAsFileSystemHandle: async () => { throw new Error("denied"); } }]))!;
    eq((await fromGrab(g3)).handle, null);
  });
  it("没有 items 的老浏览器：看 files，没句柄", async () => {
    const p = await fromGrab(grabDrop(dt([], [file("z.musicxml")]))!);
    eq(p.name, "z.musicxml"); eq(p.handle, null);
  });
});

describe("导出副本的文件名 stampedCopy", () => {
  it("名-YYYYMMDD-HHMM", () => { eq(stampedCopy("20261007-春の歌", new Date(2026, 9, 7, 9, 5)), "20261007-春の歌-20261007-0905"); });
  it("默认名 yyyymmdd-hex4 不变（接 gallery 时换 galleryDefaultName）", () => { assert(/^\d{8}-[0-9a-f]{4}$/.test(defaultStem(new Date(2026, 9, 7)))); });
});
