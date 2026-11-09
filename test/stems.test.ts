// stems.test.ts —— 符干、符杠、符尾的几何（src/render/stems.ts；刀 4a 从 engrave.ts 第 7 步抽出来的纯函数）。created 2026-11-09 by Claude Opus 5.5
// 版面逐位不变由刀 1 的快照守（test/engrave-printable.test.ts）；这里钉的是规矩本身，单位 = 线间距、y 从第五线往下量（局部坐标）。
import { describe, it, assert, eq } from "./runner.mjs";
import { TPQ } from "../src/score/song.ts";
import { layoutStems, yLocal, flagLevel, type StemNote, type Frame } from "../src/render/stems.ts";

const Q = TPQ, E = TPQ / 2, S = TPQ / 4, H = TPQ * 2, W = TPQ * 4;
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
let n = 0;
/** 一个音：d = 谱上的级数（高音谱号 34 = 第三线 B4）；beat = 第几拍。 */
const note = (d: number, base: number, beat: number, o: Partial<StemNote<number>> = {}): StemNote<number> => ({ key: n++, x: n * 3, dHi: d, dLo: d, base, beat, system: 0, staff: 1, ghost: false, ...o });

describe("符干的朝向", () => {
  it("单个音：中线以下朝上、中线以上朝下、正好在中线 = 朝下", () => {
    const lo = note(30, Q, 0), hi = note(38, Q, 1), mid = note(34, Q, 2);
    const r = layoutStems([lo, hi, mid], "auto");
    eq(r.notes.get(lo.key)!.up, true); eq(r.notes.get(hi.key)!.up, false); eq(r.notes.get(mid.key)!.up, false);
  });
  it("连杠的一组按平均：一高一低平均在中线下 = 一起朝上", () => {
    const a = note(29, E, 0), b = note(36, E, 0);   // 平均 32.5 < 34
    const r = layoutStems([a, b], "auto");
    eq(r.notes.get(a.key)!.up, true); eq(r.notes.get(b.key)!.up, true); eq(r.groups.length, 1);
  });
  it("up / down 一律；kit = 一组里有手打的就朝上", () => {
    const a = note(40, Q, 0), b = note(28, Q, 1);
    eq(layoutStems([a], "up").notes.get(a.key)!.up, true);
    eq(layoutStems([b], "down").notes.get(b.key)!.up, false);
    const foot = note(30, E, 0), hand = note(38, E, 0, { handUp: true }), foot2 = note(30, E, 1), foot3 = note(30, E, 1);
    const k = layoutStems([foot, hand, foot2, foot3], "kit");
    eq(k.notes.get(foot.key)!.up, true, "和手打的同组 = 朝上");
    eq(k.notes.get(foot2.key)!.up, false, "一组全是脚踩 = 朝下");
  });
});

describe("符干长度（单个音）", () => {
  it("3.5 个线间距；低音区朝上的符干尖至少到中线", () => {
    const a = note(32, Q, 0), r = layoutStems([a], "auto").notes.get(a.key)!;
    assert(near(r.tip, yLocal(32) - 3.5), `tip ${r.tip}`);
    const low = note(20, Q, 1), rl = layoutStems([low], "auto").notes.get(low.key)!;   // 下加三线以下
    assert(near(rl.tip, yLocal(34)), `低音的符干尖到中线：${rl.tip}`);
  });
  it("叠音的符干从远端那个符头起，尖从近端那个算", () => {
    const c = note(30, Q, 0, { dHi: 33, dLo: 30 }), r = layoutStems([c], "auto").notes.get(c.key)!;
    eq(r.up, true);
    assert(r.y0 > yLocal(31), "朝上 = 从最低的符头起");
    assert(near(r.tip, yLocal(33) - 3.5), "尖 = 最高的符头往上 3.5");
  });
});

