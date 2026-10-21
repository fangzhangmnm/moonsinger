// 存档编码进 worker（src/format/encode-worker.ts）：worker 里的纯函数编出来的 .mxl 和主线程 saveMxl 的打开后内容相同；saveMxl 的错原样带回。created 2026-10-21 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { runEncodeJob } from "../src/format/encode-worker.ts";
import { saveMxl, openBytes, withFinal, withoutFinal, type SaveArgs } from "../src/format/project.ts";
import { sampleSong, sampleExtras } from "./fixtures/format/sample-song.ts";

const args = (): SaveArgs => { const song = sampleSong(); return { song, hum: song.hum, extras: withoutFinal(sampleExtras(song)), app: "test", date: "2026-10-21T00:00:00.000Z", view: null, references: { ".moonsinger/references/a.txt": new TextEncoder().encode("hi") } }; };
const notes = (b: Uint8Array) => openBytes("x.mxl", b).song.papers[0].tracks[openBytes("x.mxl", b).song.parts[0].id].filter((t) => t.kind === "note").length;

describe("存档编码进 worker", () => {
  it("runEncodeJob = saveMxl：打开后同一首歌（音数 / 歌名 / 参考窗文件都在）；seq 带回；结构化克隆得过去", () => {
    const a = args();
    structuredClone(a);
    const r = runEncodeJob({ seq: 3, args: a }, () => 0);
    assert("bytes" in r, "没报错"); if (!("bytes" in r)) return;
    eq(r.seq, 3);
    const mine = saveMxl(args());
    eq(notes(r.bytes), notes(mine)); eq(openBytes("x.mxl", r.bytes).song.title, openBytes("x.mxl", mine).song.title);
    eq(new TextDecoder().decode(openBytes("x.mxl", r.bytes).references?.[".moonsinger/references/a.txt"]), "hi");
  });
  it("saveMxl 抛（定稿着内容却变了）= error 原样带回，不吞", () => {
    const a = args();
    const fin = withFinal(a.extras, { at: "2026-10-21T00:00:00.000Z", rev: 1, core: { version: "x", hash: "y" }, fingerprint: "nope", mp3: { kbps: 192, mode: "joint", secs: 1, bytes: 3 }, parts: [] } as never, new Uint8Array([1, 2, 3]));
    const r = runEncodeJob({ seq: 4, args: { ...a, extras: fin } }, () => 0);
    assert("error" in r && r.error.length > 0, `要报错：${JSON.stringify(r).slice(0, 80)}`);
  });
});
