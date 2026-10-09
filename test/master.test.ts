// 总轨（studio.json master；src/format/project.ts activeMaster / withMaster）：没写 = 0 dB + 限幅开；改了进 extras；夹在 −24…+12；存读往返。created 2026-10-10 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { emptyExtras, activeMaster, withMaster, saveMxl, openBytes } from "../src/format/project.ts";
import { initState } from "../src/score/song.ts";

describe("总轨", () => {
  it("默认：0 dB、限幅开；老文件没有 master 字段也一样", () => { const m = activeMaster(emptyExtras()); eq(m.gainDb, 0); eq(m.limiter, true); });
  it("改增益 / 关限幅进 extras；夹在 −24…+12；别的（麦克风）不动", () => {
    let x = withMaster(emptyExtras(), { gainDb: -3 }); eq(activeMaster(x).gainDb, -3); eq(activeMaster(x).limiter, true);
    x = withMaster(x, { limiter: false }); eq(activeMaster(x).limiter, false); eq(activeMaster(x).gainDb, -3);
    eq(activeMaster(withMaster(x, { gainDb: 99 })).gainDb, 12); eq(activeMaster(withMaster(x, { gainDb: -99 })).gainDb, -24);
    eq(Array.isArray((x.studio as { tracks: unknown[] }).tracks), true);
  });
  it("存进 .mxl 再读回来：总轨还在", () => {
    const st = initState(), x = withMaster(emptyExtras(), { gainDb: -6, limiter: false });
    const bytes = saveMxl({ song: st.song, hum: "n", extras: x, app: "test", date: "2026-10-10" }), back = openBytes("t.mxl", bytes);
    const m = activeMaster(back.extras); eq(m.gainDb, -6); eq(m.limiter, false);
  });
});
