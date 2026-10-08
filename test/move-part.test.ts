// 声部上下挪（Song.parts 的顺序 = 谱上从上到下）。created 2026-10-08 by Claude Opus 5.5（user「声部顺序应该能重排」）
import { describe, it, eq } from "./runner.mjs";
import { initState, addPart, movePart, writeDegree, tr } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";

describe("声部上下挪", () => {
  let st = initState(); st = writeDegree(st, 1, "near");
  st = addPart(st, { id: "P2", role: "r2", mic: "m2" }); st = addPart(st, { id: "P3", role: "r3", mic: "m3" });
  const ids = (s: typeof st) => s.song.parts.map((p) => p.id).join(",");
  it("往上 / 往下挪一格；挪到头 = 原样（同一个对象）", () => {
    eq(ids(st), "P1,P2,P3");
    const up = movePart(st, "P3", -1); eq(ids(up), "P1,P3,P2");
    eq(ids(movePart(up, "P3", -1)), "P3,P1,P2");
    eq(movePart(st, "P1", -1), st); eq(movePart(st, "P3", 1), st);
  });
  it("只换顺序：每条 track 的内容不动", () => {
    const m = movePart(st, "P1", 1);
    eq(JSON.stringify(m.song.papers), JSON.stringify(st.song.papers));
    eq(tr(m).length, tr(st).length);
  });
  it("存 → 开：顺序留着", () => {
    const m = movePart(movePart(st, "P3", -1), "P3", -1);
    const o = openBytes("x.mxl", saveMxl({ song: m.song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08T00:00:00.000Z" }));
    eq(o.song.parts.map((p) => p.id).join(","), "P3,P1,P2");
  });
});
