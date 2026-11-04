// 歌库「全部导出」（家族 library-needs-a-home §4 第 1 步）。created 2026-11-03 by Claude Opus 5.5（家族工单 H）
import { describe, it, assert, eq } from "./runner.mjs";
import { exportAll, exportAllSay } from "../src/app/export-all.ts";

const blob = (s) => new Blob([s]);
const ports = (over = {}) => ({
  listFolder: async (f) => (f === "" ? { identifiers: ["a.mxl"], folders: ["夹"] } : { identifiers: ["夹/b.mxl"], folders: [] }),
  bytes: async (id) => blob("bytes of " + id),
  pack: async (entries) => { const b = blob("zip"); b.entries = entries; return b; },
  ...over,
});
describe("全部导出", () => {
  it("文件夹结构跟着走，每首都进", async () => {
    const r = await exportAll(ports());
    eq(r.count, 2); eq(r.failed.length, 0);
    eq(r.zip.entries.map((e) => e.path).join(), "a.mxl,夹/b.mxl");
    eq(new TextDecoder().decode(r.zip.entries[1].data), "bytes of 夹/b.mxl");
  });
  it("拿不到的进名单，不算全部成功（UX 误导 = 数据安全缺陷）", async () => {
    const r = await exportAll(ports({ bytes: async (id) => (id === "a.mxl" ? null : blob("x")) }));
    eq(r.count, 1); eq(r.failed.join(), "a.mxl");
    const said = exportAllSay(r, "x.zip");
    assert(said.bad && /只导出了 1 首/.test(said.text) && said.text.includes("a.mxl"), said.text);
  });
  it("一个文件夹列不出来：别的照走，名单里写明", async () => {
    const r = await exportAll(ports({ listFolder: async (f) => { if (f) throw new Error("x"); return { identifiers: ["a.mxl"], folders: ["夹"] }; } }));
    eq(r.count, 1); assert(r.failed[0].includes("夹"), r.failed.join());
  });
  it("一首都没有 = 不出空包", async () => {
    const r = await exportAll(ports({ listFolder: async () => ({ identifiers: [], folders: [] }) }));
    eq(r.zip, null);
    const said = exportAllSay(r, "x.zip");
    assert(!said.bad && /还没有歌/.test(said.text), said.text);
  });
});