describe("连杠的分组", () => {
  it("同一拍的八分连在一起；换拍 / 小节线（null）/ 四分 / 休止都断开", () => {
    const a = note(34, E, 0), b = note(34, E, 0), c = note(34, E, 1), d = note(34, E, 1), e = note(34, Q, 2), f = note(34, E, 3), g = note(34, E, 3);
    const r = layoutStems([a, b, c, null, d, e, f, g], "auto");
    eq(r.groups.map((x) => x.keys.length).join(","), "2,1,1,1,2");
    eq(r.notes.get(c.key)!.beamed, false, "小节线后面换了一组，前面剩一个 = 单个音");
    assert(r.notes.get(c.key)!.flag !== null, "单个八分 = 有符尾");
    eq(r.notes.get(a.key)!.flag, null, "连杠的没符尾");
  });
  it("换行、换谱表（大谱表上下）断开", () => {
    const a = note(34, E, 0), b = note(34, E, 0, { system: 1 }), c = note(34, E, 0, { system: 1, staff: 2 });
    eq(layoutStems([a, b, c], "auto").groups.length, 3);
  });
  it("全音符 = 打断、不画符干", () => {
    const a = note(34, E, 0), w = note(34, W, 0), b = note(34, E, 0);
    const r = layoutStems([a, w, b], "auto");
    eq(r.notes.has(w.key), false); eq(r.groups.length, 2);
  });
});

describe("符杠", () => {
  it("斜率 = 首尾落差 / 距离 × 0.5，夹在 ±0.2；每个符头离符杠至少 3.5", () => {
    const a = note(30, E, 0, { x: 0 }), b = note(37, E, 0, { x: 3 });
    const r = layoutStems([a, b], "auto"), bm = r.groups[0].beams[0];
    const k = (bm.yR - bm.yL) / (bm.xR - bm.xL);
    assert(near(Math.abs(k), 0.2, 0.02), `斜率夹到 0.2：${k}`);
    for (const s of [a, b]) { const o = r.notes.get(s.key)!; assert(yLocal(s.dHi) - o.tip >= 3.5 - 1e-9, `离符头至少 3.5：${yLocal(s.dHi) - o.tip}`); }
  });
  it("八分 + 十六分 + 十六分：第二层只连后两个；八分 + 十六分：半截杠朝左（组里最后一个）", () => {
    const a = note(32, E, 0), b = note(32, S, 0), c = note(32, S, 0);
    const r = layoutStems([a, b, c], "auto");
    eq(r.groups[0].beams.length, 2);
    const two = layoutStems([note(32, E, 0, { x: 0 }), note(32, S, 0, { x: 3 })], "auto").groups[0].beams;
    eq(two.length, 2);
    assert(two[1].xR < 3 + 1.18 + 0.01 && two[1].xL < two[1].xR, "半截杠在最后那个音的左边");
  });
  it("朝下的组：杠厚往上长（th < 0）；全是幽灵音 = 杠画淡", () => {
    const a = note(38, E, 0, { ghost: true }), b = note(38, E, 0, { ghost: true });
    const bm = layoutStems([a, b], "auto").groups[0].beams[0];
    assert(bm.th < 0, "朝下 = 往上长"); eq(bm.ghost, true);
  });
});

describe("符尾", () => {
  it("层数：八分 1、十六分 2、三十二分 3、四分 0", () => {
    eq([E, S, TPQ / 8, Q, H].map(flagLevel).join(","), "1,2,3,0,0");
  });
});

describe("坐标系：像素 = 局部 × sp + 那一行的顶线", () => {
  it("同一串音在两种坐标里只差一个仿射（排版器画的、天际线量的是同一样东西）", () => {
    const seq = [note(30, E, 0, { x: 2 }), note(36, S, 0, { x: 5 }), note(33, S, 0, { x: 7 }), null, note(40, Q, 0, { x: 11 }), note(26, E, 1, { x: 14 })];
    const sp = 7.3, top = 123.4, px: Frame<number> = { u: sp, y: (d) => top + yLocal(d) * sp };
    const L = layoutStems(seq, "auto"), Pz = layoutStems(seq.map((s) => (s ? { ...s, x: s.x * sp } : null)), "auto", px);
    for (const [k, l] of L.notes) {
      const p = Pz.notes.get(k)!;
      eq(p.up, l.up);
      assert(near(p.x, l.x * sp, 1e-6) && near(p.tip, top + l.tip * sp, 1e-6) && near(p.y0, top + l.y0 * sp, 1e-6) && near(p.top, top + l.top * sp, 1e-6), `第 ${k} 个音`);
    }
    L.groups.forEach((g, i) => g.beams.forEach((b, j) => { const q = Pz.groups[i].beams[j]; assert(near(q.yL, top + b.yL * sp, 1e-6) && near(q.th, b.th * sp, 1e-9), `第 ${i} 组第 ${j} 根杠`); }));
  });
});
