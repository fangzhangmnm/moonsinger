// 混音台的插件面板（src/ui/plugins.ts，v0.10.8）：一键 = 同一组全量参数的另一种看法。created 2026-10-10 by Claude Opus 5.5
// 守的是：一键写进去再读出来是同一个值；在全量里调过 = 读不出一键（不假装）；主线程换算（自动低切 / 跟速度）对；默认 EQ 格没碰过 = 平。
import { describe, it, eq, assert } from "./runner.mjs";
import { SIMPLE, SIMPLE_BUS, simpleView, PLUGIN_KINDS, defaults, freshParams, fullParams, fxSummary, resolveChain, autoLowCutHz, paramsOf, rt60OfRoom, roomOfRt60, dampKHz, dampOfKHz, linDb, dbLin, paramView, PARAM_HINT } from "../src/ui/plugins.ts";
import { FX_KINDS } from "../src/engine/fx.ts";

describe("插件面板：一键 ↔ 全量", () => {
  it("每种插件：一键写进去再读出来 = 同一个值（几个点）", () => {
    const pts: Record<string, Record<string, number>[]> = {
      eq: [{ autoLow: 0, tilt: 0 }, { autoLow: 1, tilt: -0.5 }, { autoLow: 0, tilt: 1 }],
      comp: [{ amount: 0 }, { amount: 0.35 }, { amount: 1 }],
      reverb: [{ far: 0 }, { far: 0.4 }, { far: 1 }],
      delay: [{ echo: 0.3, beats: 0.75 }, { echo: 1, beats: 0.5 }],
      chorus: [{ wide: 0 }, { wide: 0.55 }],
      gain: [{ dB: -3 }],
    };
    for (const k of PLUGIN_KINDS) for (const v of pts[k]) {
      const back = SIMPLE[k].read(SIMPLE[k].write(v, defaults(k)));
      assert(!!back, `${k} 读不回来 ${JSON.stringify(v)}`);
      for (const [id, x] of Object.entries(v)) assert(Math.abs(back![id] - x) < 0.026, `${k}.${id}：写 ${x} 读 ${back![id]}`);
    }
  });
  it("在全量里调过（不在一键的公式上）= 读不出一键，不假装", () => {
    const eqP = SIMPLE.eq.write({ autoLow: 0, tilt: 0.5 }, defaults("eq"));
    eq(SIMPLE.eq.read({ ...eqP, midDb: -3 }), null, "挖了一刀中频");
    const c = SIMPLE.comp.write({ amount: 0.5 }, defaults("comp"));
    eq(SIMPLE.comp.read({ ...c, attackMs: 30 }), null, "改了起压");
    eq(SIMPLE.eq.read(defaults("eq")) !== null, true, "原语默认（平）= 一键的「平」");
  });
  it("一键只改公式管的那几个，别的照留（例：压缩的侧链 key 不在 params 里，不受影响；EQ 的低切自动 = hpHz 交给主线程）", () => {
    const p = SIMPLE.eq.write({ autoLow: 1, tilt: 0 }, { ...defaults("eq"), hpHz: 120 });
    eq(p.hpAuto, 1); eq(p.hpHz, 0);
  });
  it("全量 = 原语参数表的每一个（+ 主线程换算的）", () => {
    for (const k of PLUGIN_KINDS) { const ids = fullParams(k).map((d) => d.id); for (const d of FX_KINDS[k].params) assert(ids.includes(d.id), `${k} 少了 ${d.id}`); }
    assert(fullParams("eq").some((d) => d.id === "hpAuto") && fullParams("delay").some((d) => d.id === "syncBeats"));
  });
  it("新插一格 = 一键的中间值（插上就听得出在干什么）；卡片上的一句话", () => {
    eq(fxSummary({ id: "c1", kind: "comp", params: freshParams("comp") }), "压缩 -15 dB 起压 · 2.8:1", "读数是物理量（v0.10.10）");
    eq(fxSummary({ id: "eq", kind: "eq", params: freshParams("eq") }), "均衡（平）");
    eq(fxSummary({ id: "eq", kind: "eq", on: false, params: freshParams("eq") }), "均衡（关）");
    eq(fxSummary({ id: "eq", kind: "eq", params: { ...freshParams("eq"), midDb: -4 } }), "均衡（全量）");
    eq(paramsOf({ id: "x", kind: "reverb", params: {} }).room, 0.5, "缺的补默认");
  });
});

