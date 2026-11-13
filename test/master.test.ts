// 总轨（studio.json master；src/format/project.ts activeMaster / withMaster）：没写 = 0 dB + 限幅开；改了进 extras；夹在 −24…+12；存读往返。created 2026-10-10 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { emptyExtras, templateExtras, activeMaster, withMaster, saveMxl, openBytes } from "../src/format/project.ts";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";
import { initState } from "../src/score/song.ts";

describe("总轨", () => {
  it("新建 = 模板：0 dB、限幅开、限幅器四个数（0.98 / 3 / 150 / 9）；老文件没有 master 字段 / 没有四个数 = 读文件的门口按模板补（16-4 A2 / C）", () => {
    const song = initState().song, m = activeMaster(templateExtras(song)); eq(m.gainDb, 0); eq(m.limiter, true);
    eq(JSON.stringify(m.limiterParams), JSON.stringify({ ceiling: 0.98, attackMs: 3, releaseMs: 150, lookaheadMs: 9 }));
    const z = unzipSync(saveMxl({ song, extras: templateExtras(song), app: "t", date: "2026-11-12T00:00:00.000Z" })), k = ".moonsinger/studio.json", j = JSON.parse(strFromU8(z[k]!));
    delete j.master; z[k] = strToU8(JSON.stringify(j));
    const o = openBytes("old.mxl", zipSync(z)), m2 = activeMaster(o.extras);
    eq(m2.gainDb, 0); eq(m2.limiter, true); eq(m2.limiterParams.lookaheadMs, 9); eq(o.notices.join(""), "", "不说话");
  });
  it("改增益 / 关限幅进 extras；夹在 −24…+12；别的（麦克风）不动", () => {
    let x = withMaster(emptyExtras(), { gainDb: -3 }); eq(activeMaster(x).gainDb, -3); eq(activeMaster(x).limiter, true);
    x = withMaster(x, { limiter: false }); eq(activeMaster(x).limiter, false); eq(activeMaster(x).gainDb, -3);
    eq(activeMaster(withMaster(x, { gainDb: 99 })).gainDb, 12); eq(activeMaster(withMaster(x, { gainDb: -99 })).gainDb, -24);
    eq(Array.isArray((x.studio as { tracks: unknown[] }).tracks), true);
  });
  it("存进 .mxl 再读回来：总轨还在", () => {
    const st = initState(), x = withMaster(emptyExtras(), { gainDb: -6, limiter: false });
    const bytes = saveMxl({ song: st.song, extras: x, app: "test", date: "2026-10-10" }), back = openBytes("t.mxl", bytes);
    const m = activeMaster(back.extras); eq(m.gainDb, -6); eq(m.limiter, false);
  });
});
