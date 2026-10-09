// 参考窗的存法（v0.8，2026-10-08 深夜 Opus 5.5；对齐稿 ai-docs/20261008-reference-window-alignment.md）：
// `.moonsinger/references/` 整个目录原样进出（库管里面的版本和迁移）；不进 extras（不进撤销）；窗的位置 = 视图态 view.ref。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras, REFERENCES_DIR } from "../src/format/project.ts";
import { serializeDesk, unserializeDesk, freshDesk } from "../src/score/desk.ts";

const song = () => initState().song;
const enc = (s: string) => new TextEncoder().encode(s);
const save = (references?: Record<string, Uint8Array>) => saveMxl({ song: song(), hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08", ...(references ? { references } : {}) });

describe("参考窗：存法", () => {
  it("目录原样进出（字节一个不差），不进 extras.unknown", () => {
    const refs = { [`${REFERENCES_DIR}manifest.json`]: enc('{"version":1,"index":0,"items":[]}'), [`${REFERENCES_DIR}r0.png`]: new Uint8Array([137, 80, 78, 71, 1, 2, 3]) };
    const o = openBytes("x.mxl", save(refs));
    eq(JSON.stringify(Object.keys(o.references).sort()), JSON.stringify(Object.keys(refs).sort()));
    eq(JSON.stringify([...o.references[`${REFERENCES_DIR}r0.png`]]), JSON.stringify([137, 80, 78, 71, 1, 2, 3]));
    eq(Object.keys(o.extras.unknown).some((p) => p.startsWith(REFERENCES_DIR)), false);
    eq(o.notices.length, 0);
  });
  it("清单比这一版新（以后的版本存的）= 照样原样拿出来（宿主原样写回）", () => {
    const refs = { [`${REFERENCES_DIR}manifest.json`]: enc('{"version":99,"future":true}'), [`${REFERENCES_DIR}r0.xyz`]: new Uint8Array([9, 9]) };
    const back = openBytes("x.mxl", saveMxl({ song: song(), hum: "n", extras: emptyExtras(), app: "t", date: "d", references: openBytes("x.mxl", save(refs)).references }));
    eq(JSON.stringify(Object.keys(back.references).sort()), JSON.stringify(Object.keys(refs).sort()));
  });
  it("没有参考窗 = 不写这个目录；路径不在目录下 = 拒（不让宿主往别处写）", () => {
    eq(Object.keys(openBytes("x.mxl", save()).references).length, 0);
    let threw = false; try { save({ ".moonsinger/score.json": enc("{}") }); } catch { threw = true; }
    assert(threw, "目录外的路径要拒");
  });
  it("窗的位置 = 视图态：开过窗才写；宽容读（四个数不全 = 当没有）", () => {
    const d = { ...freshDesk(), ref: { open: true, left: 10, top: 20, width: 300, height: 200 } };
    eq(JSON.stringify(serializeDesk(d)?.ref), JSON.stringify({ open: true, left: 10, top: 20, width: 300, height: 200 }));
    eq(serializeDesk(freshDesk()), null, "没开过窗 = 不写");
    eq(JSON.stringify(unserializeDesk({ ref: { left: 1, top: 2, width: 3, height: 4 } }).ref), JSON.stringify({ open: false, left: 1, top: 2, width: 3, height: 4 }));
    eq(unserializeDesk({ ref: { left: 1, top: "x" } }).ref, null);
  });
});