describe("路由轨上的混响 / 延迟 / 合唱 = 全湿（v0.10.9）", () => {
  it("新插在路由轨上 = 湿 100%；一键写进去再读出来还原；歌手轨上的同一个插件照旧用原来那套", () => {
    for (const k of ["reverb", "delay", "chorus"]) {
      const p = freshParams(k, true); eq(p.mix, 1, `${k} 全湿`);
      assert(!!SIMPLE_BUS[k].read(p), `${k} 读得出`); eq(SIMPLE[k].read(p), null, `${k} 在歌手轨的一键公式上不成立（全湿不在那套里）`);
      assert(simpleView(k, true) === SIMPLE_BUS[k] && simpleView(k, false) === SIMPLE[k]);
    }
    const back = SIMPLE_BUS.reverb.read(SIMPLE_BUS.reverb.write({ size: 0.7 }, defaults("reverb")))!; assert(Math.abs(back.size - 0.7) < 0.026);
    eq(fxSummary({ id: "r", kind: "reverb", params: freshParams("reverb", true) }, true), "混响 1.6 s", "路由轨上的混响读数 = 混响时间");
    eq(simpleView("eq", true), SIMPLE.eq, "EQ / 压缩在哪都一样");
  });
});

describe("主线程换算（送进录音房之前）", () => {
  it("自动低切 = 最低的音往下大三度，夹 20–300 Hz；没有音 = 关", () => {
    eq(autoLowCutHz(48), Math.round(440 * 2 ** ((48 - 69 - 4) / 12)), "C3 → 约 104 Hz");
    eq(autoLowCutHz(10), 20, "夹在 20 Hz"); eq(autoLowCutHz(90), 300, "夹在 300 Hz"); eq(autoLowCutHz(null), 0);
  });
  it("hpAuto → hpHz、syncBeats → timeMs（按速度）；别的原样；主线程的参数不送", () => {
    const out = resolveChain([{ id: "eq", kind: "eq", params: { ...freshParams("eq"), hpAuto: 1 } }, { id: "d", kind: "delay", params: freshParams("delay") }, { id: "g", kind: "gain", params: { dB: -2 } }], { lowestMidi: 57, bpm: 120 });
    eq(out[0].params.hpHz, autoLowCutHz(57)); assert(!("hpAuto" in out[0].params));
    eq(out[1].params.timeMs, 375, "附点八分 @120 = 0.75 拍 = 375 ms"); assert(!("syncBeats" in out[1].params));
    eq(out[2].params.dB, -2);
  });
});

describe("物理量纲 + 原声（v0.10.10）", () => {
  // user「房间大小为什么是百分比……不是说好都用SI吗？都用可以理解的不依赖与convention的量纲」「开了混响结果铃声都哑掉了…有可能是你混响的新手模式Preset不合理」
  it("房间大小 ↔ 混响时间 RT60（秒）互逆；高频吸收 ↔ kHz 互逆；dB ↔ 倍数", () => {
    for (const r of [0, 0.3, 0.5, 0.95]) assert(Math.abs(roomOfRt60(rt60OfRoom(r)) - r) < 1e-9, `room ${r}`);
    assert(Math.abs(rt60OfRoom(0.5) - 1.24) < 0.05, `room 0.5 ≈ 1.24 s（反馈 0.84，平均梳状 31 ms）：${rt60OfRoom(0.5)}`);
    for (const d of [0.2, 0.5, 1]) assert(Math.abs(dampOfKHz(dampKHz(d)) - d) < 1e-9, `damp ${d}`);
    assert(Math.abs(dampKHz(1) - 7.0) < 0.1, `吸收开满 = 约 7 kHz 起衰减：${dampKHz(1)}`); eq(dampKHz(0), Infinity);
    assert(Math.abs(linDb(dbLin(-12)) + 12) < 1e-9); eq(linDb(0), -60); eq(dbLin(-60), 0);
  });
  it("插在歌手轨上的混响 / 延迟 / 合唱：原声 100% 不动，旋钮只加湿；旧数据（没写原声）如实显示成 1 − 湿", () => {
    for (const k of ["reverb", "delay", "chorus"]) eq(freshParams(k).dry, 1, `${k} 原声 100%`);
    eq(paramsOf({ id: "r", kind: "reverb", params: { mix: 0.3 } }).dry, 0.7, "旧数据：录音房按 1 − 湿 算，这里也这么显示");
  });
  it("全量面板：每个参数都有一句解释；百分比只留给本来就是比例的（宽度 / 铺开）", () => {
    for (const k of PLUGIN_KINDS) for (const d of fullParams(k)) { assert(!!PARAM_HINT[`${k}.${d.id}`], `${k}.${d.id} 没有解释`); const v = paramView(k, d); if (v.fmt(d.default).endsWith("%")) assert(["reverb.width", "chorus.spread"].includes(`${k}.${d.id}`), `${k}.${d.id} 还在用百分比`); }
  });
});
